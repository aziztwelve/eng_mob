import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import {
  useOnboardingState,
  usePatchOnboarding,
} from '@/hooks/use-onboarding';
import type { ProficiencyLevel } from '@/lib/onboarding-storage';

const TOTAL = 5;

interface LevelOption {
  value: ProficiencyLevel;
  label: string;
  description: string;
}

const LEVELS: LevelOption[] = [
  {
    value: 'beginner',
    label: 'С нуля',
    description: 'Никогда не учил этот язык.',
  },
  {
    value: 'a1',
    label: 'A1 — Beginner',
    description: 'Знаю базовые слова и фразы.',
  },
  {
    value: 'a2',
    label: 'A2 — Elementary',
    description: 'Могу строить простые предложения.',
  },
  {
    value: 'b1',
    label: 'B1 — Intermediate',
    description: 'Понимаю обыденную речь, общаюсь в большинстве ситуаций.',
  },
  {
    value: 'b2',
    label: 'B2 — Upper-Intermediate',
    description: 'Свободно говорю и понимаю сложные тексты.',
  },
  {
    value: 'just_for_fun',
    label: 'Just for fun',
    description: 'Просто хочу попробовать без целей.',
  },
];

export default function LevelScreen() {
  const state = useOnboardingState();
  const patch = usePatchOnboarding();
  const [selected, setSelected] = useState<ProficiencyLevel | null>(
    state.data?.level ?? null,
  );

  const handleContinue = async () => {
    if (!selected) return;
    await patch.mutateAsync({ level: selected });
    router.push('/onboarding/goal');
  };

  return (
    <OnboardingShell
      step={3}
      total={TOTAL}
      title="Какой у тебя уровень?"
      subtitle="Это поможет подобрать материал. Можно ответить честно — мы не пропустим базу, если она нужна."
      onContinue={handleContinue}
      continueDisabled={!selected}
      continueLoading={patch.isPending}
    >
      <View className="gap-2 mt-2">
        {LEVELS.map((lvl) => {
          const active = selected === lvl.value;
          return (
            <Pressable
              key={lvl.value}
              onPress={() => setSelected(lvl.value)}
              className={`bg-card rounded-2xl border-4 p-4 active:opacity-80 ${
                active ? 'border-primary' : 'border-border'
              }`}
            >
              <View className="flex-row items-start gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-foreground font-black text-base">
                    {lvl.label}
                  </Text>
                  <Text className="text-muted-foreground font-medium text-sm">
                    {lvl.description}
                  </Text>
                </View>
                {active && (
                  <View className="w-7 h-7 rounded-full bg-primary items-center justify-center mt-0.5">
                    <Check size={16} color="#ffffff" strokeWidth={3} />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingShell>
  );
}
