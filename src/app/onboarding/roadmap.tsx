import React from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { RoadmapTimeline } from '@/components/onboarding/RoadmapTimeline';
import { useOnboardingState } from '@/hooks/use-onboarding';
import { roadmapCopyForGoal } from '@/lib/onboarding-copy';

/**
 * Roadmap interstitial — vertical timeline 5 milestones.
 *
 * См. spec §1 (interstitial-roadmap).
 */

export default function RoadmapScreen() {
  const { t } = useTranslation();
  const { data: state } = useOnboardingState();
  const copy = roadmapCopyForGoal(state?.goal ?? null);

  return (
    <OnboardingShell
      trackKey="roadmap"
      step={10}
      total={12}
      title={copy.title}
      subtitle={copy.subtitle}
      onContinue={() => router.push('/onboarding/value-prop')}
      continueLabel={t('onboarding.common.continue')}
    >
      <View className="mt-2">
        <RoadmapTimeline milestones={copy.milestones} />
      </View>
    </OnboardingShell>
  );
}
