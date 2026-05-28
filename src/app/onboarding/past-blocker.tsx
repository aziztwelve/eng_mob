import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { CollapsibleOptions } from '@/components/onboarding/CollapsibleOptions';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useOnboardingStep } from '@/hooks/use-onboarding-step';
import type { PastBlocker } from '@/types/api';

const TOTAL = 14;

const ORDER: PastBlocker[] = ['boring', 'too_hard', 'no_progress', 'no_fit', 'no_support'];
const EMOJI: Record<PastBlocker, string> = {
  boring: '🥱', too_hard: '🧱', no_progress: '📉', no_fit: '🧩', no_support: '🤷',
};

export default function PastBlockerScreen() {
  const { t } = useTranslation();
  const { value, setValue, submitting, canContinue, handleContinue } =
    useOnboardingStep<PastBlocker>({
      step: 'past_blocker',
      next: (v) => ({
        pathname: '/onboarding/reaction',
        params: {
          step: 'past_blocker',
          value: v,
          next: '/onboarding/trust',
        },
      }),
      buildPatch: (v) => ({ past_blocker: v }),
      loadValue: (s) => s.past_blocker,
    });

  const options = useMemo(
    () =>
      ORDER.map((v) => ({
        value: v,
        emoji: EMOJI[v],
        title: t(`onboarding.past_blocker.options.${v}.title` as const),
        subtitle: t(`onboarding.past_blocker.options.${v}.subtitle` as const),
      })),
    [t],
  );

  return (
    <OnboardingShell
      trackKey="past-blocker"
      step={8}
      total={TOTAL}
      title={t('onboarding.past_blocker.title')}
      subtitle={t('onboarding.past_blocker.subtitle')}
      onContinue={handleContinue}
      continueDisabled={!canContinue}
      continueLoading={submitting}
    >
      <CollapsibleOptions options={options} value={value} onChange={setValue} />
    </OnboardingShell>
  );
}
