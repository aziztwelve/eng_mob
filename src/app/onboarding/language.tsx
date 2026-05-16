import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import {
  useOnboardingState,
  usePatchOnboarding,
} from '@/hooks/use-onboarding';

const TOTAL = 5;

interface LangOption {
  code: string;
  name: string;
  flag: string;
}

const LANGUAGES: LangOption[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'kk', name: 'Қазақша', flag: '🇰🇿' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

export default function LanguageScreen() {
  const state = useOnboardingState();
  const patch = usePatchOnboarding();
  const [selected, setSelected] = useState<string | null>(
    state.data?.target_language ?? null,
  );

  const handleContinue = async () => {
    if (!selected) return;
    await patch.mutateAsync({ target_language: selected });
    router.push('/onboarding/level');
  };

  return (
    <OnboardingShell
      step={2}
      total={TOTAL}
      title="Какой язык учим?"
      subtitle="Выберите основной язык. Менять можно в настройках."
      onContinue={handleContinue}
      continueDisabled={!selected}
      continueLoading={patch.isPending}
    >
      <View className="gap-2 mt-2">
        {LANGUAGES.map((lang) => {
          const active = selected === lang.code;
          return (
            <Pressable
              key={lang.code}
              onPress={() => setSelected(lang.code)}
              className={`flex-row items-center bg-card rounded-2xl border-4 p-4 active:opacity-80 ${
                active ? 'border-primary' : 'border-border'
              }`}
            >
              <Text className="text-3xl mr-3">{lang.flag}</Text>
              <Text className="text-foreground font-black text-lg flex-1">
                {lang.name}
              </Text>
              {active && (
                <View className="w-7 h-7 rounded-full bg-primary items-center justify-center">
                  <Check size={16} color="#ffffff" strokeWidth={3} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </OnboardingShell>
  );
}
