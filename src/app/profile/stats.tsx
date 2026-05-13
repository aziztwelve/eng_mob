import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useUserStats } from '@/hooks/use-user-stats';
import { useDailyGoal, useUpdateDailyGoal } from '@/hooks/use-daily-goal';
import { useXPHistoryInfinite } from '@/hooks/use-xp-history';
import { DailyGoalRing, XPBar } from '@/components/gamification';
import { tsToDate } from '@/lib/api-client';
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

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Статистика' }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="bg-card rounded-3xl border-4 border-border p-4 flex-row items-center gap-4">
          <DailyGoalRing size={100} />
          <View className="flex-1 gap-3">
            <Text className="text-foreground font-black text-base">Дневная цель</Text>
            <View className="flex-row flex-wrap gap-2">
              {GOAL_PRESETS.map((target) => {
                const active = goal?.target_xp === target;
                return (
                  <Pressable
                    key={target}
                    onPress={() => updateGoal.mutate(target)}
                    disabled={updateGoal.isPending}
                    className={`rounded-xl px-3 py-2 border-2 ${active ? 'bg-primary border-primary' : 'bg-card border-border'}`}
                  >
                    <Text
                      className={`font-bold text-xs ${active ? 'text-primary-foreground' : 'text-foreground'}`}
                    >
                      {target} XP
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <XPBar />
          </View>
        </View>

        <View className="bg-card rounded-3xl border-4 border-border p-4 gap-3">
          <Text className="text-foreground font-black text-lg">XP за 14 дней</Text>
          <View className="flex-row items-end justify-between gap-1" style={{ height: 100 }}>
            {byDay.map((d) => {
              const pct = (d.xp / maxBar) * 100;
              const day = new Date(d.date).getDate();
              return (
                <View key={d.date} className="flex-1 items-center">
                  <View
                    className={`w-full rounded-t-md ${d.xp === 0 ? 'bg-muted' : 'bg-amber-400'}`}
                    style={{ height: `${Math.max(pct, 1)}%` }}
                  />
                  <Text className="text-muted-foreground text-[10px] font-bold mt-0.5 tabular-nums">
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground text-xs font-medium">
              Total: {stats?.total_xp ?? 0} XP
            </Text>
            <Text className="text-muted-foreground text-xs font-medium">
              Weekly: {stats?.weekly_xp ?? 0} XP
            </Text>
          </View>
        </View>

        <View className="bg-card rounded-3xl border-4 border-border p-4 gap-3">
          <Text className="text-foreground font-black text-lg">XP история</Text>
          {transactions.length === 0 && !xp.isLoading ? (
            <Text className="text-muted-foreground font-medium">
              Пока нет транзакций.
            </Text>
          ) : (
            transactions.map((tx) => {
              const d = tsToDate(tx.created_at);
              return (
                <View
                  key={tx.id}
                  className="flex-row items-center justify-between py-2 border-b border-border/40"
                >
                  <Text className="text-foreground font-bold">⚡ {reasonLabel(tx.reason)}</Text>
                  <View className="flex-row gap-3">
                    <Text className="text-muted-foreground text-xs tabular-nums">
                      {d ? d.toLocaleDateString() : '—'}
                    </Text>
                    <Text className="text-amber-600 font-black tabular-nums">
                      +{tx.amount}
                    </Text>
                  </View>
                </View>
              );
            })
          )}

          {xp.hasNextPage && (
            <Pressable
              onPress={() => xp.fetchNextPage()}
              disabled={xp.isFetchingNextPage}
              className="bg-muted rounded-xl py-3 items-center"
            >
              {xp.isFetchingNextPage ? (
                <ActivityIndicator color="#22c55e" />
              ) : (
                <Text className="text-foreground font-bold">Загрузить ещё</Text>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
