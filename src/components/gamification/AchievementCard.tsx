import { twMerge } from 'tailwind-merge';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { achievementText } from '@/lib/achievement-text';
import { View, Text, Image } from 'react-native';
import { Award, Lock } from 'lucide-react-native';
import type { Achievement, UserAchievement } from '@/types/api';
import { tsToDate } from '@/lib/api-client';

const TIER_LABEL: Record<number, string> = { 1: 'bronze', 2: 'silver', 3: 'gold' };

export interface AchievementCardProps {
  achievement: Achievement;
  user?: UserAchievement | null;
}

export function AchievementCard({ achievement: a, user }: AchievementCardProps) {
  const { t, i18n } = useTranslation();
  const text = achievementText(a, t);
  const unlocked = !!user;
  const unlockedAt = user ? tsToDate(user.unlocked_at) : null;

  return (
    <View className={twMerge("bg-mieo-surface border-[1.5px] border-[#C9EDFF]", "flex-1 rounded-[22px] p-[14px] items-center", (!unlocked ? "bg-[#F5FCFF]" : undefined))}>
      {unlocked ? (
        <View className="h-[60px] w-[60px] mb-3 rounded-2xl items-center justify-center bg-mieo-sky">
          {a.icon_url ? (
            <Image source={{ uri: a.icon_url }} className="w-[40px] h-[40px]" resizeMode="contain" />
          ) : (
            <Award size={30} color="#171A1C" />
          )}
        </View>
      ) : (
        <View className="h-[60px] w-[60px] rounded-[18px] items-center justify-center mb-[10px] bg-[#F0F9FF]">
          <Lock size={24} color="#5D686F" />
        </View>
      )}

      <Text className="text-mieo-heading text-[14px] font-nunito-black text-center">{text.title}</Text>
      <Text className="text-mieo-body text-[11px] font-nunito-medium text-center mt-[4px] leading-[15px]">{text.description}</Text>

      <View className="flex-row flex-wrap justify-center gap-[5px] mt-[8px]">
        <View className="rounded-[999px] bg-[#F0F9FF] border-[1px] border-mieo-stroke px-[8px] py-[2px]">
          <Text className="text-mieo-body text-[10px] font-nunito-extrabold uppercase">{t(`ach.tier_${TIER_LABEL[a.tier]}`, { defaultValue: TIER_LABEL[a.tier] ?? '—' })}</Text>
        </View>
        <View className="rounded-[999px] bg-[#F0F9FF] border-[1px] border-mieo-stroke px-[8px] py-[2px]">
          <Text className="text-mieo-body text-[10px] font-nunito-extrabold uppercase">{a.category === 'xp' ? 'XP' : t(`ach.cat_${a.category}`, { defaultValue: a.category })}</Text>
        </View>
        {a.xp_reward > 0 && (
          <View className="rounded-[999px] border-[1px] px-[8px] py-[2px] bg-[rgba(255,216,74,0.22)] border-[rgba(255,216,74,0.5)]">
            <Text className="text-mieo-heading text-[10px] font-nunito-black">+{a.xp_reward} XP</Text>
          </View>
        )}
      </View>

      {unlockedAt && (
        <Text className="text-mieo-body text-[10px] font-nunito-semibold mt-[6px]">{unlockedAt.toLocaleDateString(i18n.language)}</Text>
      )}
    </View>
  );
}
