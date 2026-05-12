import React from 'react';
import { View, Text } from 'react-native';

export type LessonContext = 'course' | 'track' | 'standalone';

const STYLES: Record<LessonContext, { label: string; emoji: string; bg: string; textColor: string }> = {
  course: {
    label: 'Course',
    emoji: '🎓',
    bg: 'bg-emerald-500/20 border-emerald-500/40',
    textColor: 'text-emerald-300',
  },
  track: {
    label: 'Track',
    emoji: '🧭',
    bg: 'bg-blue-500/20 border-blue-500/40',
    textColor: 'text-blue-300',
  },
  standalone: {
    label: 'Standalone',
    emoji: '✨',
    bg: 'bg-orange-500/20 border-orange-500/40',
    textColor: 'text-orange-300',
  },
};

export function LessonTypeBadge({ context }: { context: LessonContext }) {
  const s = STYLES[context];
  return (
    <View className={`flex-row items-center px-3 py-1 rounded-full border-2 ${s.bg}`}>
      <Text className="mr-1">{s.emoji}</Text>
      <Text className={`font-bold text-xs ${s.textColor}`}>{s.label}</Text>
    </View>
  );
}
