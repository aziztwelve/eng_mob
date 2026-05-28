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
 * <StackedBarChart> — stacked bar для interstitial-plan.
 *
 * 3 столбца (1 нед / 1 мес / 3 мес), каждый делится на 4 категории:
 * Speaking / Listening / Reading / Vocab. Растёт суммарно — показывает,
 * как «раскрывается путь» во времени.
 *
 * Цвета категорий — из tailwind palette (variants of primary). Анимация:
 * каждый столбец grow от 0 → target с задержкой по индексу.
 */

interface CategoryShare {
  /** Сумма всех долей в одном столбце ≈ 1.0. */
  speaking: number;
  listening: number;
  reading: number;
  vocab: number;
}

const MAX_BAR_HEIGHT = 200;

const CATEGORY_COLORS = {
  speaking: 'bg-primary',
  listening: 'bg-emerald-500',
  reading: 'bg-amber-500',
  vocab: 'bg-sky-500',
};

interface PhaseBarProps {
  label: string;
  share: CategoryShare;
  total: number;
  delay: number;
}

function PhaseBar({ label, share, total, delay }: PhaseBarProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(total, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress, total, delay]);

  // Каждая секция = (share.cat * progress) — все они грузятся пропорционально.
  const speakingStyle = useAnimatedStyle(() => ({
    height: progress.value * share.speaking * MAX_BAR_HEIGHT,
  }));
  const listeningStyle = useAnimatedStyle(() => ({
    height: progress.value * share.listening * MAX_BAR_HEIGHT,
  }));
  const readingStyle = useAnimatedStyle(() => ({
    height: progress.value * share.reading * MAX_BAR_HEIGHT,
  }));
  const vocabStyle = useAnimatedStyle(() => ({
    height: progress.value * share.vocab * MAX_BAR_HEIGHT,
  }));

  return (
    <View className="flex-1 items-center gap-2">
      <View
        className="flex-col-reverse w-12 rounded-xl overflow-hidden"
        style={{ height: MAX_BAR_HEIGHT }}
      >
        <Animated.View style={[speakingStyle]} className={CATEGORY_COLORS.speaking} />
        <Animated.View style={[listeningStyle]} className={CATEGORY_COLORS.listening} />
        <Animated.View style={[readingStyle]} className={CATEGORY_COLORS.reading} />
        <Animated.View style={[vocabStyle]} className={CATEGORY_COLORS.vocab} />
      </View>
      <Text className="text-muted-foreground font-bold text-xs">{label}</Text>
    </View>
  );
}

export function StackedBarChart() {
  const { t } = useTranslation();
  const PHASES = useMemo<{ label: string; share: CategoryShare; total: number }[]>(
    () => [
      { label: t('onboarding.stacked_chart.label_1w'), share: { speaking: 0.20, listening: 0.30, reading: 0.20, vocab: 0.30 }, total: 0.30 },
      { label: t('onboarding.stacked_chart.label_1m'), share: { speaking: 0.30, listening: 0.25, reading: 0.20, vocab: 0.25 }, total: 0.65 },
      { label: t('onboarding.stacked_chart.label_3m'), share: { speaking: 0.40, listening: 0.20, reading: 0.20, vocab: 0.20 }, total: 1.00 },
    ],
    [t],
  );
  const CATEGORY_LABELS = useMemo<{ key: keyof CategoryShare; label: string; color: string }[]>(
    () => [
      { key: 'speaking',  label: t('onboarding.stacked_chart.cat_speaking'),  color: CATEGORY_COLORS.speaking },
      { key: 'listening', label: t('onboarding.stacked_chart.cat_listening'), color: CATEGORY_COLORS.listening },
      { key: 'reading',   label: t('onboarding.stacked_chart.cat_reading'),   color: CATEGORY_COLORS.reading },
      { key: 'vocab',     label: t('onboarding.stacked_chart.cat_vocab'),     color: CATEGORY_COLORS.vocab },
    ],
    [t],
  );
  return (
    <View className="gap-4">
      {/* Legend */}
      <View className="flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {CATEGORY_LABELS.map((c) => (
          <View key={c.key} className="flex-row items-center gap-2">
            <View className={`w-3 h-3 rounded-full ${c.color}`} />
            <Text className="text-foreground font-bold text-xs">{c.label}</Text>
          </View>
        ))}
      </View>

      {/* Bars */}
      <View className="flex-row items-end justify-between bg-card border-2 border-border rounded-2xl py-4 px-3">
        {PHASES.map((p, i) => (
          <PhaseBar
            key={p.label}
            label={p.label}
            share={p.share}
            total={p.total}
            delay={120 + i * 150}
          />
        ))}
      </View>
    </View>
  );
}
