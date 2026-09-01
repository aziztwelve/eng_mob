import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, Pressable, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react-native';
import { useFxPreferences } from '@/lib/fx-prefs';
import { fx } from '@/lib/fx';
import { getCurrentLang, setUiLang, type UiLang } from '@/lib/i18n';
import { UI_LANGUAGES } from '@/lib/supported-languages';
import { glass } from '@/components/sunset';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { prefs, setPrefs } = useFxPreferences();
  const { t } = useTranslation();
  const [lang, setLang] = useState<UiLang>(getCurrentLang());

  const changeLang = async (next: UiLang) => {
    if (next === lang) return;
    await setUiLang(next);
    setLang(next);
    fx.tap();
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: t('profile.settings.title') }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 + insets.bottom }}
      >
        <Text style={s.sectionLabel}>{t('profile.settings.language_section')}</Text>

        <View style={[glass, s.langCard]}>
          <View style={s.langHead}>
            <Globe size={20} color="#FFD84A" />
            <Text style={s.langTitle}>{t('profile.settings.language')}</Text>
          </View>
          <View style={s.langRow}>
            {UI_LANGUAGES.map((l) => {
              const active = l.code === lang;
              return (
                <Pressable
                  key={l.code}
                  onPress={() => changeLang(l.code)}
                  style={[s.langOption, active && s.langOptionActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={s.langFlag}>{l.flag}</Text>
                  <Text style={[s.langName, active && s.langNameActive]} numberOfLines={1}>
                    {l.nameNative}
                  </Text>
                  {active && <View style={s.langDot} />}
                </Pressable>
              );
            })}
          </View>
          <Text style={s.langNote}>
            {t('profile.settings.language_note')}
          </Text>
        </View>

        <Text style={s.sectionLabel}>{t('profile.settings.effects_section')}</Text>

        <SettingsRow
          emoji="📳"
          title={t('profile.settings.haptics')}
          description={t('profile.settings.haptics_desc')}
          value={prefs.haptics}
          onValueChange={(v) => {
            void setPrefs({ haptics: v });
            if (v) fx.tap();
          }}
        />

        <SettingsRow
          emoji="🔊"
          title={t('profile.settings.sounds')}
          description={t('profile.settings.sounds_desc')}
          value={prefs.sounds}
          onValueChange={(v) => {
            void setPrefs({ sounds: v });
            if (v) fx.onXPGain();
          }}
        />

        <Text style={s.note}>
          {t('profile.settings.note')}
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

  /* Язык приложения */
  langCard: { borderRadius: 20, padding: 16, gap: 12 },
  langHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langTitle: { color: '#fff', fontWeight: '900', fontSize: 15 },
  langRow: { flexDirection: 'row', gap: 8 },
  langOption: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  langOptionActive: {
    backgroundColor: 'rgba(255,216,74,0.14)',
    borderColor: 'rgba(255,216,74,0.55)',
  },
  langFlag: { fontSize: 22 },
  langName: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '800' },
  langNameActive: { color: '#FFD84A' },
  langDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFD84A',
  },
  langNote: { color: 'rgba(255,255,255,0.55)', fontSize: 11.5, lineHeight: 16 },
});
