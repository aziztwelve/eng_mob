import React from 'react';
import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import type { LessonDetails, Track } from '@/types/api';
import { LessonTypeBadge } from './lesson-type-badge';

interface Props {
  track?: Track | null;
  lesson?: LessonDetails | null;
  isLoading?: boolean;
}

/**
 * Карточка «урок дня» на главном экране. Использует первый daily-track
 * и его первый урок (см. useDailyLesson).
 */
export function DailyLessonCard({ track, lesson, isLoading }: Props) {
  const router = useRouter();

  if (isLoading) {
    return (
      <View className="bg-card rounded-3xl border-4 border-border p-6 items-center justify-center min-h-[140px]">
        <ActivityIndicator size="small" color="#58cc02" />
      </View>
    );
  }

  if (!track || !lesson) {
    return (
      <View className="bg-card rounded-3xl border-4 border-border p-6">
        <Text className="text-foreground font-black text-lg mb-1">Daily Lesson</Text>
        <Text className="text-muted-foreground text-sm">
          Daily-трек ещё не настроен. Добавь публикованный трек с track_type=daily.
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(`/learn/${lesson.id}`)}
      className="bg-card rounded-3xl border-4 border-border overflow-hidden active:scale-95"
    >
      {track.icon_url ? (
        <Image
          source={{ uri: track.icon_url }}
          className="w-full h-32 bg-muted"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-32 bg-gradient-to-br from-primary/20 to-secondary/20 items-center justify-center">
          <Text className="text-5xl">🗓️</Text>
        </View>
      )}

      <View className="p-4">
        <View className="flex-row items-center mb-2">
          <View className="bg-primary/20 px-3 py-1 rounded-full border-2 border-primary/40 mr-2">
            <Text className="text-primary font-black text-xs">DAILY</Text>
          </View>
          <LessonTypeBadge context="standalone" />
        </View>

        <Text className="text-muted-foreground text-xs mb-1">{track.title}</Text>
        <Text className="text-foreground font-black text-lg mb-2" numberOfLines={2}>
          {lesson.title}
        </Text>
        {!!lesson.description && (
          <Text className="text-muted-foreground text-sm" numberOfLines={2}>
            {lesson.description}
          </Text>
        )}

        <View className="flex-row justify-end mt-3">
          <Text className="text-primary font-black">Start lesson →</Text>
        </View>
      </View>
    </Pressable>
  );
}
