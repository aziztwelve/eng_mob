import React from 'react';
import { View, Text } from 'react-native';
import { Star } from 'lucide-react-native';
import { useUserStats } from '@/hooks/use-user-stats';

export interface LevelBadgeProps {
  level?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function LevelBadge({ level, size = 'md' }: LevelBadgeProps) {
  const { data } = useUserStats();
  const lvl = level ?? data?.level ?? 1;
  const padding = size === 'sm' ? 'px-2 py-1' : size === 'lg' ? 'px-4 py-2' : 'px-3 py-1.5';
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;
  const text = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full border-2 border-amber-400 bg-amber-100 ${padding}`}
    >
      <Star size={iconSize} color="#b45309" fill="#b45309" />
      <Text className={`text-amber-700 font-black uppercase ${text}`}>Lv {lvl}</Text>
    </View>
  );
}
