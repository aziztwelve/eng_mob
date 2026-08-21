import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useLesson } from '@/hooks/use-lessons';
import { useCompleteStep } from '@/hooks/use-progress';
import { useStepSubmit } from '@/hooks/use-step-submit';
import { useLessonGamificationFx } from '@/hooks/use-gamification-fx';
import { fx } from '@/lib/fx';
import { NeonScreen, neon } from '@/components/neon-screen';
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
import { ActivityStep } from '@/components/lesson/activity-step';
import {
  AchievementModal,
  LevelUpOverlay,
  XPGainAnimation,
} from '@/components/gamification';

// Candy CTA / progress gradients — совпадают с home/login экранами.
const CTA_GRADIENT = ['#FFDF5E', '#FFB338'] as const;
const PROGRESS_GRADIENT = ['#FFDF5E', '#FF9E6E'] as const;

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

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [startTime] = useState(Date.now());

  // Local FX state — рендерим оверлеи прямо в этом экране.
  const [xpGain, setXpGain] = useState<{ amount: number; key: number } | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<UserAchievement[]>([]);
  const [levelUpTo, setLevelUpTo] = useState<number | null>(null);

  if (isLoading) {
    return (
      <NeonScreen style={styles.center}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={neon.primary} />
        <Text style={styles.loadingText}>{t('lesson.loading')}</Text>
      </NeonScreen>
    );
  }

  if (error || !lessonData) {
    return (
      <NeonScreen style={styles.center}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorTitle}>{t('lesson.not_found')}</Text>
        <Text style={styles.errorBody}>
          {(error as any)?.message || t('lesson.not_found_desc')}
        </Text>
      </NeonScreen>
    );
  }

  const { lesson, steps } = lessonData;
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
          Toast.show({ type: 'success', text1: '🎯 Цель дня выполнена!' });
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
      router.back();
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
              <Text style={styles.fallbackTitle}>Видео урок</Text>
              <Text style={styles.fallbackBody}>
                Видео временно недоступно
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
          <Text style={[styles.fallbackBody, { color: neon.hearts }]}>
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
    <NeonScreen>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
          <Text style={styles.lessonTitle} numberOfLines={1}>{lesson.title}</Text>
          <Text style={styles.stepTitle} numberOfLines={1}>{currentStep.title}</Text>

          {/* Progress Bar */}
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={PROGRESS_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progressPct}%` }]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {currentStepIndex + 1}/{steps.length}
            </Text>
          </View>
        </View>

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
    </NeonScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  loadingText: { color: neon.muted, marginTop: 16, fontSize: 15 },
  errorEmoji: { fontSize: 44, marginBottom: 12 },
  errorTitle: { color: neon.text, fontWeight: '900', fontSize: 18, marginBottom: 6 },
  errorBody: { color: neon.muted, textAlign: 'center', fontSize: 14, lineHeight: 20 },

  header: {
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.18)',
  },
  lessonTitle: { color: neon.muted, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  stepTitle: { color: neon.text, fontSize: 20, fontWeight: '900', marginBottom: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  progressTrack: {
    flex: 1,
    height: 9,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.20)',
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: { height: '100%', borderRadius: 6 },
  progressLabel: { color: neon.muted, fontSize: 13, fontWeight: '700', minWidth: 38, textAlign: 'right' },

  content: { flex: 1 },

  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  fallbackEmoji: { fontSize: 44, marginBottom: 12 },
  fallbackTitle: { color: neon.text, fontWeight: '900', fontSize: 18, marginBottom: 8 },
  fallbackBody: { color: neon.muted, textAlign: 'center', fontSize: 14, lineHeight: 20, marginBottom: 22 },
  fallbackCta: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 18 },
  fallbackCtaText: { color: neon.ink, fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },

  nav: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 28,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  navBtn: { flex: 1 },
  navBtnGhost: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnGhostText: { color: neon.text, fontWeight: '700', fontSize: 15 },
  navBtnCta: { borderRadius: 18, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  navBtnCtaText: { color: neon.ink, fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
});
