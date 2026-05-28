import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { CollapsibleOptions } from '@/components/onboarding/CollapsibleOptions';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useOnboardingStep } from '@/hooks/use-onboarding-step';
import type { SpeakingSituation } from '@/types/api';

const TOTAL = 14;

const ORDER: SpeakingSituation[] = ['freeze', 'translate_in_head', 'too_short', 'avoid'];
const EMOJI: Record<SpeakingSituation, string> = {
  freeze: '🧊', translate_in_head: '🔁', too_short: '✂️', avoid: '🚪',
};

export default function SpeakingSituationScreen() {
  const { t } = useTranslation();
  const { value, setValue, submitting, canContinue, handleContinue } =
    useOnboardingStep<SpeakingSituation>({
      step: 'speaking_situation',
      next: (v) => ({
        pathname: '/onboarding/reaction',
        params: {
          step: 'speaking_situation',
          value: v,
          next: '/onboarding/past-blocker',
        },
      }),
      buildPatch: (v) => ({ speaking_situation: v }),
      loadValue: (s) => s.speaking_situation,
    });

  const options = useMemo(
    () =>
      ORDER.map((v) => ({
        value: v,
        emoji: EMOJI[v],
        title: t(`onboarding.speaking_situation.options.${v}.title` as const),
        subtitle: t(`onboarding.speaking_situation.options.${v}.subtitle` as const),
      })),
    [t],
  );

  return (
    <OnboardingShell
      trackKey="speaking-situation"
      step={7}
      total={TOTAL}
      title={t('onboarding.speaking_situation.title')}
      subtitle={t('onboarding.speaking_situation.subtitle')}
      onContinue={handleContinue}
      continueDisabled={!canContinue}
      continueLoading={submitting}
    >
      <CollapsibleOptions options={options} value={value} onChange={setValue} />
    </OnboardingShell>
  );
}
