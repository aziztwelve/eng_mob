import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTrack } from '@/hooks/use-tracks';

const CTA = ['#A8243F', '#CC5A1F'] as const;
const GOLD = ['#FFDF5E', '#FFB338'] as const;
const glass = {
  backgroundColor: 'rgba(255,255,255,0.14)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.22)',
} as const;

const TYPE_EMOJI: Record<string, string> = {
  daily: '🗓️', stories: '📖', podcast: '🎧', thematic: '🎯', personal: '🧭',
};

export default function TrackDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: track, isLoading, error } = useTrack(id, true);

  if (isLoading) {
    return (
      <View style={s.center}>
        <Stack.Screen options={{ title: 'Трек' }} />
        <ActivityIndicator size="large" color="#FFD84A" />
      </View>
    );
  }

  if (error || !track) {
    return (
      <View style={s.center}>
        <Stack.Screen options={{ title: 'Трек' }} />
        <Text style={{ fontSize: 44, marginBottom: 12 }}>😕</Text>
        <Text style={s.errTitle}>Трек не найден</Text>
        <Pressable onPress={() => router.back()} style={s.backBtnWrap}>
          <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.backBtn}>
            <Text style={s.backBtnText}>Назад</Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  const emoji = TYPE_EMOJI[track.track_type as string] ?? '✨';
  const lessons = track.lessons ?? [];

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: track.title }} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[s.hero, glass]}>
          <View style={s.heroThumb}>
            {track.icon_url ? (
              <Image source={{ uri: track.icon_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Text style={{ fontSize: 44 }}>{emoji}</Text>
            )}
          </View>
          <Text style={s.title}>{track.title}</Text>
          <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.underline} />
          {!!track.description && <Text style={s.desc}>{track.description}</Text>}
        </View>

        {/* Lessons */}
        <View style={{ gap: 12 }}>
          <Text style={s.section}>Уроки {lessons.length ? `· ${lessons.length}` : ''}</Text>
          {lessons.length > 0 ? (
            lessons.map((lesson, idx) => (
              <Pressable
                key={lesson.id}
                onPress={() => router.push(`/learn/${lesson.id}`)}
                style={[s.lesson, glass]}
              >
                <View style={s.num}>
                  <Text style={s.numText}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.lessonTitle} numberOfLines={2}>{lesson.title}</Text>
                  {!!lesson.description && (
                    <Text style={s.lessonDesc} numberOfLines={2}>{lesson.description}</Text>
                  )}
                </View>
                <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.go}>
                  <Text style={s.goText}>›</Text>
                </LinearGradient>
              </Pressable>
            ))
          ) : (
            <View style={[s.emptyCard, glass]}>
              <Text style={{ fontSize: 36 }}>🦉</Text>
              <Text style={s.emptyText}>Уроки скоро появятся</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errTitle: { color: '#fff', fontWeight: '800', fontSize: 18, marginBottom: 16 },
  backBtnWrap: { borderRadius: 16, overflow: 'hidden' },
  backBtn: { paddingVertical: 14, paddingHorizontal: 28 },
  backBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },

  hero: { borderRadius: 28, padding: 20, alignItems: 'flex-start', gap: 10 },
  heroThumb: {
    width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 4 },
  underline: { width: 44, height: 3, borderRadius: 2 },
  desc: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 20 },

  section: { color: '#fff', fontSize: 18, fontWeight: '900' },
  lesson: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20 },
  num: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,216,74,0.25)', borderWidth: 1, borderColor: 'rgba(255,216,74,0.5)',
  },
  numText: { color: '#FFD84A', fontWeight: '900', fontSize: 15 },
  lessonTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  lessonDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 3 },
  go: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  goText: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: -2 },

  emptyCard: { borderRadius: 20, padding: 28, alignItems: 'center', gap: 10 },
  emptyText: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 14 },
});
