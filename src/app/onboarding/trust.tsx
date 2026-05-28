import React, { useMemo } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { Mascot } from '@/components/onboarding/Mascot';

/**
 * Trust interstitial — после past-blocker → reaction-2 → trust.
 *
 * Цель: смягчить давление от прошлых неудач.
 *
 * См. spec §1 (interstitial-trust) и §3.6.
 */

const POINT_EMOJI = ['🧠', '🎧', '🔁'] as const;
const POINT_KEYS = ['knowledge', 'listening', 'practice'] as const;

export default function TrustScreen() {
  const { t } = useTranslation();
  const points = useMemo(
    () =>
      POINT_KEYS.map((k, i) => ({
        emoji: POINT_EMOJI[i],
        text: t(`onboarding.trust.points.${k}` as const),
      })),
    [t],
  );

  return (
    <OnboardingShell
      trackKey="trust"
      step={8}
      total={14}
      title={t('onboarding.trust.title')}
      subtitle={t('onboarding.trust.subtitle')}
      onContinue={() => router.push('/onboarding/future-regret')}
      continueLabel={t('onboarding.trust.continue_label')}
    >
      <View className="items-center mt-2">
        <Animated.View entering={FadeIn.duration(220)}>
          <Mascot pose="thumbs_up" size={140} />
        </Animated.View>
      </View>

      <View className="gap-3 mt-2">
        {points.map((p, i) => (
          <Animated.View
            key={i}
            entering={FadeInUp.duration(280).delay(140 + i * 90)}
            className="flex-row items-start gap-3 bg-card border-2 border-border rounded-2xl px-4 py-3"
          >
            <Text className="text-2xl">{p.emoji}</Text>
            <Text className="flex-1 text-foreground font-bold text-base leading-snug">
              {p.text}
            </Text>
          </Animated.View>
        ))}
      </View>
    </OnboardingShell>
  );
}
