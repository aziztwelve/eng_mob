import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Home } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const CTA = ['#A8243F', '#CC5A1F'] as const;
const glass = {
  backgroundColor: 'rgba(255,255,255,0.14)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.22)',
} as const;

export default function FlashcardResultsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ total: string; remembered: string }>();
  const total = parseInt(params.total || '0', 10);
  const remembered = parseInt(params.remembered || '0', 10);
  const percentage = total > 0 ? Math.round((remembered / total) * 100) : 0;
  const isGood = percentage >= 70;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={st.root}>
        <Text style={{ fontSize: 72 }}>🏆</Text>
        <Text style={st.title}>{isGood ? t('fc.great') : t('fc.good_start')}</Text>

        <View style={[st.card, { width: '100%', padding: 22, gap: 14 }]}>
          <Row label={t('fc.reviewed')} value={`${total}`} color="#fff" />
          <Row label={t('cards.remember')} value={`${remembered}`} color="#FFD84A" />
          <Row label={t('cards.forgot')} value={`${Math.max(0, total - remembered)}`} color="#FF6E8A" />
          <View style={st.divider} />
          <Row label={t('fc.success_rate')} value={`${percentage}%`} color={isGood ? '#2EECC8' : '#FFB338'} big />
        </View>

        <Text style={st.msg}>
          {isGood ? t('fc.msg_good') : t('fc.msg_ok')}
        </Text>

        <View style={{ width: '100%', gap: 12 }}>
          <Pressable onPress={() => router.replace('/flashcards' as any)} style={st.ctaWrap}>
            <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.cta}>
              <Text style={st.ctaText}>{t('fc.to_flashcards')}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => router.replace('/(tabs)')} style={[st.card, st.homeBtn]}>
            <Home size={20} color="#fff" />
            <Text style={st.homeText}>{t('fc.to_home')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Row({ label, value, color, big }: { label: string; value: string; color: string; big?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: big ? 17 : 15 }}>{label}</Text>
      <Text style={{ color, fontWeight: '900', fontSize: big ? 30 : 22 }}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22, gap: 18 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  card: { ...glass, borderRadius: 22 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.18)' },
  msg: { color: 'rgba(255,255,255,0.82)', textAlign: 'center', fontSize: 14, lineHeight: 20 },
  ctaWrap: { borderRadius: 16, overflow: 'hidden' },
  cta: { paddingVertical: 16, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  homeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 16 },
  homeText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
