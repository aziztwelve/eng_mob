import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScenarioCard } from '@/components/ai/scenario-card';
import { QuotaWidget, hasQuotaLeft } from '@/components/ai/quota-widget';
import { useAIQuota, useAIScenarios, useStartConversation } from '@/hooks/use-ai';
import { glass, SunsetHeader, SunsetSubhead } from '@/components/sunset';

const LANG_OPTIONS: { value: string; label: string; disabled?: boolean }[] = [
  { value: '', label: 'Все' },
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES', disabled: true },
  { value: 'de', label: 'DE', disabled: true },
  { value: 'fr', label: 'FR', disabled: true },
];

const LEVEL_OPTIONS = [
  { value: '', label: 'Все' },
  { value: 'A1', label: 'A1' },
  { value: 'A2', label: 'A2' },
  { value: 'B1', label: 'B1' },
  { value: 'B2', label: 'B2' },
  { value: 'C1', label: 'C1' },
];

export default function RoleplayScreen() {
  const [language, setLanguage] = useState('');
  const [level, setLevel] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const list = useAIScenarios({ language: language || undefined, user_level: level || undefined });
  const quota = useAIQuota();
  const startMut = useStartConversation();

  const scenarios = list.data?.scenarios ?? [];
  const canChat = hasQuotaLeft(quota.data, 'chat');

  const handleStart = async (scenarioId: string) => {
    if (!canChat) return;
    setPendingId(scenarioId);
    try {
      const sc = scenarios.find((s) => s.id === scenarioId);
      const resp = await startMut.mutateAsync({
        scenario: scenarioId.startsWith('roleplay_') ? scenarioId : `roleplay_${scenarioId}`,
        target_language: sc?.language || language || undefined,
        user_level: sc?.user_level || level || undefined,
        title: sc?.title,
      });
      router.push(`/ai/chat/${resp.conversation.id}`);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Не удалось запустить',
        text2: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 78 + insets.bottom }}
      >
        <SunsetHeader title="Roleplay" />

        <QuotaWidget compact />

        {!canChat && (
          <View style={s.warnCard}>
            <Text style={s.warnText}>Лимит чатов на сегодня исчерпан. Попробуйте завтра.</Text>
          </View>
        )}

        {/* Фильтры */}
        <View style={[s.filterCard, glass]}>
          <Text style={s.filterLabel}>Язык</Text>
          <View style={s.pillRow}>
            {LANG_OPTIONS.map((o) => (
              <FilterPill
                key={o.value || 'all-lang'}
                active={language === o.value}
                label={o.label}
                disabled={o.disabled}
                onPress={() => setLanguage(o.value)}
              />
            ))}
          </View>
          <Text style={[s.filterLabel, { marginTop: 12 }]}>Уровень</Text>
          <View style={s.pillRow}>
            {LEVEL_OPTIONS.map((o) => (
              <FilterPill
                key={o.value || 'all-level'}
                active={level === o.value}
                label={o.label}
                onPress={() => setLevel(o.value)}
              />
            ))}
          </View>
        </View>

        <SunsetSubhead title="Сценарии" />

        {list.isLoading ? (
          <View style={[s.emptyCard, glass]}>
            <ActivityIndicator color="#FFD84A" />
          </View>
        ) : scenarios.length === 0 ? (
          <View style={[s.emptyCard, glass]}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🎭</Text>
            <Text style={s.emptyTitle}>Сценарии не найдены</Text>
            <Text style={s.emptyText}>Попробуйте другие фильтры или сбросьте их.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {scenarios.map((sc) => (
              <ScenarioCard
                key={sc.id}
                scenario={sc}
                loading={pendingId === sc.id && startMut.isPending}
                onStart={handleStart}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function FilterPill({
  active,
  label,
  onPress,
  disabled,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={() => !disabled && onPress()}
      disabled={disabled}
      style={[
        s.pill,
        active && !disabled ? s.pillActive : glass,
        disabled && s.pillDisabled,
      ]}
    >
      <Text style={[s.pillText, active && !disabled && s.pillTextActive]}>
        {label}
      </Text>
      {disabled && <Text style={s.soonText}>Скоро</Text>}
    </Pressable>
  );
}

const s = StyleSheet.create({
  warnCard: {
    marginTop: 14,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  warnText: { color: '#f59e0b', fontSize: 13, fontWeight: '600' },

  filterCard: { borderRadius: 20, padding: 13, marginTop: 12 },
  filterLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 5 },
  pillActive: { backgroundColor: '#A8243F', borderWidth: 0 },
  pillDisabled: { opacity: 0.45 },
  pillText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700' },
  pillTextActive: { color: '#fff' },
  soonText: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },

  emptyCard: { borderRadius: 20, padding: 32, alignItems: 'center' },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500', textAlign: 'center' },
});
