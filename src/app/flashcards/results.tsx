import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Trophy } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const CTA = ['#59C8FF', '#2FA8E6'] as const;
const glass = {
  backgroundColor: '#FFFFFF',
  borderWidth: 1.5,
  borderBottomWidth: 4,
  borderColor: '#C9EDFF',
} as const;

export default function FlashcardResultsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ total: string; remembered: string }>();
  const total = parseInt(params.total || '0', 10);
  const remembered = parseInt(params.remembered || '0', 10);
  const percentage = total > 0 ? Math.round((remembered / total) * 100) : 0;
  const isGood = percentage >= 70;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={[st.root, { paddingTop: insets.top + 24 }]}>
        <View className="rounded-3xl bg-[#EAF8FF] p-6"><Trophy size={64} color="#2FA8E6" /></View>
        <Text style={st.title}>{isGood ? t('fc.great') : t('fc.good_start')}</Text>

        <View style={[st.card, { width: '100%', padding: 22, gap: 14 }]}>
          <Row label={t('fc.reviewed')} value={`${total}`} color="#171A1C" />
          <Row label={t('cards.remember')} value={`${remembered}`} color="#2FA8E6" />
          <Row label={t('cards.forgot')} value={`${Math.max(0, total - remembered)}`} color="#B4232A" />
          <View style={st.divider} />
          <Row label={t('fc.success_rate')} value={`${percentage}%`} color={isGood ? '#239A42' : '#FFB338'} big />
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
            <Home size={20} color="#171A1C" />
            <Text style={st.homeText}>{t('fc.to_home')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, color, big }: { label: string; value: string; color: string; big?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ color: '#5D686F', fontFamily: 'Nunito_700Bold', fontSize: big ? 17 : 15 }}>{label}</Text>
      <Text style={{ color, fontFamily: 'Nunito_900Black', fontSize: big ? 30 : 22 }}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 22, gap: 18 },
  title: { color: '#171A1C', fontSize: 28, fontFamily: 'Nunito_900Black', textAlign: 'center' },
  card: { ...glass, borderRadius: 22 },
  divider: { height: 1, backgroundColor: '#C9EDFF' },
  msg: { color: '#5D686F', textAlign: 'center', fontSize: 14, lineHeight: 20 },
  ctaWrap: { borderRadius: 16, overflow: 'hidden' },
  cta: { paddingVertical: 16, alignItems: 'center' },
  ctaText: { color: '#FFFFFF', fontFamily: 'Nunito_900Black', fontSize: 16 },
  homeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 16 },
  homeText: { color: '#171A1C', fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
});
