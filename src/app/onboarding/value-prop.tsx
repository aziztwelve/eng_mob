import React from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
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
      step={12}
      total={14}
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

      <View className="flex-row items-center justify-center gap-4 mt-2">
        <Stat
          number={t('onboarding.value_prop.stats.users_number')}
          label={t('onboarding.value_prop.stats.users_label')}
        />
        <View className="w-px h-10 bg-border" />
        <Stat
          number={t('onboarding.value_prop.stats.rating_number')}
          label={t('onboarding.value_prop.stats.rating_label')}
        />
        <View className="w-px h-10 bg-border" />
        <Stat
          number={t('onboarding.value_prop.stats.cheaper_number')}
          label={t('onboarding.value_prop.stats.cheaper_label')}
        />
      </View>

      <View className="mt-4">
        <FeatureGrid />
      </View>
    </OnboardingShell>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <View className="items-center">
      <Text className="text-foreground font-black text-xl">{number}</Text>
      <Text className="text-muted-foreground font-bold text-xs text-center">
        {label}
      </Text>
    </View>
  );
}
