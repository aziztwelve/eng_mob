import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { CollapsibleOptions } from '@/components/onboarding/CollapsibleOptions';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useOnboardingStep } from '@/hooks/use-onboarding-step';
import type { FutureRegret } from '@/types/api';

const TOTAL = 14;

const ORDER: FutureRegret[] = ['stay_same', 'limit_self', 'pressure', 'postpone'];
const EMOJI: Record<FutureRegret, string> = {
  stay_same: '🌀', limit_self: '🚧', pressure: '⚡', postpone: '⏳',
};

export default function FutureRegretScreen() {
  const { t } = useTranslation();
  const { value, setValue, submitting, canContinue, handleContinue } =
    useOnboardingStep<FutureRegret>({
      step: 'future_regret',
      next: (v) => ({
        pathname: '/onboarding/reaction',
        params: {
          step: 'future_regret',
          value: v,
          next: '/onboarding/emotional-reaction',
        },
      }),
      buildPatch: (v) => ({ future_regret: v }),
      loadValue: (s) => s.future_regret,
    });

  const options = useMemo(
    () =>
      ORDER.map((v) => ({
        value: v,
        emoji: EMOJI[v],
        title: t(`onboarding.future_regret.options.${v}.title` as const),
        subtitle: t(`onboarding.future_regret.options.${v}.subtitle` as const),
      })),
    [t],
  );

  return (
    <OnboardingShell
      trackKey="future-regret"
      step={9}
      total={TOTAL}
      title={t('onboarding.future_regret.title')}
      subtitle={t('onboarding.future_regret.subtitle')}
      onContinue={handleContinue}
      continueDisabled={!canContinue}
      continueLoading={submitting}
    >
      <CollapsibleOptions options={options} value={value} onChange={setValue} />
    </OnboardingShell>
  );
}
