import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useTracks } from '@/hooks/use-tracks';
import { TrackCard } from '@/components/tracks/track-card';
import type { Track, TrackType } from '@/types/api';

const TYPE_FILTERS: Array<{ label: string; value: TrackType | null; emoji: string }> = [
  { label: 'All',     value: null,       emoji: '✨' },
  { label: 'Daily',   value: 'daily',    emoji: '🗓️' },
  { label: 'Stories', value: 'stories',  emoji: '📖' },
  { label: 'Podcast', value: 'podcast',  emoji: '🎧' },
  { label: 'Topic',   value: 'thematic', emoji: '🎯' },
];

export default function TracksScreen() {
  const [search, setSearch] = useState('');
  const [trackType, setTrackType] = useState<TrackType | null>(null);

  const { data, isLoading, error } = useTracks({
    search: search || undefined,
    track_type: trackType ?? undefined,
    limit: 50,
  });

  const tracks: Track[] = data?.tracks ?? [];

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-card border-b-2 border-border px-4 pt-12 pb-4">
        <Text className="text-3xl font-black text-primary mb-1">Tracks</Text>
        <Text className="text-muted-foreground text-sm mb-4">
          Daily mini-lessons, stories, podcasts and themed paths
        </Text>

        <TextInput
          className="bg-background border-2 border-border rounded-2xl px-4 py-3 text-foreground mb-3"
          placeholder="Search tracks..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />

        <View className="flex-row flex-wrap gap-2">
          {TYPE_FILTERS.map((f) => {
            const active = trackType === f.value;
            return (
              <Pressable
                key={f.label}
                onPress={() => setTrackType(f.value)}
                className={`px-4 py-2 rounded-full border-2 flex-row items-center ${
                  active ? 'bg-primary border-primary' : 'bg-background border-border'
                }`}
              >
                <Text className="mr-1">{f.emoji}</Text>
                <Text
                  className={`font-bold text-sm ${
                    active ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00FFA3" />
          <Text className="text-muted-foreground mt-4">Loading tracks...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-4xl mb-4">😕</Text>
          <Text className="text-foreground font-bold text-lg mb-2">
            Failed to load tracks
          </Text>
          <Text className="text-muted-foreground text-center">
            {(error as any)?.message || 'Please check your connection.'}
          </Text>
        </View>
      ) : tracks.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-4xl mb-4">🔍</Text>
          <Text className="text-foreground font-bold text-lg mb-2">No tracks found</Text>
          <Text className="text-muted-foreground text-center">
            Try a different filter or search.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tracks}
          renderItem={({ item }) => <TrackCard track={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
