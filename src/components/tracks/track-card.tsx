import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import type { Track, TrackType } from '@/types/api';

const TYPE_META: Record<TrackType, { label: string; emoji: string; tone: string }> = {
  daily:    { label: 'Daily',    emoji: '🗓️', tone: 'bg-blue-500/20 border-blue-500/40' },
  stories:  { label: 'Stories',  emoji: '📖', tone: 'bg-purple-500/20 border-purple-500/40' },
  podcast:  { label: 'Podcast',  emoji: '🎧', tone: 'bg-orange-500/20 border-orange-500/40' },
  thematic: { label: 'Topic',    emoji: '✨', tone: 'bg-emerald-500/20 border-emerald-500/40' },
};

function typeMeta(type: string) {
  return TYPE_META[(type as TrackType)] ?? TYPE_META.thematic;
}

export function TrackCard({ track }: { track: Track }) {
  const router = useRouter();
  const meta = typeMeta(track.track_type);

  return (
    <Pressable
      onPress={() => router.push(`/(tabs)/tracks/${track.code || track.id}`)}
      className="bg-card rounded-3xl mb-4 border-4 border-border overflow-hidden active:scale-95"
    >
      {/* Header image / fallback */}
      {track.icon_url ? (
        <Image
          source={{ uri: track.icon_url }}
          className="w-full h-32 bg-muted"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-32 bg-muted items-center justify-center">
          <Text className="text-5xl">{meta.emoji}</Text>
        </View>
      )}

      <View className="p-4">
        {/* Tag row */}
        <View className="flex-row flex-wrap gap-2 mb-3">
          <View className={`flex-row items-center px-3 py-1 rounded-full border-2 ${meta.tone}`}>
            <Text className="mr-1">{meta.emoji}</Text>
            <Text className="text-foreground font-bold text-xs">{meta.label}</Text>
          </View>
          {!!track.language && (
            <View className="px-3 py-1 rounded-full border-2 border-border">
              <Text className="text-foreground font-bold text-xs uppercase">{track.language}</Text>
            </View>
          )}
          {!!track.level && (
            <View className="px-3 py-1 rounded-full border-2 border-border">
              <Text className="text-foreground font-bold text-xs">{track.level}</Text>
            </View>
          )}
        </View>

        <Text className="text-foreground font-black text-lg mb-1" numberOfLines={2}>
          {track.title}
        </Text>
        {!!track.description && (
          <Text className="text-muted-foreground text-sm" numberOfLines={2}>
            {track.description}
          </Text>
        )}

        <View className="flex-row justify-end mt-3">
          <Text className="text-primary font-bold">Open →</Text>
        </View>
      </View>
    </Pressable>
  );
}
