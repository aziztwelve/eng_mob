import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { Mascot } from '@/components/onboarding/Mascot';
import { TestimonialCarousel } from '@/components/onboarding/TestimonialCarousel';
import { useOnboardingState } from '@/hooks/use-onboarding';
import type { TestimonialGoal } from '@/lib/testimonials';

/**
 * Building interstitial — "Собираем твои ответы в один путь" + auto-progress
 * + carousel testimonials + 400K+ / 20K+ social proof.
 *
 * См. spec §1 (interstitial-building).
 */

const PROGRESS_DURATION_MS = 1800;

export default function BuildingScreen() {
  const { t } = useTranslation();
  const { data: state } = useOnboardingState();
  const goal = (state?.goal ?? null) as TestimonialGoal | null;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: PROGRESS_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <OnboardingShell
      trackKey="building"
      step={9}
      total={12}
      title={t('onboarding.building.title')}
      subtitle={t('onboarding.building.subtitle')}
      onContinue={() => router.push('/onboarding/roadmap')}
      continueLabel={t('onboarding.common.continue')}
    >
      <View className="items-center mt-2">
        <Animated.View entering={FadeIn.duration(220)}>
          <Mascot pose="cheering" size={120} />
        </Animated.View>
      </View>

      {/* Progress bar */}
      <View className="mt-4 h-3 bg-muted rounded-full overflow-hidden border-2 border-border">
        <Animated.View style={[barStyle]} className="h-full bg-primary" />
      </View>

      {/* Feature highlights */}
      <View className="flex-row gap-3 mt-3">
        <View className="flex-1 bg-card border-2 border-border rounded-2xl px-4 py-3 items-center">
          <Text className="text-2xl">🤖</Text>
          <Text className="text-foreground font-black text-sm text-center mt-1">
            {t('onboarding.building.feat_a_title')}
          </Text>
          <Text className="text-muted-foreground font-bold text-xs text-center mt-1">
            {t('onboarding.building.feat_a_label')}
          </Text>
        </View>
        <View className="flex-1 bg-card border-2 border-border rounded-2xl px-4 py-3 items-center">
          <Text className="text-2xl">🔁</Text>
          <Text className="text-foreground font-black text-sm text-center mt-1">
            {t('onboarding.building.feat_b_title')}
          </Text>
          <Text className="text-muted-foreground font-bold text-xs text-center mt-1">
            {t('onboarding.building.feat_b_label')}
          </Text>
        </View>
      </View>

      {/* Carousel */}
      <View className="mt-4">
        <TestimonialCarousel goal={goal} />
      </View>
    </OnboardingShell>
  );
}
