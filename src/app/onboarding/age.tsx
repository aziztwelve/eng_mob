import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { CollapsibleOptions } from '@/components/onboarding/CollapsibleOptions';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useOnboardingStep } from '@/hooks/use-onboarding-step';
import type { AgeBracket } from '@/types/api';

const TOTAL_STEPS = 14;

const AGE_EMOJI: Record<AgeBracket, string> = {
  '7-12': '👶',
  '13-17': '🎒',
  '18-24': '🎓',
  '25-34': '💼',
  '35-44': '🧑‍💻',
  '45-54': '🧑‍🏫',
  '55+': '👴',
};

const AGE_ORDER: AgeBracket[] = ['7-12', '13-17', '18-24', '25-34', '35-44', '45-54', '55+'];

export default function AgeScreen() {
  const { t } = useTranslation();
  const { value, setValue, submitting, canContinue, handleContinue } =
    useOnboardingStep<AgeBracket>({
      step: 'age',
      next: '/onboarding/level',
      buildPatch: (v) => ({ age_bracket: v }),
      loadValue: (s) => s.age_bracket,
    });

  const options = useMemo(
    () =>
      AGE_ORDER.map((a) => ({
        value: a,
        emoji: AGE_EMOJI[a],
        title: t(`onboarding.age.options.${a}.title` as const),
        subtitle: t(`onboarding.age.options.${a}.subtitle` as const),
      })),
    [t],
  );

  return (
    <OnboardingShell
      trackKey="age"
      step={3}
      total={TOTAL_STEPS}
      title={t('onboarding.age.title')}
      subtitle={t('onboarding.age.subtitle')}
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
