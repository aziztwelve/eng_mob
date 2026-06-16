import React from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTranslation } from 'react-i18next';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ProjectionChart } from '@/components/onboarding/ProjectionChart';
import { useOnboardingState } from '@/hooks/use-onboarding';
import { projectionCopyForGoal } from '@/lib/onboarding-copy';

/**
 * Projection interstitial — после emotional-reaction → reaction-4 → projection.
 *
 * Bar chart "Lumi vs other methods" + персонализированный timeline под goal
 * (work / travel / exam / ...).
 *
 * См. spec §1 (interstitial-projection), §3.7.
 */

export default function ProjectionScreen() {
  const { t } = useTranslation();
  const { data: state } = useOnboardingState();
  const goal = state?.goal ?? null;
  const copy = projectionCopyForGoal(goal);

  return (
    <OnboardingShell
      trackKey="projection"
      step={5}
      total={12}
      title={copy.title}
      subtitle={copy.subtitle}
      onContinue={() => router.push('/onboarding/reminder-time')}
      continueLabel={t('onboarding.common.continue')}
    >
      <View className="my-2">
        <ProjectionChart />
      </View>

      <View className="gap-2 mt-2">
        {copy.timeline.map((line, i) => (
          <Animated.View
            key={i}
            entering={FadeInUp.duration(260).delay(400 + i * 100)}
            className="flex-row items-start gap-3"
          >
            <View className="w-6 h-6 rounded-full bg-primary items-center justify-center mt-0.5">
              <Text className="text-primary-foreground font-black text-xs">
                {i + 1}
              </Text>
            </View>
            <Text className="flex-1 text-foreground font-medium text-sm leading-relaxed">
              {line}
            </Text>
          </Animated.View>
        ))}
      </View>

      <View className="mt-3 bg-card border-2 border-border rounded-2xl px-4 py-3">
        <Text className="text-muted-foreground font-medium text-sm leading-snug">
          {copy.bottom}
        </Text>
      </View>
    </OnboardingShell>
  );
}
