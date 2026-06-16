import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Target } from 'lucide-react-native';
import { useDailyGoal } from '@/hooks/use-daily-goal';
import { neon } from '@/components/neon-screen';

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
  const ringColor = completed ? neon.primary : neon.xp;

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
          stroke="rgba(255,255,255,0.08)"
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
            <Text style={{ color: neon.xp, fontWeight: '900', fontSize: 14 }}>
              {earned}/{goal}
            </Text>
            <Text style={{ color: neon.muted, fontWeight: '800', fontSize: 10, textTransform: 'uppercase' }}>
              XP
            </Text>
          </>
        )}
      </View>
    </View>
  );
}
