import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { glass, CTA } from '@/components/sunset';
import type { AIScenario } from '@/types/api';

export function ScenarioCard({
  scenario,
  loading = false,
  onStart,
}: {
  scenario: AIScenario;
  loading?: boolean;
  onStart: (scenarioId: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={[s.card, glass]}>
      <View style={s.header}>
        <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
          <View style={s.titleRow}>
            <Sparkles size={14} color="#FFD84A" />
            <Text style={s.title} numberOfLines={2}>{scenario.title}</Text>
          </View>
          <Text style={s.desc}>{scenario.description}</Text>
        </View>
        <View style={s.levelBadge}>
          <Text style={s.levelText}>{scenario.user_level || '—'}</Text>
        </View>
      </View>

      {scenario.ai_role ? (
        <Text style={s.role}>
          <Text style={s.roleLabel}>{t('ai.ai_role')}</Text>
          {scenario.ai_role}
        </Text>
      ) : null}

      {scenario.vocabulary_focus && scenario.vocabulary_focus.length > 0 && (
        <View style={s.vocabRow}>
          {scenario.vocabulary_focus.slice(0, 6).map((w) => (
            <View key={w} style={[s.vocabPill, glass]}>
              <Text style={s.vocabText}>{w}</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable onPress={() => onStart(scenario.id)} disabled={loading} style={s.ctaWrap}>
        <LinearGradient
          colors={loading ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.12)'] : CTA}
          style={s.cta}
        >
          {loading
            ? <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
            : <Text style={s.ctaText}>{t('ai.start')}</Text>}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 22, padding: 16, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  title: { color: '#fff', fontSize: 15, fontWeight: '800', flexShrink: 1 },
  desc: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '500', lineHeight: 18 },
  levelBadge: { backgroundColor: 'rgba(255,216,74,0.15)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  levelText: { color: '#FFD84A', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  role: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '500' },
  roleLabel: { color: 'rgba(255,255,255,0.45)', fontWeight: '700', textTransform: 'uppercase', fontSize: 10 },
  vocabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  vocabPill: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 3 },
  vocabText: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  ctaWrap: { borderRadius: 14, overflow: 'hidden', alignSelf: 'stretch', marginTop: 2 },
  cta: { paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
