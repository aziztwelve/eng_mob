import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import type { LessonDetails } from '@/types/api';
import { LessonTypeBadge } from './lesson-type-badge';

interface Props {
  lessons: LessonDetails[];
}

export function TrackLessonsList({ lessons }: Props) {
  const router = useRouter();

  if (!lessons || lessons.length === 0) {
    return (
      <View className="bg-card rounded-3xl border-4 border-border p-6 items-center">
        <Text className="text-3xl mb-2">📭</Text>
        <Text className="text-muted-foreground text-center">
          В треке пока нет уроков
        </Text>
      </View>
    );
  }

  return (
    <View className="space-y-3">
      {lessons.map((lesson, idx) => {
        const isStandalone = !lesson.module_id || lesson.module_id === '';
        return (
          <Pressable
            key={lesson.id}
            onPress={() => router.push(`/learn/${lesson.id}`)}
            className="bg-card rounded-2xl border-4 border-border p-4 mb-3 active:scale-95"
          >
            <View className="flex-row items-start">
              <View className="bg-primary/20 w-10 h-10 rounded-full items-center justify-center mr-3">
                <Text className="text-primary font-black">{idx + 1}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-black text-base mb-1" numberOfLines={2}>
                  {lesson.title}
                </Text>
                {!!lesson.description && (
                  <Text className="text-muted-foreground text-sm mb-2" numberOfLines={2}>
                    {lesson.description}
                  </Text>
                )}
                <View className="flex-row">
                  <LessonTypeBadge context={isStandalone ? 'standalone' : 'course'} />
                </View>
              </View>
              <Text className="text-primary font-black text-xl ml-2">→</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
