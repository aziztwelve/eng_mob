import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Snowflake } from 'lucide-react-native';
import { useStreakHistory } from '@/hooks/use-streak';
import type { StreakDay } from '@/types/api';

export interface StreakCalendarProps {
  days?: number;
}

export function StreakCalendar({ days = 30 }: StreakCalendarProps) {
  const { data, isLoading } = useStreakHistory(days);

  const map = useMemo(() => {
    const m = new Map<string, StreakDay>();
    data?.days?.forEach((d) => m.set(d.date, d));
    return m;
  }, [data]);

  const dates = useMemo(() => {
    const out: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }, [days]);

  if (isLoading) {
    return (
      <View className="items-center py-6">
        <ActivityIndicator color="#22c55e" />
      </View>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <View className="flex-row flex-wrap gap-1.5">
      {dates.map((iso) => {
        const day = map.get(iso);
        const dayNum = new Date(iso).getDate();
        const isToday = iso === today;

        let bg = 'bg-muted';
        let fg = 'text-muted-foreground';
        if (day?.completed) {
          if (day.used_freeze) {
            bg = 'bg-cyan-500';
            fg = 'text-white';
          } else {
            bg = 'bg-emerald-500';
            fg = 'text-white';
          }
        }

        return (
          <View
            key={iso}
            className={`w-[12%] aspect-square rounded-lg border-2 items-center justify-center ${bg} ${isToday ? 'border-primary' : 'border-border/40'}`}
          >
            {day?.used_freeze ? (
              <Snowflake size={12} color="#ffffff" />
            ) : (
              <Text className={`text-xs font-black tabular-nums ${fg}`}>{dayNum}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}
