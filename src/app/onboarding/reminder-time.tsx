import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { CollapsibleOptions } from '@/components/onboarding/CollapsibleOptions';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useOnboardingStep } from '@/hooks/use-onboarding-step';
import type { ReminderSlot } from '@/types/api';

const TOTAL = 14;

const ORDER: ReminderSlot[] = ['morning', 'day', 'evening', 'flex'];
const EMOJI: Record<ReminderSlot, string> = {
  morning: '🌅', day: '🌞', evening: '🌙', flex: '🎲',
};

export default function ReminderTimeScreen() {
  const { t } = useTranslation();
  const { value, setValue, submitting, canContinue, handleContinue } =
    useOnboardingStep<ReminderSlot>({
      step: 'reminder_slot',
      next: (v) => ({
        pathname: '/onboarding/reaction',
        params: {
          step: 'reminder_slot',
          value: v,
          next: '/onboarding/notifications',
        },
      }),
      buildPatch: (v) => ({ reminder_slot: v }),
      loadValue: (s) => s.reminder_slot,
    });

  const options = useMemo(
    () =>
      ORDER.map((v) => ({
        value: v,
        emoji: EMOJI[v],
        title: t(`onboarding.reminder_time.options.${v}.title` as const),
        subtitle: t(`onboarding.reminder_time.options.${v}.subtitle` as const),
      })),
    [t],
  );

  return (
    <OnboardingShell
      trackKey="reminder-time"
      step={11}
      total={TOTAL}
      title={t('onboarding.reminder_time.title')}
      subtitle={t('onboarding.reminder_time.subtitle')}
      onContinue={handleContinue}
      continueDisabled={!canContinue}
      continueLoading={submitting}
    >
      <CollapsibleOptions options={options} value={value} onChange={setValue} />
    </OnboardingShell>
  );
}
