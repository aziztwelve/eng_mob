import React from 'react';
import { View } from 'react-native';
import { HeartCounter } from './HeartCounter';
import { StreakBadge } from './StreakBadge';
import { LevelBadge } from './LevelBadge';
import { useIsAuthenticated } from '@/hooks/use-auth';

export interface GamificationTopbarProps {
  /** Когда compact=true: только StreakBadge + HeartCounter (для мобильной шапки таб-бара). */
  compact?: boolean;
}

export function GamificationTopbar({ compact = false }: GamificationTopbarProps) {
  const { isAuthenticated } = useIsAuthenticated();
  if (!isAuthenticated) return null;

  return (
    <View
      className={`flex-row items-center justify-between bg-card border-b-4 border-border px-4 ${compact ? 'py-2' : 'py-3'}`}
    >
      <View className="flex-row items-center gap-3">
        <StreakBadge size={compact ? 'sm' : 'md'} />
        <HeartCounter size={compact ? 'sm' : 'md'} showTimer={!compact} />
      </View>
      {!compact && <LevelBadge size="sm" />}
    </View>
  );
}
