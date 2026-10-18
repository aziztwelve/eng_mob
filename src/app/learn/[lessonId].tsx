import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, StatusBar, KeyboardAvoidingView, Keyboard, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useLesson } from '@/hooks/use-lessons';
import { useCompleteStep } from '@/hooks/use-progress';
import { useStepSubmit } from '@/hooks/use-step-submit';
import { useHearts } from '@/hooks/use-hearts';
import { SKY, SkyLessonHeader, SkyScreen } from '@/components/lesson/sky-lesson-header';
import { useLessonGamificationFx } from '@/hooks/use-gamification-fx';
import { fx } from '@/lib/fx';
import { useMarkLessonCompleted } from '@/lib/lesson-progress';
import {
  TextContent,
  QuizContent,
  ActivityContent,
  UserAchievement,
  isInteractiveStep,
  SubmitAnswerResponse,
} from '@/types/api';
// import { VideoStep } from '@/components/lesson/video-step'; // DISABLED: crashes on Android API 29
import { TextStep } from '@/components/lesson/text-step';
import { QuizStep } from '@/components/lesson/quiz-step';
import { StepRenderer } from '@/components/lesson/StepRenderer';
import { WordSelectionStep, selectionCandidatesFromSteps } from '@/components/vocabulary/WordSelectionStep';
import { ActivityStep } from '@/components/lesson/activity-step';
import {
  AchievementModal,
  LevelUpOverlay,
  XPGainAnimation,
} from '@/components/gamification';

// CTA gradient — голубой, как кнопки Game Play (Figma 246:15988).
const CTA_GRADIENT = [SKY.blue, SKY.blueDark] as const;

// Helper: legacy quiz формат содержит массив `questions`. Phase-2 quiz —
// одиночный `options[]`. Парсинг без выкидывания исключения.
function tryHasQuestions(raw: string): boolean {
  try {
    const v = JSON.parse(raw);
    return Array.isArray((v as { questions?: unknown[] })?.questions);
  } catch {
    return false;
  }
}

