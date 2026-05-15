import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useLesson } from '@/hooks/use-lessons';
import { useCompleteStep } from '@/hooks/use-progress';
import { useStepSubmit } from '@/hooks/use-step-submit';
import { useLessonGamificationFx } from '@/hooks/use-gamification-fx';
import { fx } from '@/lib/fx';
import {
  VideoContent,
  TextContent,
  QuizContent,
  UserAchievement,
  isInteractiveStep,
  SubmitAnswerResponse,
} from '@/types/api';
import { VideoStep } from '@/components/lesson/video-step';
import { TextStep } from '@/components/lesson/text-step';
import { QuizStep } from '@/components/lesson/quiz-step';
import { StepRenderer } from '@/components/lesson/StepRenderer';
import {
  AchievementModal,
  LevelUpOverlay,
  XPGainAnimation,
} from '@/components/gamification';

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
  const { data: lessonData, isLoading, error } = useLesson(lessonId);
  const completeStepMutation = useCompleteStep();
  const submitStepMutation = useStepSubmit();
  const fireGamificationFx = useLessonGamificationFx();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [startTime] = useState(Date.now());

  // Local FX state — рендерим оверлеи прямо в этом экране.
  const [xpGain, setXpGain] = useState<{ amount: number; key: number } | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<UserAchievement[]>([]);
  const [levelUpTo, setLevelUpTo] = useState<number | null>(null);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#58cc02" />
        <Text className="text-muted-foreground mt-4">Loading lesson...</Text>
      </View>
    );
  }

  if (error || !lessonData) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-4xl mb-4">😕</Text>
        <Text className="text-foreground font-bold text-lg mb-2">
          Lesson not found
        </Text>
        <Text className="text-muted-foreground text-center">
          {(error as any)?.message || 'Unable to load lesson'}
        </Text>
      </View>
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
          const videoContent = content as VideoContent;
          const videoUrl =
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
          return (
            <VideoStep
              content={videoContent}
              videoUrl={videoUrl}
              onComplete={handleStepComplete}
            />
          );
        }
        case 'text': {
          const textContent = content as TextContent;
          return (
            <TextStep content={textContent} onComplete={handleStepComplete} />
          );
        }
        default:
          return (
            <View className="flex-1 items-center justify-center p-6">
              <Text className="text-foreground text-center">
                Step type "{currentStep.type}" is not yet supported
              </Text>
            </View>
          );
      }
    } catch {
      return (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-destructive text-center">
            Error loading step content
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

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-card border-b-2 border-border px-4 pt-12 pb-4">
        <Text className="text-sm text-muted-foreground mb-1">
          {lesson.title}
        </Text>
        <Text className="text-xl font-black text-foreground mb-3">
          {currentStep.title}
        </Text>
        
        {/* Progress Bar */}
        <View className="flex-row items-center">
          <View className="flex-1 bg-muted rounded-full h-2 overflow-hidden mr-3">
            <View 
              className="bg-primary h-full"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </View>
          <Text className="text-muted-foreground text-sm font-semibold">
            {currentStepIndex + 1}/{steps.length}
          </Text>
        </View>
      </View>

      {/* Step Content */}
      <View className="flex-1">
        {renderStep()}
      </View>

      {/* Gamification FX overlays */}
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

      {/* Navigation — только для legacy шагов. Phase-2 шаги управляют
          своей кнопкой Check/Continue через FeedbackBar. */}
      {!isPhaseTwoInteractive && (
        <View className="bg-card border-t-2 border-border p-4 flex-row space-x-3">
          {currentStepIndex > 0 && (
            <Pressable
              onPress={handlePrevious}
              className="flex-1 bg-muted border-2 border-border rounded-2xl py-3"
            >
              <Text className="text-center font-bold text-foreground">
                ← Previous
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => handleStepComplete()}
            className="flex-1 bg-primary rounded-2xl py-3"
          >
            <Text className="text-center font-black text-primary-foreground uppercase">
              {isLastStep ? 'Finish' : 'Continue →'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
