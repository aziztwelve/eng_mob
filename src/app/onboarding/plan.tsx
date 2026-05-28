import React from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { StackedBarChart } from '@/components/onboarding/StackedBarChart';
import { useOnboardingState } from '@/hooks/use-onboarding';
import { planCopyForGoal } from '@/lib/onboarding-copy';

/**
 * Plan interstitial — после push_opt_in (notifications-12) → plan.
 *
 * Stacked-bar chart "как раскрывается путь" (4 категории × 3 фазы) +
 * timeline 4 пункта под выбранную goal.
 *
 * См. spec §1 (interstitial-plan).
 */

export default function PlanScreen() {
  const { t } = useTranslation();
  const { data: state } = useOnboardingState();
  const copy = planCopyForGoal(state?.goal ?? null);

  return (
    <OnboardingShell
      trackKey="plan"
      step={12}
      total={14}
      title={copy.title}
      subtitle={copy.subtitle}
      onContinue={() => router.push('/onboarding/building')}
      continueLabel={t('onboarding.common.continue')}
    >
      <View className="my-2">
        <StackedBarChart />
      </View>

      <View className="gap-2 mt-2">
        {copy.timeline.map((line, i) => (
          <Animated.View
            key={i}
            entering={FadeInUp.duration(260).delay(400 + i * 90)}
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
    </OnboardingShell>
  );
}
