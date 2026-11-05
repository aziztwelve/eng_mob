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
            <Sparkles size={14} color="#1789BD" />
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
            ? <ActivityIndicator size="small" color="#5D686F" />
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
  title: { color: '#171A1C', fontSize: 15, fontFamily: 'Nunito_800ExtraBold', flexShrink: 1 },
  desc: { color: '#5D686F', fontSize: 13, fontFamily: 'Nunito_600SemiBold', lineHeight: 18 },
  levelBadge: { backgroundColor: 'rgba(255,216,74,0.15)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  levelText: { color: '#1789BD', fontSize: 11, fontFamily: 'Nunito_800ExtraBold', textTransform: 'uppercase' },
  role: { color: '#5D686F', fontSize: 12, fontFamily: 'Nunito_600SemiBold' },
  roleLabel: { color: '#5D686F', fontFamily: 'Nunito_700Bold', textTransform: 'uppercase', fontSize: 10 },
  vocabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  vocabPill: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 3 },
  vocabText: { color: '#5D686F', fontSize: 12, fontFamily: 'Nunito_600SemiBold' },
  ctaWrap: { borderRadius: 14, overflow: 'hidden', alignSelf: 'stretch', marginTop: 2 },
  cta: { paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontSize: 14, fontFamily: 'Nunito_800ExtraBold' },
});
