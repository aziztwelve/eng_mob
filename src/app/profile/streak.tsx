import { twMerge } from 'tailwind-merge';
import React from 'react';
import { Alert, View, Text, ScrollView, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Snowflake } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStats } from '@/hooks/use-user-stats';
import { useUseFreeze } from '@/hooks/use-streak';
import { StreakCalendar } from '@/components/gamification';

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
    <View className="flex-1">
      <Stack.Screen options={{ title: t('profile.streak_title') }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="w-full max-w-[600px] self-center p-4 gap-4"
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
      >
        <View className="flex-row justify-between items-center">
          <Text className="text-mieo-heading text-[28px] font-nunito-black">{t('strk.title')}</Text>
          <Pressable onPress={onFreeze} disabled={!canFreeze}>
            <View className={twMerge("bg-mieo-surface border-[1.5px] border-[#C9EDFF]", "flex-row items-center gap-[8px] rounded-[18px] px-[16px] py-[10px]", (!canFreeze ? "opacity-[0.45]" : undefined))}>
              <Snowflake size={16} color="#9FE8FF" />
              <Text className="text-mieo-heading font-nunito-black text-[13px]">{t('strk.freeze', { count: stats?.streak_freezes ?? 0 })}</Text>
            </View>
          </Pressable>
        </View>

        {/* Big streak hero */}
        <View
          className="bg-mieo-surface border-[1.5px] border-[#C9EDFF] rounded-[24px] py-[28px] items-center"
        >
          <Text className="text-mieo-heading text-[52px] font-nunito-black">{stats?.current_streak ?? 0}🔥</Text>
          <Text className="text-mieo-body text-[14px] font-nunito-bold mt-[4px]">{t('strk.days_in_row')}</Text>
        </View>

        {/* Stats row */}
        <View className="bg-mieo-surface border-[1.5px] border-[#C9EDFF] rounded-[24px] p-[18px] flex-row items-center">
          <Stat label={t('strk.current')} value={stats?.current_streak ?? 0} />
          <View className="w-[1px] h-[44px] bg-[#F0F9FF]" />
          <Stat label={t('strk.record')} value={stats?.max_streak ?? 0} />
          <View className="w-[1px] h-[44px] bg-[#F0F9FF]" />
          <Stat label={t('strk.freezes')} value={stats?.streak_freezes ?? 0} />
        </View>

        {/* Calendar */}
        <View className="bg-mieo-surface border-[1.5px] border-[#C9EDFF] rounded-[24px] p-[16px]">
          <Text className="text-mieo-heading font-nunito-black text-[16px]">{t('strk.last30')}</Text>
          <View className="mt-[12px]">
            <StreakCalendar days={30} />
          </View>
          <View className="flex-row flex-wrap gap-3 mt-4">
            <Legend color="#34D399" label={t('strk.legend_done')} />
            <Legend color="#22D3EE" label={t('strk.legend_freeze')} />
            <Legend color="#E3E6E8" label={t('strk.legend_miss')} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 items-center">
      <View className="min-w-[50px] h-[50px] rounded-2xl items-center justify-center bg-mieo-sky">
        <Text className="text-mieo-heading font-nunito-black text-[20px]">{value}</Text>
      </View>
      <Text className="text-mieo-body text-[11px] font-nunito-extrabold uppercase mt-[7px] tracking-[0.5px]">{label}</Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-[6px]">
      <View className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
      <Text className="text-mieo-body text-[12px] font-nunito-bold">{label}</Text>
    </View>
  );
}
