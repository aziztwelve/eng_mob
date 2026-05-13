import React from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { Stack } from 'expo-router';
import { useFxPreferences } from '@/lib/fx-prefs';
import { fx } from '@/lib/fx';

export default function SettingsScreen() {
  const { prefs, setPrefs } = useFxPreferences();

  return (
    <>
      <Stack.Screen options={{ title: 'Настройки' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-3">
          <Text className="text-muted-foreground uppercase text-xs font-black mt-2 mb-1">
            Эффекты
          </Text>

          <SettingsRow
            emoji="📳"
            title="Haptic feedback"
            description="Тактильная отдача на правильный ответ, level-up и achievements."
            value={prefs.haptics}
            onValueChange={(v) => {
              void setPrefs({ haptics: v });
              if (v) fx.tap(); // мгновенный preview включения
            }}
          />

          <SettingsRow
            emoji="🔊"
            title="Sound effects"
            description="Короткие UI-звуки на quiz/XP/achievements. Не влияет на видеоуроки."
            value={prefs.sounds}
            onValueChange={(v) => {
              void setPrefs({ sounds: v });
              if (v) fx.onXPGain(); // preview
            }}
          />

          <Text className="text-muted-foreground text-xs leading-relaxed mt-3 px-1">
            Изменения сохраняются на устройстве и применяются мгновенно.
            Геймификация продолжает работать даже при выключенных эффектах —
            отключаются только звук и вибрация.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

function SettingsRow({
  emoji,
  title,
  description,
  value,
  onValueChange,
}: {
  emoji: string;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View className="bg-card rounded-2xl p-4 border-2 border-border flex-row items-center gap-3">
      <Text className="text-2xl">{emoji}</Text>
      <View className="flex-1">
        <Text className="text-foreground font-black mb-1">{title}</Text>
        <Text className="text-muted-foreground text-xs leading-relaxed">
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#3f3f46', true: '#58cc02' }}
        thumbColor="#ffffff"
        ios_backgroundColor="#3f3f46"
      />
    </View>
  );
}
