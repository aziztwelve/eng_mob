import React from 'react';
import { View, Text } from 'react-native';
import { Flame } from 'lucide-react-native';
import { useUserStats } from '@/hooks/use-user-stats';

export interface StreakBadgeProps {
  size?: 'sm' | 'md' | 'lg';
}

export function StreakBadge({ size = 'md' }: StreakBadgeProps) {
  const { data } = useUserStats();
  const streak = data?.current_streak ?? 0;
  const active = streak > 0;
  const color = active ? '#f97316' : '#9ca3af';
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;

  return (
    <View className="flex-row items-center gap-1.5">
      <Flame size={iconSize} color={color} fill={active ? color : 'transparent'} />
      <Text
        className={`font-bold ${active ? 'text-orange-500' : 'text-muted-foreground'} ${size === 'lg' ? 'text-lg' : ''}`}
      >
        {streak}
      </Text>
    </View>
  );
}
