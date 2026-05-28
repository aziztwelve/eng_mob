import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { CollapsibleOptions } from '@/components/onboarding/CollapsibleOptions';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useOnboardingStep } from '@/hooks/use-onboarding-step';
import type { PainPoint } from '@/types/api';

const TOTAL = 14;

const ORDER: PainPoint[] = ['fear_speaking', 'lack_vocab', 'listening', 'grammar', 'consistency'];
const EMOJI: Record<PainPoint, string> = {
  fear_speaking: '😶', lack_vocab: '📖', listening: '👂', grammar: '📐', consistency: '⏰',
};

export default function PainPointsScreen() {
  const { t } = useTranslation();
  const { value, setValue, submitting, canContinue, handleContinue } =
    useOnboardingStep<PainPoint>({
      step: 'pain_points',
      next: '/onboarding/speaking-situation',
      buildPatch: (v) => ({ pain_point: v }),
      loadValue: (s) => s.pain_point,
    });

  const options = useMemo(
    () =>
      ORDER.map((v) => ({
        value: v,
        emoji: EMOJI[v],
        title: t(`onboarding.pain_points.options.${v}.title` as const),
        subtitle: t(`onboarding.pain_points.options.${v}.subtitle` as const),
      })),
    [t],
  );

  return (
    <OnboardingShell
      trackKey="pain-points"
      step={6}
      total={TOTAL}
      title={t('onboarding.pain_points.title')}
      subtitle={t('onboarding.pain_points.subtitle')}
      onContinue={handleContinue}
      continueDisabled={!canContinue}
      continueLoading={submitting}
    >
      <CollapsibleOptions options={options} value={value} onChange={setValue} />
    </OnboardingShell>
  );
}
