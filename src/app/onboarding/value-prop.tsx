import React from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { FeatureGrid } from '@/components/onboarding/FeatureGrid';
import { Mascot } from '@/components/onboarding/Mascot';

export default function ValuePropScreen() {
  const { t } = useTranslation();
  return (
    <OnboardingShell
      trackKey="value-prop"
      step={11}
      total={12}
      title={t('onboarding.value_prop.title')}
      subtitle={t('onboarding.value_prop.subtitle')}
      onContinue={() => router.push('/onboarding/paywall')}
      continueLabel={t('onboarding.value_prop.continue_label')}
    >
      <View className="items-center mt-2">
        <Animated.View entering={FadeIn.duration(220)}>
          <Mascot pose="cheering" size={120} />
        </Animated.View>
      </View>

      <View className="mt-4">
        <FeatureGrid />
      </View>
    </OnboardingShell>
  );
}
