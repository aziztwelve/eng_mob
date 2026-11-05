import { levelProgress } from '@/lib/level-progress';
import { ProfileQueryError } from '@/components/profile/profile-ui';
import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStats } from '@/hooks/use-user-stats';
import { useDailyGoal, useUpdateDailyGoal } from '@/hooks/use-daily-goal';
import { useXPHistoryInfinite, useXPDaily } from '@/hooks/use-xp-history';
import { DailyGoalRing } from '@/components/gamification';
import { tsToDate } from '@/lib/api-client';

const GOAL_PRESETS = [10, 20, 30, 50];

const REASON_KEY: Record<string, string> = {
 '1': 'xp_step', '2': 'xp_lesson', '3': 'xp_goal', '4': 'xp_achievement', '5': 'xp_streak', '6': 'xp_practice', '7': 'xp_other',
 XP_REASON_STEP_COMPLETED: 'xp_step', XP_REASON_LESSON_COMPLETED: 'xp_lesson', XP_REASON_DAILY_GOAL: 'xp_goal',
 XP_REASON_ACHIEVEMENT: 'xp_achievement', XP_REASON_STREAK_BONUS: 'xp_streak', XP_REASON_PRACTICE: 'xp_practice',
};

export default function StatsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const statsQuery = useUserStats();
  const stats = statsQuery.data;
  const goalQuery = useDailyGoal();
  const goal = goalQuery.data;
  const updateGoal = useUpdateDailyGoal();
  const xp = useXPHistoryInfinite();
  const daily = useXPDaily(14);

  const transactions = useMemo(
    () => xp.data?.pages?.flatMap((p) => p.transactions) ?? [],
    [xp.data]
  );

  const byDay = daily.data?.days ?? [];

  const maxBar = Math.max(10, ...byDay.map((d) => d.xp));

  const lvl = stats?.level ?? 1;
  const { into, span, percent: lvlPct } = levelProgress(stats ?? { level: 1, total_xp: 0, next_level_xp: 100 });

  return (
    <View className="flex-1">
      <Stack.Screen options={{ title: t('profile.stats_title') }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="w-full max-w-[600px] self-center p-4 gap-4"
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
      >
        {statsQuery.isError || goalQuery.isError ? <ProfileQueryError onRetry={() => { void statsQuery.refetch(); void goalQuery.refetch(); }} /> : statsQuery.isLoading || goalQuery.isLoading ? <ActivityIndicator color="#1AB3FF" /> : <>
        <View className="bg-mieo-surface border-[1.5px] border-[#C9EDFF] rounded-[24px] p-[16px] flex-row items-center gap-[16px]">
          <DailyGoalRing size={104} />
          <View className="flex-1 gap-[12px]">
            <Text className="text-mieo-heading font-nunito-black text-[15px]">{t('profile.daily_goal')}</Text>
            <View className="flex-row flex-wrap gap-[8px]">
              {GOAL_PRESETS.map((target) => {
                const active = goal?.target_xp === target;
                return (
                  <Pressable
                    key={target}
                    accessibilityRole="button" accessibilityState={{ selected: active, disabled: updateGoal.isPending }}
                    onPress={() => updateGoal.mutate(target)}
                    disabled={updateGoal.isPending}
                  >
                    {active ? (
                      <View
                        className="min-h-11 justify-center rounded-xl bg-mieo-sky border border-mieo-primary px-3 py-2"
                      >
                        <Text className="text-mieo-heading font-nunito-black text-[12px]">{target} XP</Text>
                      </View>
                    ) : (
                      <View className="bg-mieo-surface border-[1.5px] border-[#C9EDFF] rounded-[12px] px-[12px] py-[7px]">
                        <Text className="text-mieo-heading font-nunito-extrabold text-[12px]">{target} XP</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Level XP bar */}
            <View className="gap-[5px]">
              <View className="flex-row justify-between">
                <Text className="text-mieo-heading font-nunito-extrabold text-[12px]">{t('profile.level_label', { level: lvl })}</Text>
                <Text className="text-mieo-body font-nunito-bold text-[12px]">{into} / {span} XP</Text>
              </View>
              <View className="h-[10px] rounded-[6px] bg-[#F0F9FF] overflow-hidden">
                <View
                  className="h-full rounded-md bg-mieo-primary" style={{ width: `${lvlPct}%` }}
                />
              </View>
            </View>
          </View>
        </View>

        </>}
        {/* XP за 14 дней */}
        <View className="bg-mieo-surface border-[1.5px] border-[#C9EDFF] rounded-[24px] p-[16px] gap-[14px]">
          <Text className="text-mieo-heading font-nunito-black text-[18px]">{t('profile.xp14')}</Text>
          {daily.isError ? <ProfileQueryError onRetry={() => { void daily.refetch(); }} /> : daily.isLoading ? <ActivityIndicator color="#1AB3FF" /> : <View className="flex-row items-end justify-between gap-[4px] h-[110px]">
            {byDay.map((d) => {
              const pct = Math.max((d.xp / maxBar) * 100, 2);
              const day = Number(d.date.slice(-2));
              return (
                <View key={d.date} className="flex-1 items-center h-[100%] justify-end">
                  <View className="w-[100%] h-[90px] justify-end">
                    {d.xp === 0 ? (
                      <View className="w-full rounded-md min-h-[3px] bg-mieo-sky" style={{ height: `${pct}%` }} />
                    ) : (
                      <View
                        className="w-full rounded-md min-h-[3px] bg-mieo-primary" style={{ height: `${pct}%` }}
                      />
                    )}
                  </View>
                  <Text className="text-mieo-body text-[10px] font-nunito-extrabold mt-[4px]">{day}</Text>
                </View>
              );
            })}
          </View>}
          <View className="flex-row justify-between flex-wrap gap-2">
            <Text className="text-mieo-body text-[12px] font-nunito-bold">{t('profile.total_xp')}: {statsQuery.isError ? '—' : stats?.total_xp ?? '…'} XP</Text>
            <Text className="text-mieo-body text-[12px] font-nunito-bold">{t('profile.weekly_xp')}: {statsQuery.isError ? '—' : stats?.weekly_xp ?? '…'} XP</Text>
          </View>
        </View>

        {/* XP история */}
        <View className="bg-mieo-surface border-[1.5px] border-[#C9EDFF] rounded-[24px] p-[16px] gap-[8px]">
          <Text className="text-mieo-heading font-nunito-black text-[18px] mb-[4px]">{t('profile.xp_history')}</Text>
          {xp.isError ? <ProfileQueryError onRetry={() => { void xp.refetch(); }} /> : xp.isLoading ? <ActivityIndicator color="#1AB3FF" /> : transactions.length === 0 ? (
            <Text className="text-mieo-body font-nunito-semibold">{t('profile.no_tx')}</Text>
          ) : (
            transactions.map((tx) => {
              const d = tsToDate(tx.created_at);
              return (
                <View key={tx.id} className="flex-row items-center justify-between py-[9px] border-b-[1px] border-b-[#E3E6E8]">
                  <Text className="text-mieo-heading font-nunito-extrabold text-[14px]">⚡ {t(`profile.${REASON_KEY[String(tx.reason)] ?? 'xp_other'}`)}</Text>
                  <View className="flex-row items-center gap-[12px]">
                    <Text className="text-mieo-body text-[12px]">{d ? d.toLocaleDateString() : '—'}</Text>
                    <Text className="text-mieo-heading font-nunito-black text-[14px]">+{tx.amount}</Text>
                  </View>
                </View>
              );
            })
          )}

          {xp.hasNextPage && (
            <Pressable
              onPress={() => xp.fetchNextPage()}
              disabled={xp.isFetchingNextPage}
              className="bg-mieo-surface border-[1.5px] border-[#C9EDFF] rounded-[14px] py-[13px] items-center mt-[8px]"
            >
              {xp.isFetchingNextPage ? (
                <ActivityIndicator color="#1AB3FF" />
              ) : (
                <Text className="text-mieo-heading font-nunito-extrabold text-[14px]">{t('profile.load_more')}</Text>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
