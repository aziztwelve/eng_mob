import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { CollapsibleOptions } from '@/components/onboarding/CollapsibleOptions';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useOnboardingStep } from '@/hooks/use-onboarding-step';
import type { EmotionalReaction } from '@/types/api';

const TOTAL = 14;

const ORDER: EmotionalReaction[] = ['lose_confidence', 'upset', 'burnout', 'lost'];
const EMOJI: Record<EmotionalReaction, string> = {
  lose_confidence: '💔', upset: '😞', burnout: '🔥', lost: '🌫️',
};

export default function EmotionalReactionScreen() {
  const { t } = useTranslation();
  const { value, setValue, submitting, canContinue, handleContinue } =
    useOnboardingStep<EmotionalReaction>({
      step: 'emotional_reaction',
      next: (v) => ({
        pathname: '/onboarding/reaction',
        params: {
          step: 'emotional_reaction',
          value: v,
          next: '/onboarding/projection',
        },
      }),
      buildPatch: (v) => ({ emotional_reaction: v }),
      loadValue: (s) => s.emotional_reaction,
    });

  const options = useMemo(
    () =>
      ORDER.map((v) => ({
        value: v,
        emoji: EMOJI[v],
        title: t(`onboarding.emotional_reaction.options.${v}.title` as const),
        subtitle: t(`onboarding.emotional_reaction.options.${v}.subtitle` as const),
      })),
    [t],
  );

  return (
    <OnboardingShell
      trackKey="emotional-reaction"
      step={10}
      total={TOTAL}
      title={t('onboarding.emotional_reaction.title')}
      subtitle={t('onboarding.emotional_reaction.subtitle')}
      onContinue={handleContinue}
      continueDisabled={!canContinue}
      continueLoading={submitting}
    >
      <CollapsibleOptions options={options} value={value} onChange={setValue} />
    </OnboardingShell>
  );
}
