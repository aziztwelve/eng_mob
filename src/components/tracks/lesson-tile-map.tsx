import React from 'react';
import { Image, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Check, Lock, Play } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

const tiles = {
  done: require('../../../assets/figma/lesson-tiles/tile-green.png'),
  current: require('../../../assets/figma/lesson-tiles/tile-blue.png'),
  locked: require('../../../assets/figma/lesson-tiles/tile-gray.png'),
};
const bear = require('../../../assets/figma/lesson-tiles/bear-hiker.png');
export type TileLesson = { id: string; title: string; state: 'done' | 'current' | 'locked' };

/** Artwork, connector and touch targets share one scaled coordinate system. */
export function LessonTileMap({ lessons, onOpen }: { lessons: TileLesson[]; onOpen: (index: number) => void }) {
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const canvasWidth = Math.min(width - 32, 420);
  const scale = canvasWidth / 358;
  const stride = 128 * scale;
  const points = lessons.map((lesson, index) => ({
    x: (lesson.state === 'current' ? 18 : 36) * scale,
    y: index * stride,
    width: (lesson.state === 'current' ? 302 : 272) * scale,
    height: (lesson.state === 'current' ? 181 : 163) * scale,
  }));
  const last = points[points.length - 1];
  const height = last ? last.y + last.height + 8 : 0;
  return <View className="mx-auto" style={{ width: canvasWidth, height }}>
    <Svg pointerEvents="none" width={canvasWidth} height={height} className="absolute">
      {points.slice(1).map((point, index) => {
        const previous = points[index];
        const startX = previous.x + previous.width * 0.78;
        const endX = point.x + point.width * 0.25;
        const startY = previous.y + previous.height * 0.78;
        const endY = point.y + point.height * 0.32;
        return <Path key={index} d={`M ${startX} ${startY} C ${startX + 80 * scale} ${startY + 42 * scale}, ${endX + 50 * scale} ${endY - 40 * scale}, ${endX} ${endY}`} fill="none" stroke="#9CBCCF" strokeWidth={2} strokeDasharray="4 6" />;
      })}
    </Svg>
    {lessons.map((lesson, index) => {
      const point = points[index];
      const done = lesson.state === 'done';
      const current = lesson.state === 'current';
      return <View key={lesson.id} className="absolute" style={{ left: point.x, top: point.y, width: point.width, height: point.height }}>
        {current ? <View pointerEvents="none" className="absolute z-10" style={{ left: 18 * scale, top: -28 * scale, width: 74 * scale, height: 99 * scale }}><Image source={bear} resizeMode="contain" accessible={false} className="h-full w-full" /></View> : null}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: lesson.state === 'locked' }} accessibilityLabel={`${index + 1}. ${lesson.title}. ${t(done ? 'tracks.passed' : current ? 'tracks.next_lesson' : 'lesson.locked')}`} onPress={() => onOpen(index)} className="h-full w-full active:opacity-80">
          <Image source={tiles[lesson.state]} resizeMode="contain" className="absolute h-full w-full" accessible={false} />
          <View className="absolute items-center" style={{ top: 35 * scale, left: 0, right: 0 }}>
            <View className={`h-7 w-7 items-center justify-center rounded-full ${done ? 'bg-[#34C759]' : current ? 'bg-[#1AB3FF]' : 'bg-[#B8C3CB]'}`}>
              {current ? <Play size={18} fill="white" color="white" /> : lesson.state === 'locked' ? <Lock size={16} color="white" /> : <Text className="font-nunito-extrabold text-sm text-white">{index + 1}</Text>}
            </View>
          </View>
          <View className="absolute" style={{ top: (current ? 82 : 72) * scale, left: 24 * scale, right: 24 * scale }}>
            <Text className={`text-center font-nunito-bold text-[13px] leading-[16px] ${lesson.state === 'locked' ? 'text-[#64727F]' : 'text-[#152F60]'}`}>{lesson.title}</Text>
          </View>
          {done ? <View className="absolute h-6 w-6 items-center justify-center rounded-full bg-[#34C759]" style={{ right: 36 * scale, top: 29 * scale }}><Check size={16} color="white" strokeWidth={3} /></View> : null}
        </Pressable>
      </View>;
    })}
  </View>;
}
