import React from 'react';
import { View, Text } from 'react-native';
import { useUserStats } from '@/hooks/use-user-stats';
import type { UserStats } from '@/types/api';

export interface XPBarProps {
  stats?: Pick<UserStats, 'level' | 'total_xp' | 'next_level_xp'>;
  showLabels?: boolean;
}

export function XPBar({ stats, showLabels = true }: XPBarProps) {
  const { data } = useUserStats();
  const s = stats ?? data;
  if (!s) return <View className="h-2 bg-muted rounded-full" />;

  const currentThreshold = (100 * s.level * (s.level - 1)) / 2;
  const span = Math.max(1, s.next_level_xp - currentThreshold);
  const into = Math.max(0, s.total_xp - currentThreshold);
  const pct = Math.min(100, Math.round((into / span) * 100));

  return (
    <View className="flex-col gap-1">
      {showLabels && (
        <View className="flex-row justify-between">
          <Text className="text-foreground font-bold text-xs">Lv {s.level}</Text>
          <Text className="text-muted-foreground font-bold text-xs">
            {into} / {span} XP
          </Text>
        </View>
      )}
      <View className="h-2.5 w-full rounded-full bg-muted overflow-hidden border border-border/40">
        <View
          className="h-full bg-amber-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}
