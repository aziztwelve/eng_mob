import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTrack } from '@/hooks/use-tracks';
import { TrackLessonsList } from '@/components/tracks/track-lessons-list';

export default function TrackDetailsScreen() {
  // :id может быть UUID или code (gateway различает по эвристике)
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: track, isLoading, error } = useTrack(id, true);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#00FFA3" />
        <Text className="text-muted-foreground mt-4">Loading track...</Text>
      </View>
    );
  }

  if (error || !track) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-4xl mb-4">😕</Text>
        <Text className="text-foreground font-bold text-lg mb-2">Track not found</Text>
        <Text className="text-muted-foreground text-center mb-6">
          {(error as any)?.message || 'Unable to load track.'}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-primary px-6 py-3 rounded-2xl"
        >
          <Text className="text-primary-foreground font-black uppercase">Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-card border-b-2 border-border">
        {track.icon_url ? (
          <Image
            source={{ uri: track.icon_url }}
            className="w-full h-48 bg-muted"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-48 bg-muted items-center justify-center">
            <Text className="text-6xl">🧭</Text>
          </View>
        )}

        <View className="px-4 py-4">
          <View className="flex-row flex-wrap gap-2 mb-2">
            <View className="px-3 py-1 rounded-full border-2 border-primary/40 bg-primary/20">
              <Text className="text-primary font-black text-xs uppercase">
                {track.track_type}
              </Text>
            </View>
            {!!track.language && (
              <View className="px-3 py-1 rounded-full border-2 border-border">
                <Text className="text-foreground font-bold text-xs uppercase">
                  {track.language}
                </Text>
              </View>
            )}
            {!!track.level && (
              <View className="px-3 py-1 rounded-full border-2 border-border">
                <Text className="text-foreground font-bold text-xs">{track.level}</Text>
              </View>
            )}
          </View>
          <Text className="text-foreground font-black text-2xl mb-2">{track.title}</Text>
          {!!track.description && (
            <Text className="text-muted-foreground text-base">{track.description}</Text>
          )}
        </View>
      </View>

      {/* Lessons */}
      <View className="px-4 py-4">
        <Text className="text-foreground font-black text-xl mb-3">
          Lessons {track.lessons ? `(${track.lessons.length})` : ''}
        </Text>
        <TrackLessonsList lessons={track.lessons ?? []} />
      </View>
    </ScrollView>
  );
}
