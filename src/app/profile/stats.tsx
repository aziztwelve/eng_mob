import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStats } from '@/hooks/use-user-stats';
import { useDailyGoal, useUpdateDailyGoal } from '@/hooks/use-daily-goal';
import { useXPHistoryInfinite } from '@/hooks/use-xp-history';
import { DailyGoalRing } from '@/components/gamification';
import { tsToDate } from '@/lib/api-client';
import { glass, GOLD, FILL } from '@/components/sunset';
import type { XPTransaction } from '@/types/api';

const GOAL_PRESETS = [10, 20, 30, 50];

const REASON_NUMERIC: Record<number, string> = {
  1: 'Step',
  2: 'Lesson',
  3: 'Daily goal',
  4: 'Achievement',
  5: 'Streak bonus',
  6: 'Practice',
};

const REASON_LABEL: Record<string, string> = {
  XP_REASON_STEP_COMPLETED: 'Step',
  XP_REASON_LESSON_COMPLETED: 'Lesson',
  XP_REASON_DAILY_GOAL: 'Daily goal',
  XP_REASON_ACHIEVEMENT: 'Achievement',
  XP_REASON_STREAK_BONUS: 'Streak bonus',
  XP_REASON_PRACTICE: 'Practice',
};

function reasonLabel(r: XPTransaction['reason']): string {
  if (typeof r === 'number') return REASON_NUMERIC[r] ?? '—';
  return REASON_LABEL[r] ?? '—';
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { data: stats } = useUserStats();
  const { data: goal } = useDailyGoal();
  const updateGoal = useUpdateDailyGoal();
  const xp = useXPHistoryInfinite();

  const transactions = useMemo(
    () => xp.data?.pages?.flatMap((p) => p.transactions) ?? [],
    [xp.data]
  );

  const byDay = useMemo(() => {
    const m = new Map<string, number>();
    transactions.forEach((tx) => {
      const d = tsToDate(tx.created_at);
      if (!d) return;
      const iso = d.toISOString().slice(0, 10);
      m.set(iso, (m.get(iso) ?? 0) + tx.amount);
    });
    const out: Array<{ date: string; xp: number }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      out.push({ date: iso, xp: m.get(iso) ?? 0 });
    }
    return out;
  }, [transactions]);

  const maxBar = Math.max(10, ...byDay.map((d) => d.xp));

  // Level progress (как в XPBar, но в candy-стиле).
  const lvl = stats?.level ?? 1;
  const currentThreshold = (100 * lvl * (lvl - 1)) / 2;
  const span = Math.max(1, (stats?.next_level_xp ?? 0) - currentThreshold);
  const into = Math.max(0, (stats?.total_xp ?? 0) - currentThreshold);
  const lvlPct = Math.min(100, Math.round((into / span) * 100));

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Статистика' }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 + insets.bottom }}
      >
        {/* Дневная цель */}
        <View style={[glass, s.card, { flexDirection: 'row', alignItems: 'center', gap: 16 }]}>
          <DailyGoalRing size={104} />
          <View style={{ flex: 1, gap: 12 }}>
            <Text style={s.cardTitle}>Дневная цель</Text>
            <View style={s.presetRow}>
              {GOAL_PRESETS.map((target) => {
                const active = goal?.target_xp === target;
                return (
                  <Pressable
                    key={target}
                    onPress={() => updateGoal.mutate(target)}
                    disabled={updateGoal.isPending}
                  >
                    {active ? (
                      <LinearGradient
                        colors={GOLD}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={s.preset}
                      >
                        <Text style={s.presetTextActive}>{target} XP</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[glass, s.preset]}>
                        <Text style={s.presetText}>{target} XP</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Level XP bar */}
            <View style={{ gap: 5 }}>
              <View style={s.lvlRow}>
                <Text style={s.lvlText}>Lv {lvl}</Text>
                <Text style={s.lvlSub}>{into} / {span} XP</Text>
              </View>
              <View style={s.lvlTrack}>
                <LinearGradient
                  colors={GOLD}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[s.lvlFill, { width: `${lvlPct}%` }]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* XP за 14 дней */}
        <View style={[glass, s.card, { gap: 14 }]}>
          <Text style={s.cardTitleLg}>XP за 14 дней</Text>
          <View style={s.chartRow}>
            {byDay.map((d) => {
              const pct = Math.max((d.xp / maxBar) * 100, 2);
              const day = new Date(d.date).getDate();
              return (
                <View key={d.date} style={s.barCol}>
                  <View style={s.barTrack}>
                    {d.xp === 0 ? (
                      <View style={[s.barEmpty, { height: `${pct}%` }]} />
                    ) : (
                      <LinearGradient
                        colors={FILL}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={[s.bar, { height: `${pct}%` }]}
                      />
                    )}
                  </View>
                  <Text style={s.barDay}>{day}</Text>
                </View>
              );
            })}
          </View>
          <View style={s.totalsRow}>
            <Text style={s.totalText}>Total: {stats?.total_xp ?? 0} XP</Text>
            <Text style={s.totalText}>Weekly: {stats?.weekly_xp ?? 0} XP</Text>
          </View>
        </View>

        {/* XP история */}
        <View style={[glass, s.card, { gap: 8 }]}>
          <Text style={[s.cardTitleLg, { marginBottom: 4 }]}>XP история</Text>
          {transactions.length === 0 && !xp.isLoading ? (
            <Text style={s.empty}>Пока нет транзакций.</Text>
          ) : (
            transactions.map((tx) => {
              const d = tsToDate(tx.created_at);
              return (
                <View key={tx.id} style={s.txRow}>
                  <Text style={s.txLabel}>⚡ {reasonLabel(tx.reason)}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={s.txDate}>{d ? d.toLocaleDateString() : '—'}</Text>
                    <Text style={s.txAmount}>+{tx.amount}</Text>
                  </View>
                </View>
              );
            })
          )}

          {xp.hasNextPage && (
            <Pressable
              onPress={() => xp.fetchNextPage()}
              disabled={xp.isFetchingNextPage}
              style={[glass, s.loadMore]}
            >
              {xp.isFetchingNextPage ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.loadMoreText}>Загрузить ещё</Text>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 24, padding: 16 },
  cardTitle: { color: '#fff', fontWeight: '900', fontSize: 15 },
  cardTitleLg: { color: '#fff', fontWeight: '900', fontSize: 18 },

  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  presetText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  presetTextActive: { color: '#5a3b00', fontWeight: '900', fontSize: 12 },

  lvlRow: { flexDirection: 'row', justifyContent: 'space-between' },
  lvlText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  lvlSub: { color: 'rgba(255,255,255,0.75)', fontWeight: '700', fontSize: 12 },
  lvlTrack: { height: 10, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  lvlFill: { height: '100%', borderRadius: 6 },

  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4, height: 110 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barTrack: { width: '100%', height: 90, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 5, minHeight: 3 },
  barEmpty: { width: '100%', borderRadius: 5, minHeight: 3, backgroundColor: 'rgba(255,255,255,0.16)' },
  barDay: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', marginTop: 4 },

  totalsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' },

  empty: { color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  txRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  txLabel: { color: '#fff', fontWeight: '800', fontSize: 14 },
  txDate: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  txAmount: { color: '#FFD84A', fontWeight: '900', fontSize: 14 },

  loadMore: { borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginTop: 8 },
  loadMoreText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
