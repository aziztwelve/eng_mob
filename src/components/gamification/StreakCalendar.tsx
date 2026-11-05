import { calendarDates, localCalendarToday } from '@/lib/calendar-dates';
import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Snowflake } from 'lucide-react-native';
import { useStreakHistory } from '@/hooks/use-streak';
import { ProfileQueryError } from '@/components/profile/profile-ui';
import type { StreakDay } from '@/types/api';

export interface StreakCalendarProps {
  days?: number;
}

export function StreakCalendar({ days = 30 }: StreakCalendarProps) {
  const { data, isLoading, isError, refetch } = useStreakHistory(days);

  const map = useMemo(() => {
    const m = new Map<string, StreakDay>();
    data?.days?.forEach((d) => m.set(d.date, d));
    return m;
  }, [data]);

  const today = data?.today ?? localCalendarToday();
  const dates = useMemo(() => calendarDates(today, days), [today, days]);

  if (isError) return <ProfileQueryError onRetry={() => { void refetch(); }} />;

  if (isLoading) {
    return (
      <View className="items-center py-6">
        <ActivityIndicator color="#22c55e" />
      </View>
    );
  }


  return (
    <View className="flex-row flex-wrap gap-1.5">
      {dates.map((iso) => {
        const day = map.get(iso);
        const dayNum = Number(iso.slice(-2));
        const isToday = iso === today;

        let bg = 'bg-[#F0F8FC]';
        let fg = 'text-mieo-body';
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
            className={`w-[12%] h-9 rounded-lg border-2 items-center justify-center ${bg} ${isToday ? 'border-amber-300' : 'border-mieo-stroke'}`}
          >
            {day?.used_freeze ? (
              <Snowflake size={12} color="#ffffff" />
            ) : (
              <Text className={`text-xs font-nunito-black tabular-nums ${fg}`}>{dayNum}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}
