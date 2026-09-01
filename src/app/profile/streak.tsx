import React from 'react';
import { Alert, View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Snowflake } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStats } from '@/hooks/use-user-stats';
import { useUseFreeze } from '@/hooks/use-streak';
import { StreakCalendar } from '@/components/gamification';
import { glass, GOLD } from '@/components/sunset';

export default function StreakScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: stats } = useUserStats();
  const useFreeze = useUseFreeze();

  const canFreeze = !!stats && stats.streak_freezes > 0 && !useFreeze.isPending;

  const onFreeze = () => {
    Alert.alert(
      t('strk.freeze_title'),
      t('strk.freeze_q'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('strk.activate'), onPress: () => useFreeze.mutate() },
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: t('profile.streak_title') }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 + insets.bottom }}
      >
        <View style={s.headerRow}>
          <Text style={s.title}>{t('strk.title')}</Text>
          <Pressable onPress={onFreeze} disabled={!canFreeze}>
            <View style={[glass, s.freezeBtn, !canFreeze && { opacity: 0.45 }]}>
              <Snowflake size={16} color="#9FE8FF" />
              <Text style={s.freezeText}>{t('strk.freeze', { count: stats?.streak_freezes ?? 0 })}</Text>
            </View>
          </Pressable>
        </View>

        {/* Big streak hero */}
        <LinearGradient
          colors={['rgba(255,223,94,0.22)', 'rgba(255,179,56,0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[glass, s.hero]}
        >
          <Text style={s.heroNum}>{stats?.current_streak ?? 0}🔥</Text>
          <Text style={s.heroLabel}>{t('strk.days_in_row')}</Text>
        </LinearGradient>

        {/* Stats row */}
        <View style={[glass, s.statsCard]}>
          <Stat label={t('strk.current')} value={stats?.current_streak ?? 0} />
          <View style={s.divider} />
          <Stat label={t('strk.record')} value={stats?.max_streak ?? 0} />
          <View style={s.divider} />
          <Stat label={t('strk.freezes')} value={stats?.streak_freezes ?? 0} />
        </View>

        {/* Calendar */}
        <View style={[glass, s.card]}>
          <Text style={s.cardTitle}>{t('strk.last30')}</Text>
          <View style={{ marginTop: 12 }}>
            <StreakCalendar days={30} />
          </View>
          <View style={s.legendRow}>
            <Legend color="#34D399" label={t('strk.legend_done')} />
            <Legend color="#22D3EE" label={t('strk.legend_freeze')} />
            <Legend color="rgba(255,255,255,0.18)" label={t('strk.legend_miss')} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.statBadge}>
        <Text style={s.statValue}>{value}</Text>
      </LinearGradient>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={s.legend}>
      <View style={[s.legendDot, { backgroundColor: color }]} />
      <Text style={s.legendText}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontSize: 28, fontWeight: '900' },
  freezeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10 },
  freezeText: { color: '#fff', fontWeight: '900', fontSize: 13 },

  hero: { borderRadius: 24, paddingVertical: 28, alignItems: 'center' },
  heroNum: { color: '#fff', fontSize: 52, fontWeight: '900' },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '700', marginTop: 4 },

  statsCard: { borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center' },
  divider: { width: 1, height: 44, backgroundColor: 'rgba(255,255,255,0.15)' },
  statBadge: { minWidth: 50, paddingHorizontal: 12, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statValue: { color: '#5a3b00', fontWeight: '900', fontSize: 20 },
  statLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginTop: 7, letterSpacing: 0.5 },

  card: { borderRadius: 24, padding: 16 },
  cardTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 14 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 4 },
  legendText: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '700' },
});
