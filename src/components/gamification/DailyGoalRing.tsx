import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Target } from 'lucide-react-native';
import { useDailyGoal } from '@/hooks/use-daily-goal';

export interface DailyGoalRingProps {
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export function DailyGoalRing({
  size = 96,
  strokeWidth = 10,
  showLabel = true,
}: DailyGoalRingProps) {
  const { data } = useDailyGoal();
  const goal = data?.target_xp ?? data?.today?.goal ?? 20;
  const earned = data?.today?.xp_earned ?? 0;
  const completed = data?.today?.completed ?? false;
  const pct = goal > 0 ? Math.min(100, Math.round((earned / goal) * 100)) : 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;
  const ringColor = completed ? '#21966A' : '#1AB3FF';

  return (
    <View
      className="relative items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="#EAF7FF"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={dashOffset}
        />
      </Svg>
      <View className="absolute items-center">
        {completed ? (
          <Text className="text-2xl">✅</Text>
        ) : (
          <Target size={20} color={ringColor} />
        )}
        {showLabel && (
          <>
            <Text className="font-nunito-extrabold text-sm text-mieo-heading">
              {earned}/{goal}
            </Text>
            <Text className="font-nunito-bold text-[10px] text-mieo-body uppercase">
              XP
            </Text>
          </>
        )}
      </View>
    </View>
  );
}
