import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTracks } from '@/hooks/use-tracks';
import { useOnboardingState } from '@/hooks/use-onboarding';
import { TrackCard } from '@/components/tracks/track-card';
import type { Track, TrackType } from '@/types/api';

const GOLD = ['#FFDF5E', '#FFB338'] as const;
const CTA = ['#A8243F', '#CC5A1F'] as const;
const glass = {
  backgroundColor: 'rgba(255,255,255,0.14)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.22)',
} as const;

const TYPE_FILTERS: Array<{ label: string; value: TrackType | null; emoji: string }> = [
  { label: 'Все', value: null, emoji: '✨' },
  { label: 'Каждый день', value: 'daily', emoji: '🗓️' },
  { label: 'Истории', value: 'stories', emoji: '📖' },
  { label: 'Подкаст', value: 'podcast', emoji: '🎧' },
  { label: 'Темы', value: 'thematic', emoji: '🎯' },
];

export default function TracksScreen() {
  const [search, setSearch] = useState('');
  const [trackType, setTrackType] = useState<TrackType | null>(null);

  const onboarding = useOnboardingState();
  const level = String(onboarding.data?.level ?? '').toLowerCase() || undefined;
  const language = onboarding.data?.target_language || undefined;

  const { data, isLoading, error } = useTracks({
    search: search || undefined,
    track_type: trackType ?? undefined,
    language,
    level,
    limit: 50,
  });

  const all: Track[] = data?.tracks ?? [];
  const tracks = all;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Треки' }} />

      {/* Header */}
      <View style={{ paddingHorizontal: 18, paddingTop: 12 }}>
        <Text style={st.title}>Треки</Text>
        <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.underline} />
        <Text style={st.subtitle}>Подобраны под твой уровень</Text>

        <View style={[st.search, glass]}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            style={st.searchInput}
            placeholder="Поиск треков..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={st.filters}>
          {TYPE_FILTERS.map((f) => {
            const active = trackType === f.value;
            return (
              <Pressable key={f.label} onPress={() => setTrackType(f.value)}>
                {active ? (
                  <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.pillActive}>
                    <Text style={{ marginRight: 5 }}>{f.emoji}</Text>
                    <Text style={st.pillTextActive}>{f.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[st.pill, glass]}>
                    <Text style={{ marginRight: 5 }}>{f.emoji}</Text>
                    <Text style={st.pillText}>{f.label}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={st.center}>
          <ActivityIndicator size="large" color="#FFD84A" />
        </View>
      ) : error ? (
        <View style={st.center}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>😕</Text>
          <Text style={st.msg}>Не удалось загрузить треки</Text>
        </View>
      ) : tracks.length === 0 ? (
        <View style={st.center}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>🔍</Text>
          <Text style={st.msg}>Треков не найдено</Text>
        </View>
      ) : (
        <FlatList
          data={tracks}
          renderItem={({ item }) => <TrackCard track={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  title: { color: '#fff', fontSize: 28, fontWeight: '900' },
  underline: { width: 44, height: 3, borderRadius: 2, marginTop: 6 },
  subtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '600', marginTop: 10 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginTop: 14 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '600' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  pillActive: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  pillText: { color: 'rgba(255,255,255,0.85)', fontWeight: '800', fontSize: 13 },
  pillTextActive: { color: '#fff', fontWeight: '800', fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  msg: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 15 },
});
