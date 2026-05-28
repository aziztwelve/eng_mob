import React, { useEffect, useMemo } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

/**
 * <ProjectionChart> — bar chart "Lumi vs другие методы".
 *
 * 4 timepoint'а × 2 столбца (Lumi vs Other). Грубая визуализация прогресса:
 *   start: 5% / 5%
 *   2 нед: 35% / 12%
 *   1 мес: 60% / 22%
 *   3 мес: 95% / 35%
 *
 * Реализация: <View>'ы с Reanimated `withTiming` для grow-анимации.
 *
 * Используется в `app/onboarding/projection.tsx` (см. spec §3.7).
 */

const MAX_BAR_HEIGHT = 140;

interface BarPairProps {
  label: string;
  lumi: number;
  other: number;
  delay: number;
}

function BarPair({ label, lumi, other, delay }: BarPairProps) {
  const lumiProgress = useSharedValue(0);
  const otherProgress = useSharedValue(0);

  useEffect(() => {
    lumiProgress.value = withDelay(
      delay,
      withTiming(lumi, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
    otherProgress.value = withDelay(
      delay + 80,
      withTiming(other, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
  }, [lumiProgress, otherProgress, lumi, other, delay]);

  const lumiStyle = useAnimatedStyle(() => ({
    height: lumiProgress.value * MAX_BAR_HEIGHT,
  }));
  const otherStyle = useAnimatedStyle(() => ({
    height: otherProgress.value * MAX_BAR_HEIGHT,
  }));

  return (
    <View className="flex-1 items-center gap-2">
      <View
        className="flex-row items-end justify-center gap-2"
        style={{ height: MAX_BAR_HEIGHT }}
      >
        <Animated.View
          style={[lumiStyle, { width: 22 }]}
          className="rounded-t-lg bg-primary"
        />
        <Animated.View
          style={[otherStyle, { width: 22 }]}
          className="rounded-t-lg bg-muted"
        />
      </View>
      <Text className="text-muted-foreground font-bold text-xs">
        {label}
      </Text>
    </View>
  );
}

export function ProjectionChart() {
  const { t } = useTranslation();
  const POINTS = useMemo(
    () => [
      { label: t('onboarding.projection_chart.label_start'), lumi: 0.05, other: 0.05 },
      { label: t('onboarding.projection_chart.label_2w'),    lumi: 0.35, other: 0.12 },
      { label: t('onboarding.projection_chart.label_1m'),    lumi: 0.60, other: 0.22 },
      { label: t('onboarding.projection_chart.label_3m'),    lumi: 0.95, other: 0.35 },
    ],
    [t],
  );
  return (
    <View className="gap-4">
      {/* Legend */}
      <View className="flex-row items-center justify-center gap-5">
        <View className="flex-row items-center gap-2">
          <View className="w-3 h-3 rounded-full bg-primary" />
          <Text className="text-foreground font-bold text-sm">{t('onboarding.projection_chart.legend_lumi')}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="w-3 h-3 rounded-full bg-muted" />
          <Text className="text-muted-foreground font-bold text-sm">
            {t('onboarding.projection_chart.legend_other')}
          </Text>
        </View>
      </View>

      {/* Bars */}
      <View className="flex-row items-end justify-between bg-card border-2 border-border rounded-2xl py-4 px-3">
        {POINTS.map((p, i) => (
          <BarPair
            key={p.label}
            label={p.label}
            lumi={p.lumi}
            other={p.other}
            delay={120 + i * 100}
          />
        ))}
      </View>
    </View>
  );
}
