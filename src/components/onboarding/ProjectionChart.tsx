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
 * <ProjectionChart> — bar chart "LingoIQ vs другие методы".
 *
 * 4 timepoint'а × 2 столбца (LingoIQ vs Other). Грубая визуализация прогресса:
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
  lingoiq: number;
  other: number;
  delay: number;
}

function BarPair({ label, lingoiq, other, delay }: BarPairProps) {
  const lingoiqProgress = useSharedValue(0);
  const otherProgress = useSharedValue(0);

  useEffect(() => {
    lingoiqProgress.value = withDelay(
      delay,
      withTiming(lingoiq, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
    otherProgress.value = withDelay(
      delay + 80,
      withTiming(other, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
  }, [lingoiqProgress, otherProgress, lingoiq, other, delay]);

  const lingoiqStyle = useAnimatedStyle(() => ({
    height: lingoiqProgress.value * MAX_BAR_HEIGHT,
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
          style={[lingoiqStyle, { width: 22 }]}
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
      { label: t('onboarding.projection_chart.label_start'), lingoiq: 0.05, other: 0.05 },
      { label: t('onboarding.projection_chart.label_2w'),    lingoiq: 0.35, other: 0.12 },
      { label: t('onboarding.projection_chart.label_1m'),    lingoiq: 0.60, other: 0.22 },
      { label: t('onboarding.projection_chart.label_3m'),    lingoiq: 0.95, other: 0.35 },
    ],
    [t],
  );
  return (
    <View className="gap-4">
      {/* Legend */}
      <View className="flex-row items-center justify-center gap-5">
        <View className="flex-row items-center gap-2">
          <View className="w-3 h-3 rounded-full bg-primary" />
          <Text className="text-foreground font-bold text-sm">{t('onboarding.projection_chart.legend_lingoiq')}</Text>
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
            lingoiq={p.lingoiq}
            other={p.other}
            delay={120 + i * 100}
          />
        ))}
      </View>
    </View>
  );
}