export default function LessonPlayerScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { data: lessonData, isLoading, error } = useLesson(lessonId);
  const completeStepMutation = useCompleteStep();
  const submitStepMutation = useStepSubmit();
  const fireGamificationFx = useLessonGamificationFx();
  const markLessonCompleted = useMarkLessonCompleted();
  const { data: heartsData } = useHearts();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showWordSelection, setShowWordSelection] = useState(false);
  const wordCandidates = useMemo(
    () => lessonData ? selectionCandidatesFromSteps(lessonData.steps) : [],
    [lessonData],
  );
  const [startTime] = useState(Date.now());

  // Local FX state — рендерим оверлеи прямо в этом экране.
  const [xpGain, setXpGain] = useState<{ amount: number; key: number } | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<UserAchievement[]>([]);
  const [levelUpTo, setLevelUpTo] = useState<number | null>(null);

  // Android (edge-to-edge): KeyboardAvoidingView 'height' keeps a stale shrunken
  // height, so lift the content by the keyboard height manually.
  // A text field from the previous step is unmounted but its keyboard can stay open.
  useEffect(() => {
    Keyboard.dismiss();
  }, [currentStepIndex]);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (isLoading) {
    return (
      <SkyScreen style={styles.center}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={SKY.blue} />
        <Text style={styles.loadingText}>{t('lesson.loading')}</Text>
      </SkyScreen>
    );
  }

  if (error || !lessonData) {
    return (
      <SkyScreen style={styles.center}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorTitle}>{t('lesson.not_found')}</Text>
        <Text style={styles.errorBody}>
          {(error as any)?.message || t('lesson.not_found_desc')}
        </Text>
      </SkyScreen>
    );
  }

  const { lesson, steps } = lessonData;

  if (showWordSelection) {
    return (
      <WordSelectionStep
        candidates={wordCandidates}
        source="lesson"
        onDone={() => router.back()}
        onSkip={() => router.back()}
      />
    );
  }

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  // Общий триггер UI-FX (XPGain / Level-up / Daily-goal / Achievements).
  // Используется и legacy completeStep, и phase-2 submit.
  const triggerFxFromGamification = (gamification: SubmitAnswerResponse['gamification'] | null) => {
    fireGamificationFx({ xp: gamification ?? null, silent: true })
      .then((result) => {
        if (result.xpGained > 0) {
          setXpGain({ amount: result.xpGained, key: Date.now() });
          fx.onXPGain();
        }
        if (result.leveledUp) {
          fx.onLevelUp();
          setLevelUpTo(result.newLevel);
        }
        if (result.dailyGoalCompleted) {
          fx.onDailyGoal();
          Toast.show({ type: 'success', text1: t('common.daily_goal_done') });
        }
        if (result.newAchievements.length) {
          fx.onAchievement();
          setAchievementQueue((q) => [...q, ...result.newAchievements]);
        }
      })
      .catch(() => {
        /* noop */
      });
  };

  // Переход дальше / завершение урока.
  const advance = () => {
    if (isLastStep) {
      // Фиксируем прохождение урока (для последовательной разблокировки в треке).
      void markLessonCompleted(lessonId);
      if (wordCandidates.length > 0) setShowWordSelection(true);
      else router.back();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  // Legacy путь (text/video, legacy quiz): MarkStepComplete + advance.
  const handleStepComplete = (score?: number) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    completeStepMutation.mutate(
      {
        stepId: currentStep.id,
        data: {
          time_spent_seconds: timeSpent,
          score: score ?? undefined,
          attempts: 1,
        },
      },
      {
        onSuccess: (response) => {
          triggerFxFromGamification(response.gamification ?? null);
        },
      },
    );

    advance();
  };

  // Phase 2: интерактивный submit. Возвращает SubmitAnswerResponse —
  // компонент сам показывает feedback и потом вызывает onContinue → advance.
  const handleInteractiveSubmit = async (answer: Record<string, unknown>): Promise<SubmitAnswerResponse> => {
    const timeMs = Math.max(0, Date.now() - startTime);
    const resp = await submitStepMutation.mutateAsync({
      stepId: currentStep.id,
      body: {
        answer,
        time_spent_ms: timeMs,
      },
    });
    if (resp.is_correct) {
      triggerFxFromGamification(resp.gamification);
    } else {
      fx.onWrong();
    }
    return resp;
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const renderStep = () => {
    try {
      const content = JSON.parse(currentStep.content);

      // Legacy quiz (`{ questions: [...] }`) — старый компонент.
      // Phase-2 quiz (`{ options: [...] }`) — через StepRenderer.
      if (currentStep.type === 'quiz' && Array.isArray(content?.questions)) {
        return (
          <QuizStep
            content={content as QuizContent}
            onComplete={handleStepComplete}
          />
        );
      }

      // Phase 2 интерактивные шаги.
      if (isInteractiveStep(currentStep.type)) {
        return (
          <StepRenderer
            step={currentStep}
            onSubmit={handleInteractiveSubmit}
            onContinue={advance}
            isLast={isLastStep}
          />
        );
      }

      // Legacy text / video.
      switch (currentStep.type) {
        case 'video': {
          return (
            <View style={styles.fallback}>
              <Text style={styles.fallbackEmoji}>🎬</Text>
              <Text style={styles.fallbackTitle}>{t('common.video_lesson')}</Text>
              <Text style={styles.fallbackBody}>
                {t('lesson.video_unavailable')}
              </Text>
              <Pressable onPress={() => handleStepComplete()}>
                <LinearGradient colors={CTA_GRADIENT} style={styles.fallbackCta}>
                  <Text style={styles.fallbackCtaText}>{t('lesson.continue').toUpperCase()}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          );
        }
        case 'text': {
          const textContent = content as TextContent;
          return (
            <TextStep content={textContent} onComplete={handleStepComplete} />
          );
        }
        case 'activity': {
          return <ActivityStep content={content as ActivityContent} stepId={currentStep.id} />;
        }
        default:
          return (
            <View style={styles.fallback}>
              <Text style={styles.fallbackBody}>
                {t('lesson.unsupported')}
              </Text>
            </View>
          );
      }
    } catch {
      return (
        <View style={styles.fallback}>
          <Text style={[styles.fallbackBody, { color: SKY.red }]}>
            {t('lesson.error_content')}
          </Text>
        </View>
      );
    }
  };

  // Phase-2 шаги сами рендерят кнопку Check/Continue (через FeedbackBar),
  // поэтому нижний legacy-навбар скрываем для них.
  const isPhaseTwoInteractive =
    isInteractiveStep(currentStep.type) &&
    !(currentStep.type === 'quiz' && tryHasQuestions(currentStep.content));

  const progressPct = ((currentStepIndex + 1) / steps.length) * 100;
  return (
    <SkyScreen>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={[styles.flex, Platform.OS === 'android' && keyboardHeight > 0 ? { paddingBottom: keyboardHeight } : null]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <SkyLessonHeader
          top={insets.top}
          subtitle={lesson.title}
          title={currentStep.title}
          progressPct={progressPct}
          hearts={heartsData?.hearts}
          onBack={() => router.back()}
        />

        {/* Step Content — key по step.id заставляет React пересоздавать
            компонент шага при переходе, сбрасывая его внутренний state
            (иначе ответ/feedback «перетекают» на следующий шаг того же типа). */}
        <View key={currentStep.id} style={[styles.content, isPhaseTwoInteractive ? { paddingBottom: insets.bottom } : null]}>
          {renderStep()}
        </View>

        {/* Navigation — только для legacy шагов. Phase-2 шаги управляют
            своей кнопкой Check/Continue через FeedbackBar. */}
        {!isPhaseTwoInteractive && (
          <View style={[styles.nav, { paddingBottom: insets.bottom + 16 }]}>
            {currentStepIndex > 0 && (
              <Pressable onPress={handlePrevious} style={[styles.navBtn, styles.navBtnGhost]}>
                <Text style={styles.navBtnGhostText}>← {t('lesson.previous')}</Text>
              </Pressable>
            )}

            <Pressable onPress={() => handleStepComplete()} style={styles.navBtn}>
              <LinearGradient colors={CTA_GRADIENT} style={styles.navBtnCta}>
                <Text style={styles.navBtnCtaText}>
                  {isLastStep ? t('lesson.finish').toUpperCase() : `${t('lesson.continue').toUpperCase()} →`}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Gamification FX overlays — поверх всего, вне KeyboardAvoidingView */}
      {xpGain && (
        <XPGainAnimation
          key={xpGain.key}
          amount={xpGain.amount}
          onDone={() => setXpGain(null)}
        />
      )}
      <AchievementModal
        achievement={achievementQueue[0] ?? null}
        visible={achievementQueue.length > 0}
        onClose={() => setAchievementQueue((q) => q.slice(1))}
      />
      <LevelUpOverlay
        level={levelUpTo}
        onDismiss={() => setLevelUpTo(null)}
      />
    </SkyScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  loadingText: { color: SKY.muted, marginTop: 16, fontSize: 15, fontFamily: 'Nunito_700Bold' },
  errorEmoji: { fontSize: 44, marginBottom: 12 },
  errorTitle: { color: SKY.ink, fontFamily: 'Nunito_900Black', fontSize: 18, marginBottom: 6 },
  errorBody: { color: SKY.muted, textAlign: 'center', fontSize: 14, lineHeight: 20, fontFamily: 'Nunito_600SemiBold' },

  content: { flex: 1 },

  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  fallbackEmoji: { fontSize: 44, marginBottom: 12 },
  fallbackTitle: { color: SKY.ink, fontFamily: 'Nunito_900Black', fontSize: 18, marginBottom: 8 },
  fallbackBody: { color: SKY.muted, textAlign: 'center', fontSize: 14, lineHeight: 20, marginBottom: 22, fontFamily: 'Nunito_600SemiBold' },
  fallbackCta: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 18, borderBottomWidth: 4, borderBottomColor: SKY.blueDark },
  fallbackCtaText: { color: '#FFFFFF', fontFamily: 'Nunito_800ExtraBold', fontSize: 14, letterSpacing: 0.5 },

  nav: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },
  navBtn: { flex: 1 },
  navBtnGhost: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderBottomWidth: 4,
    borderColor: '#DDE3E8',
    borderBottomColor: '#D3DAE0',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnGhostText: { color: SKY.ink, fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  navBtnCta: { borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: SKY.blueDark },
  navBtnCtaText: { color: '#FFFFFF', fontFamily: 'Nunito_800ExtraBold', fontSize: 15, letterSpacing: 0.5 },
});
