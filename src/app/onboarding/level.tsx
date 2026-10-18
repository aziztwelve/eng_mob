import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { CollapsibleOptions } from '@/components/onboarding/CollapsibleOptions';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useOnboardingStep } from '@/hooks/use-onboarding-step';
import type { ProficiencyLevelProto } from '@/types/api';

const TOTAL_STEPS = 6;

type LevelChoice = ProficiencyLevelProto;

const LEVEL_ORDER: LevelChoice[] = ['beginner', 'a1', 'a2', 'b1', 'b2', 'just_for_fun'];
const LEVEL_EMOJI: Record<LevelChoice, string> = {
  beginner: '🌱', a1: '🌿', a2: '🌳', b1: '🌲', b2: '🏔️', just_for_fun: '🎈',
};

export default function LevelScreen() {
  const { t } = useTranslation();

  const { value, setValue, submitting, canContinue, handleContinue } =
    useOnboardingStep<LevelChoice>({
      step: 'level',
      next: '/onboarding/reminder-time',
      buildPatch: (v) => ({ proficiency_level: v }),
      loadValue: (s) => s.level,
    });

  const options = useMemo(
    () =>
      LEVEL_ORDER.map((v) => ({
        value: v,
        emoji: LEVEL_EMOJI[v],
        title: t(`onboarding.level.options.${v}.title` as const),
        subtitle: t(`onboarding.level.options.${v}.subtitle` as const),
      })),
    [t],
  );

  return (
    <OnboardingShell
      trackKey="level"
      step={4}
      total={TOTAL_STEPS}
      title={t('onboarding.level.title')}
      subtitle={t('onboarding.level.subtitle')}
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
