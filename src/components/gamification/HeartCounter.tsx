import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Heart } from 'lucide-react-native';
import { tsToDate } from '@/lib/api-client';
import { useHearts } from '@/hooks/use-hearts';

function formatRemaining(ms: number) {
  if (ms <= 0) return '0:00';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export interface HeartCounterProps {
  size?: 'sm' | 'md';
  showTimer?: boolean;
}

export function HeartCounter({ size = 'md', showTimer = true }: HeartCounterProps) {
  const { data } = useHearts();
  const nextAt = tsToDate(data?.next_heart_at);
  const isMax = data ? data.hearts >= data.max_hearts : true;
  const showCountdown = showTimer && !!data && !isMax && nextAt !== null;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!showCountdown) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [showCountdown]);

  const remaining = showCountdown && nextAt ? Math.max(0, nextAt.getTime() - now) : 0;
  const iconSize = size === 'sm' ? 16 : 20;

  if (!data) {
    return (
      <View className="flex-row items-center gap-1.5">
        <Heart size={iconSize} color="#9ca3af" />
        <Text className="text-muted-foreground font-bold">—</Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-1.5">
      <Heart size={iconSize} color="#ef4444" fill="#ef4444" />
      <Text className="text-red-500 font-bold">
        {data.unlimited ? '∞' : `${data.hearts}/${data.max_hearts}`}
      </Text>
      {showCountdown && remaining > 0 && (
        <Text className="text-muted-foreground text-xs font-medium">
          {formatRemaining(remaining)}
        </Text>
      )}
    </View>
  );
}
