import React from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { Sparkles, Brain, Flame, Trophy } from 'lucide-react-native';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';

const TOTAL = 5;

export default function WelcomeScreen() {
  return (
    <OnboardingShell
      step={1}
      total={TOTAL}
      showBack={false}
      title="Добро пожаловать!"
      subtitle="Учим язык весело и эффективно — короткие уроки каждый день, интервальное повторение и геймификация."
      onContinue={() => router.push('/onboarding/language')}
      continueLabel="Начать"
    >
      <View className="bg-card rounded-3xl border-4 border-border p-5 gap-4 mt-2">
        <Feature
          icon={<Brain size={22} color="#58cc02" />}
          title="Адаптивное обучение"
          description="Алгоритм SM-2 решает, что повторить именно сегодня."
        />
        <Feature
          icon={<Flame size={22} color="#f97316" />}
          title="Streak и daily goal"
          description="Каждый день — XP, streak, hearts. Не пропусти ни одного."
        />
        <Feature
          icon={<Trophy size={22} color="#f59e0b" />}
          title="Лиги и ачивки"
          description="32 достижения и недельные лиги — Bronze → Diamond."
        />
        <Feature
          icon={<Sparkles size={22} color="#a855f7" />}
          title="AI-учитель"
          description="Чат, ролевые сценарии, проверка письма и произношения."
        />
      </View>
    </OnboardingShell>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="w-10 h-10 rounded-2xl bg-muted items-center justify-center">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-foreground font-black text-base">{title}</Text>
        <Text className="text-muted-foreground font-medium text-sm">
          {description}
        </Text>
      </View>
    </View>
  );
}
