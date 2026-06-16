import React from 'react';
import { View, Text, ScrollView, Switch, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFxPreferences } from '@/lib/fx-prefs';
import { fx } from '@/lib/fx';
import { glass } from '@/components/sunset';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { prefs, setPrefs } = useFxPreferences();

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Настройки' }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 + insets.bottom }}
      >
        <Text style={s.sectionLabel}>Эффекты</Text>

        <SettingsRow
          emoji="📳"
          title="Haptic feedback"
          description="Тактильная отдача на правильный ответ, level-up и achievements."
          value={prefs.haptics}
          onValueChange={(v) => {
            void setPrefs({ haptics: v });
            if (v) fx.tap();
          }}
        />

        <SettingsRow
          emoji="🔊"
          title="Sound effects"
          description="Короткие UI-звуки на quiz/XP/achievements. Не влияет на видеоуроки."
          value={prefs.sounds}
          onValueChange={(v) => {
            void setPrefs({ sounds: v });
            if (v) fx.onXPGain();
          }}
        />

        <Text style={s.note}>
          Изменения сохраняются на устройстве и применяются мгновенно.
          Геймификация продолжает работать даже при выключенных эффектах —
          отключаются только звук и вибрация.
        </Text>
      </ScrollView>
    </View>
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
    <View style={[glass, s.row]}>
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        <Text style={s.rowDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: 'rgba(255,255,255,0.25)', true: '#FFB338' }}
        thumbColor="#ffffff"
        ios_backgroundColor="rgba(255,255,255,0.25)"
      />
    </View>
  );
}

const s = StyleSheet.create({
  sectionLabel: {
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 6,
    marginBottom: 2,
  },
  row: { borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { color: '#fff', fontWeight: '900', fontSize: 15, marginBottom: 3 },
  rowDesc: { color: 'rgba(255,255,255,0.72)', fontSize: 12, lineHeight: 17 },
  note: { color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 18, marginTop: 10, paddingHorizontal: 4 },
});
