import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  Mic,
  PenLine,
  BookOpen,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

/**
 * <FeatureGrid> — 2×2 features-cards для interstitial-value-prop.
 *
 * Speaking / Writing / Vocab / AI-Lessons — лаконичные карточки с
 * иконкой, заголовком и подписью. Анимация — FadeInUp по индексу.
 */

interface Feature {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

export function FeatureGrid() {
  const { t } = useTranslation();
  const FEATURES: Feature[] = useMemo(
    () => [
      {
        icon: Mic,
        title: t('onboarding.feature_grid.speaking_title'),
        subtitle: t('onboarding.feature_grid.speaking_subtitle'),
      },
      {
        icon: PenLine,
        title: t('onboarding.feature_grid.writing_title'),
        subtitle: t('onboarding.feature_grid.writing_subtitle'),
      },
      {
        icon: BookOpen,
        title: t('onboarding.feature_grid.vocab_title'),
        subtitle: t('onboarding.feature_grid.vocab_subtitle'),
      },
      {
        icon: Sparkles,
        title: t('onboarding.feature_grid.ai_title'),
        subtitle: t('onboarding.feature_grid.ai_subtitle'),
      },
    ],
    [t],
  );
  return (
    <View className="flex-row flex-wrap gap-3">
      {FEATURES.map((f, i) => {
        const Icon = f.icon;
        return (
          <Animated.View
            key={f.title}
            entering={FadeInUp.duration(260).delay(120 + i * 80)}
            style={{ width: '48%' }}
          >
            <View className="bg-card border-2 border-border rounded-2xl p-3 gap-2 h-full">
              <View className="w-9 h-9 rounded-xl bg-primary/15 items-center justify-center">
                <Icon size={18} color="#22c55e" />
              </View>
              <Text className="text-foreground font-black text-base">
                {f.title}
              </Text>
              <Text className="text-muted-foreground font-medium text-xs leading-snug">
                {f.subtitle}
              </Text>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}
