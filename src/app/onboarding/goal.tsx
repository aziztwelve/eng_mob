import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { CollapsibleOptions } from '@/components/onboarding/CollapsibleOptions';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useOnboardingStep } from '@/hooks/use-onboarding-step';
import { motivationPatch } from '@/lib/onboarding-patches';

const TOTAL_STEPS = 12;

type Goal =
  | 'work' | 'exam' | 'travel' | 'relocation' | 'speaking' | 'study'
  | 'social' | 'content' | 'listening_shadowing';

const GOAL_EMOJI: Record<Goal, string> = {
  work: '💼', exam: '🎯', travel: '✈️', relocation: '🏠', speaking: '🗣️', study: '📚',
  social: '🫂', content: '🎬', listening_shadowing: '🎧',
};

const GOAL_ORDER: Goal[] = [
  'work', 'exam', 'travel', 'relocation', 'speaking', 'study',
  'social', 'content', 'listening_shadowing',
];

export default function GoalScreen() {
  const { t } = useTranslation();
  const { value, setValue, submitting, canContinue, handleContinue } =
    useOnboardingStep<Goal>({
      step: 'goal',
      next: '/onboarding/age',
      buildPatch: (v) => motivationPatch(v),
      loadValue: (s) => (s.goal as Goal | null) ?? null,
    });

  const options = useMemo(
    () =>
      GOAL_ORDER.map((g) => ({
        value: g,
        emoji: GOAL_EMOJI[g],
        title: t(`onboarding.goal.options.${g}.title`),
        subtitle: t(`onboarding.goal.options.${g}.subtitle`),
      })),
    [t],
  );

  return (
    <OnboardingShell
      trackKey="goal"
      step={1}
      total={TOTAL_STEPS}
      title={t('onboarding.goal.title')}
      subtitle={t('onboarding.goal.subtitle')}
      onContinue={handleContinue}
      continueDisabled={!canContinue}
      continueLoading={submitting}
    >
      <CollapsibleOptions
        options={options}
        value={value}
        onChange={setValue}
        showAllWhenSelected
      />
    </OnboardingShell>
  );
}
