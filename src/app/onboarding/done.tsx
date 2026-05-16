import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { CheckCircle2, Sparkles, Target, Flame } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import {
  useCompleteOnboarding,
  useOnboardingState,
} from '@/hooks/use-onboarding';
import { fx } from '@/lib/fx';

const TOTAL = 5;

/**
 * Финальный экран onboarding'а.
 *
 * - Показываем summary выбранных параметров (язык / уровень / цель).
 * - Празднуем — большой ✓ + spring анимация + success haptic + chime.
 * - По Continue: markOnboardingComplete() → router.replace('/(tabs)').
 *   replace, чтобы юзер не мог вернуться gesture-back'ом в /onboarding/*.
 */
export default function OnboardingDoneScreen() {
  const state = useOnboardingState();
  const complete = useCompleteOnboarding();
  const celebrated = useRef(false);

  // Spring-in для иконки ✓.
  const scale = useSharedValue(0);
  const rotate = useSharedValue(-20);

  useEffect(() => {
    scale.value = withDelay(
      120,
      withSequence(
        withSpring(1.15, { damping: 8, stiffness: 140 }),
        withSpring(1, { damping: 10, stiffness: 120 }),
      ),
    );
    rotate.value = withDelay(
      120,
      withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) }),
    );
    if (!celebrated.current) {
      celebrated.current = true;
      // Имитируем success — переиспользуем daily-goal chime + haptic.
      void fx.onDailyGoal();
    }
  }, [scale, rotate]);

  const animatedIcon = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const summary = useMemo(() => {
    const s = state.data;
    return [
      {
        icon: <Sparkles size={18} color="#a855f7" />,
        label: 'Язык',
        value: s?.target_language?.toUpperCase() ?? '—',
      },
      {
        icon: <Flame size={18} color="#f97316" />,
        label: 'Уровень',
        value: levelLabel(s?.level),
      },
      {
        icon: <Target size={18} color="#f59e0b" />,
        label: 'Дневная цель',
        value: s?.daily_goal_xp ? `${s.daily_goal_xp} XP` : '—',
      },
    ];
  }, [state.data]);

  const handleContinue = async () => {
    try {
      await complete.mutateAsync();
      router.replace('/(tabs)');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Не удалось завершить',
        text2: err instanceof Error ? err.message : '',
      });
    }
  };

  return (
    <OnboardingShell
      step={5}
      total={TOTAL}
      showBack={false}
      title="Готово!"
      subtitle="Профиль настроен. Можно начинать первый урок."
      onContinue={handleContinue}
      continueLabel="К урокам"
      continueLoading={complete.isPending}
    >
      <View className="items-center py-6">
        <Animated.View style={animatedIcon}>
          <View className="w-28 h-28 rounded-full bg-primary/20 items-center justify-center">
            <CheckCircle2 size={84} color="#58cc02" strokeWidth={2.5} />
          </View>
        </Animated.View>
      </View>

      <View className="bg-card rounded-3xl border-4 border-border p-5 gap-3">
        <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
          Твой план
        </Text>
        {summary.map((row) => (
          <View
            key={row.label}
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-2">
              {row.icon}
              <Text className="text-foreground font-bold text-sm">
                {row.label}
              </Text>
            </View>
            <Text className="text-foreground font-black text-base">
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      <Text className="text-muted-foreground font-medium text-xs text-center mt-3">
        Настройки всегда можно изменить в профиле.
      </Text>
    </OnboardingShell>
  );
}

function levelLabel(level: string | null | undefined): string {
  switch (level) {
    case 'beginner':
      return 'С нуля';
    case 'a1':
      return 'A1';
    case 'a2':
      return 'A2';
    case 'b1':
      return 'B1';
    case 'b2':
      return 'B2';
    case 'just_for_fun':
      return 'Just for fun';
    default:
      return '—';
  }
}
