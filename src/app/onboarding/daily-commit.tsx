import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { CollapsibleOptions } from '@/components/onboarding/CollapsibleOptions';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useOnboardingStep } from '@/hooks/use-onboarding-step';
import type { DailyCommitMinutes } from '@/types/api';

const TOTAL_STEPS = 12;

const MINUTES_TO_XP: Record<DailyCommitMinutes, number> = {
  5: 10,
  10: 20,
  15: 30,
  25: 50,
};

const MINUTES_ORDER: DailyCommitMinutes[] = [5, 10, 15, 25];
const MINUTES_EMOJI: Record<DailyCommitMinutes, string> = {
  5: '🌤️', 10: '☀️', 15: '🔥', 25: '🚀',
};

export default function DailyCommitScreen() {
  const { t } = useTranslation();
  const { value, setValue, submitting, canContinue, handleContinue } =
    useOnboardingStep<DailyCommitMinutes>({
      step: 'daily_commit',
      next: '/onboarding/projection',
      buildPatch: (v) => ({
        daily_commit_minutes: v,
        daily_goal_xp: MINUTES_TO_XP[v],
      }),
      loadValue: (s) => s.daily_commit_minutes,
    });

  const options = useMemo(
    () =>
      MINUTES_ORDER.map((m) => ({
        value: m,
        emoji: MINUTES_EMOJI[m],
        title: t(`onboarding.daily_commit.options.${m}.title` as const),
        subtitle: t(`onboarding.daily_commit.options.${m}.subtitle` as const),
      })),
    [t],
  );

  return (
    <OnboardingShell
      trackKey="daily-commit"
      step={4}
      total={TOTAL_STEPS}
      title={t('onboarding.daily_commit.title')}
      subtitle={t('onboarding.daily_commit.subtitle')}
      onContinue={handleContinue}
      continueDisabled={!canContinue}
      continueLoading={submitting}
    >
      <CollapsibleOptions
        options={options}
        value={value}
        onChange={setValue}
      />
    </OnboardingShell>
  );
}
