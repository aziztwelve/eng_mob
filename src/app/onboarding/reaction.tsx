import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useTranslation } from 'react-i18next';

import { Mascot } from '@/components/onboarding/Mascot';
import {
  getReaction,
  type ReactionStep,
} from '@/lib/onboarding-reactions';

/**
 * Generic reaction-interstitial (5 интерстициалов в онбординге v3).
 *
 * Использование:
 *   router.push({
 *     pathname: '/onboarding/reaction',
 *     params: {
 *       step: 'speaking_situation',
 *       value: 'freeze',
 *       next: '/onboarding/past-blocker',
 *     },
 *   });
 *
 * Если для (step, value) нет mapping'а — сразу редиректим на `next`.
 *
 * См. docs/tasks/mob/onboarding-v3-oki-style.md §3.6.
 */
export default function ReactionScreen() {
  const { t } = useTranslation();
  const { step, value, next } = useLocalSearchParams<{
    step?: string;
    value?: string;
    next?: string;
  }>();

  const reaction = step && value ? getReaction(step as ReactionStep, value) : null;
  const nextRoute = next || '/onboarding/welcome';

  React.useEffect(() => {
    if (!reaction) {
      // Нет настроенного reaction — не задерживаем юзера.
      router.replace(nextRoute as never);
    }
  }, [reaction, nextRoute]);

  if (!reaction) return null;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }} className="bg-background">
      <View className="flex-1 px-6 items-center justify-center gap-6">
        <Animated.View entering={FadeIn.duration(220)}>
          <Mascot pose={reaction.pose} size={180} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(280).delay(120)}>
          <Text className="text-foreground font-black text-2xl text-center leading-tight">
            {reaction.text}
          </Text>
        </Animated.View>
      </View>

      <View className="px-4 pb-3 pt-2 bg-background border-t border-border/40">
        <Pressable
          onPress={() => router.push(nextRoute as never)}
          className="rounded-2xl py-4 items-center bg-primary active:opacity-80"
        >
          <Text className="text-primary-foreground font-black text-base">
            {t('onboarding.reaction.continue')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
