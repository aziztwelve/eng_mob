import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Target } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useUpdateDailyGoal } from '@/hooks/use-daily-goal';
import {
  useOnboardingState,
  usePatchOnboarding,
} from '@/hooks/use-onboarding';

const TOTAL = 5;

interface GoalOption {
  xp: number;
  label: string;
  intensity: string;
  emoji: string;
}

const GOALS: GoalOption[] = [
  { xp: 10, label: 'Casual', intensity: '5 мин в день', emoji: '🌱' },
  { xp: 20, label: 'Regular', intensity: '10 мин в день', emoji: '🌿' },
  { xp: 30, label: 'Serious', intensity: '15 мин в день', emoji: '🌳' },
  { xp: 50, label: 'Intense', intensity: '20+ мин в день', emoji: '🔥' },
];

export default function GoalScreen() {
  const state = useOnboardingState();
  const patch = usePatchOnboarding();
  const updateGoal = useUpdateDailyGoal();
  const [selected, setSelected] = useState<number>(
    state.data?.daily_goal_xp ?? 20,
  );

  const handleContinue = async () => {
    // Сохраняем локально (для onboarding state) + в backend через
    // gamification (это уже public endpoint).
    try {
      await Promise.all([
        patch.mutateAsync({ daily_goal_xp: selected }),
        updateGoal.mutateAsync(selected),
      ]);
      router.push('/onboarding/notifications');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Не удалось сохранить цель',
        text2: err instanceof Error ? err.message : '',
      });
    }
  };

  const isPending = patch.isPending || updateGoal.isPending;

  return (
    <OnboardingShell
      step={4}
      total={TOTAL}
      title="Выбери дневную цель"
      subtitle="XP начисляются за каждый шаг урока. Цель можно изменить в любой момент."
      onContinue={handleContinue}
      continueLoading={isPending}
    >
      <View className="gap-2 mt-2">
        {GOALS.map((goal) => {
          const active = selected === goal.xp;
          return (
            <Pressable
              key={goal.xp}
              onPress={() => setSelected(goal.xp)}
              className={`bg-card rounded-2xl border-4 p-4 active:opacity-80 ${
                active ? 'border-primary' : 'border-border'
              }`}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-3xl">{goal.emoji}</Text>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-foreground font-black text-base">
                      {goal.label}
                    </Text>
                    <View className="flex-row items-center gap-1 bg-amber-500/20 rounded-full px-2 py-0.5">
                      <Target size={11} color="#f59e0b" />
                      <Text className="text-amber-500 font-black text-xs tabular-nums">
                        {goal.xp} XP
                      </Text>
                    </View>
                  </View>
                  <Text className="text-muted-foreground font-medium text-sm">
                    {goal.intensity}
                  </Text>
                </View>
                <View
                  className={`w-7 h-7 rounded-full ${
                    active ? 'bg-primary' : 'bg-muted'
                  } items-center justify-center`}
                >
                  {active && (
                    <View className="w-3 h-3 rounded-full bg-white" />
                  )}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingShell>
  );
}
