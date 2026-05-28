import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useOnboardingState, usePatchOnboardingV3 } from '@/hooks/use-onboarding';
import { analytics } from '@/lib/analytics';
import {
  getPlacementQuestions,
  scoreToLevel,
  type PlacementQuestion,
} from '@/lib/placement-questions';

/**
 * Mini placement-test — опциональный шаг между level (4) и daily-commit (5).
 *
 * Активируется, если на шаге level юзер выбрал «placement_test». Показывает
 * 6 вопросов из `PLACEMENT_POOL[target_language]`, считает score и пишет
 * `proficiency_level` + `placement_score` в backend.
 *
 * Fallback'ы:
 *   - target_language не выбран или пул пуст → пропускаем тест, ставим
 *     'beginner' и редиректим на daily-commit.
 *
 * См. docs/tasks/mob/onboarding-v3-oki-style.md §3.11.
 */

const TOTAL = 14;

/** Render placement-question'а с params, через i18n. */
function renderPrompt(
  t: TFunction,
  q: PlacementQuestion,
): { title: string; subtitle?: string } {
  const params = q.promptParams ?? {};
  switch (q.promptKey) {
    case 'translate_to_target':
      return {
        title: t('onboarding.placement_test.prompt.translate_to_target'),
        subtitle: params.word ? `«${params.word}»` : undefined,
      };
    case 'fill_blank':
      return {
        title: t('onboarding.placement_test.prompt.fill_blank'),
        subtitle: params.sentence,
      };
    case 'pick_meaning':
      return {
        title: t('onboarding.placement_test.prompt.pick_meaning'),
        subtitle: params.word ? `«${params.word}»` : undefined,
      };
    default:
      return {
        title: t('onboarding.placement_test.prompt.default'),
        subtitle: params.word ?? params.sentence,
      };
  }
}

export default function PlacementTestScreen() {
  const { t } = useTranslation();
  const { data: state } = useOnboardingState();
  const patch = usePatchOnboardingV3();

  const targetLang = state?.target_language ?? 'en';
  const questions = useMemo(
    () => getPlacementQuestions(targetLang, 6),
    [targetLang],
  );

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctIds, setCorrectIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Если для языка нет вопросов — пропускаем тест.
  useEffect(() => {
    analytics.track('placement_started', {
      target_language: targetLang,
      pool_size: questions.length,
    });
    if (questions.length === 0 && state) {
      void (async () => {
        await patch.mutateAsync({
          patch: { proficiency_level: 'beginner', placement_score: 0 },
          localExtra: { current_step: 'level' },
        });
        router.replace('/onboarding/daily-commit');
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length, state]);

  if (questions.length === 0) return null;

  const q = questions[index];
  const prompt = renderPrompt(t, q);
  const isLast = index === questions.length - 1;

  async function handleNext() {
    if (picked === null || submitting) return;

    const updatedCorrect =
      picked === q.correctIndex ? [...correctIds, q.id] : correctIds;

    if (!isLast) {
      setCorrectIds(updatedCorrect);
      setPicked(null);
      setIndex(index + 1);
      return;
    }

    // Финальный submit.
    setSubmitting(true);
    try {
      const { level, score } = scoreToLevel(questions, updatedCorrect);
      await patch.mutateAsync({
        patch: { proficiency_level: level, placement_score: score },
        localExtra: { current_step: 'level' },
      });
      analytics.track('placement_completed', {
        target_language: targetLang,
        level,
        score,
        correct: updatedCorrect.length,
        total: questions.length,
      });
      router.replace('/onboarding/daily-commit');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OnboardingShell
      trackKey="placement-test"
      step={4}
      total={TOTAL}
      title={prompt.title}
      subtitle={prompt.subtitle}
      onContinue={handleNext}
      continueDisabled={picked === null}
      continueLoading={submitting}
      continueLabel={isLast ? t('onboarding.placement_test.finish') : t('onboarding.common.continue')}
    >
      <Animated.View
        entering={FadeIn.duration(180)}
        key={q.id}
        className="gap-3"
      >
        <Text className="text-muted-foreground font-bold text-sm uppercase">
          {t('onboarding.placement_test.question_progress', {
            index: index + 1,
            total: questions.length,
          })}
        </Text>

        {q.options.map((opt, i) => {
          const selected = picked === i;
          return (
            <Animated.View key={i} entering={FadeInUp.duration(180).delay(i * 40)}>
              <Pressable
                onPress={() => setPicked(i)}
                className={`rounded-2xl border-2 px-4 py-4 active:opacity-80 ${
                  selected
                    ? 'border-primary bg-primary/15'
                    : 'border-border bg-card'
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className={`w-7 h-7 rounded-full items-center justify-center ${
                      selected ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <Text
                      className={`font-black ${
                        selected ? 'text-primary-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </Text>
                  </View>
                  <Text className="text-foreground font-bold text-base flex-1">
                    {opt}
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>
    </OnboardingShell>
  );
}
