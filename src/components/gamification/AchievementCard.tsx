import React from 'react';
import { View, Text, Image } from 'react-native';
import { Award, Lock } from 'lucide-react-native';
import type { Achievement, UserAchievement } from '@/types/api';
import { tsToDate } from '@/lib/api-client';

const TIER_LABEL: Record<number, string> = { 1: 'bronze', 2: 'silver', 3: 'gold' };

const TIER_BG: Record<number, string> = {
  1: 'bg-amber-50 border-amber-700/60',
  2: 'bg-slate-50 border-slate-400/60',
  3: 'bg-yellow-50 border-yellow-400/60',
};

export interface AchievementCardProps {
  achievement: Achievement;
  user?: UserAchievement | null;
}

export function AchievementCard({ achievement: a, user }: AchievementCardProps) {
  const unlocked = !!user;
  const unlockedAt = user ? tsToDate(user.unlocked_at) : null;
  const tone = unlocked ? TIER_BG[a.tier] ?? TIER_BG[1] : 'bg-muted/30 border-border/60 opacity-70';

  return (
    <View className={`flex-1 rounded-3xl border-4 p-4 items-center ${tone}`}>
      <View
        className={`h-16 w-16 rounded-2xl border-4 items-center justify-center mb-2 ${unlocked ? 'bg-background' : 'bg-muted'}`}
      >
        {unlocked && a.icon_url ? (
          <Image source={{ uri: a.icon_url }} style={{ width: 44, height: 44 }} resizeMode="contain" />
        ) : unlocked ? (
          <Award size={32} color="#b45309" />
        ) : (
          <Lock size={26} color="#9ca3af" />
        )}
      </View>
      <Text
        className={`text-sm font-black text-center ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}
        numberOfLines={2}
      >
        {a.title}
      </Text>
      <Text className="text-xs font-medium text-muted-foreground text-center mt-1" numberOfLines={2}>
        {a.description}
      </Text>
      <View className="flex-row flex-wrap justify-center gap-1 mt-2">
        <View className="rounded-full border-2 border-border px-2 py-0.5">
          <Text className="text-[10px] font-bold uppercase">{TIER_LABEL[a.tier] ?? 'tier'}</Text>
        </View>
        <View className="rounded-full border-2 border-border px-2 py-0.5">
          <Text className="text-[10px] font-bold uppercase">{a.category}</Text>
        </View>
        {a.xp_reward > 0 && (
          <View className="rounded-full border-2 border-border px-2 py-0.5">
            <Text className="text-[10px] font-bold">+{a.xp_reward} XP</Text>
          </View>
        )}
      </View>
      {unlockedAt && (
        <Text className="text-[10px] text-muted-foreground font-medium mt-1">
          {unlockedAt.toLocaleDateString()}
        </Text>
      )}
    </View>
  );
}
