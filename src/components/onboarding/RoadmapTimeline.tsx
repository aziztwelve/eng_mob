import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInLeft } from 'react-native-reanimated';

import { Mascot } from './Mascot';
import type { MascotPose } from '@/lib/mascot-manifest';
import type { RoadmapMilestone } from '@/lib/onboarding-copy';

/**
 * <RoadmapTimeline> — вертикальный timeline 5 milestones для
 * interstitial-roadmap. Каждая точка — кружок с mascot-аватаром +
 * заголовок (когда) + копия (что).
 *
 * Линия слева соединяет точки. Анимация — FadeInLeft с задержкой по индексу.
 */

const POSES: MascotPose[] = ['idle', 'cheering', 'thumbs_up', 'wink', 'cheering'];

export interface RoadmapTimelineProps {
  milestones: readonly RoadmapMilestone[];
}

export function RoadmapTimeline({ milestones }: RoadmapTimelineProps) {
  return (
    <View className="relative pl-2">
      {/* Vertical line */}
      <View className="absolute left-7 top-6 bottom-6 w-0.5 bg-border" />

      <View className="gap-5">
        {milestones.map((m, i) => (
          <Animated.View
            key={i}
            entering={FadeInLeft.duration(280).delay(120 + i * 90)}
            className="flex-row items-start gap-4"
          >
            {/* Mascot circle */}
            <View className="w-12 h-12 rounded-full bg-card border-2 border-primary items-center justify-center overflow-hidden">
              <Mascot pose={POSES[i % POSES.length]} size={40} />
            </View>

            {/* Copy */}
            <View className="flex-1 bg-card border-2 border-border rounded-2xl px-4 py-3">
              <Text className="text-primary font-black text-sm uppercase">
                {m.when}
              </Text>
              <Text className="text-foreground font-bold text-base mt-1 leading-snug">
                {m.text}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
