import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import type { Track } from '@/types/api';

const CTA = ['#A8243F', '#CC5A1F'] as const;
const glass = {
  backgroundColor: 'rgba(255,255,255,0.14)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.22)',
} as const;

/** Карточка трека в стиле Sunset Lava (как главная/уроки). Без бейджей уровня. */
export function TrackCard({ track }: { track: Track }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/(tabs)/tracks/${track.code || track.id}`)}
      style={[s.card, glass]}
    >
      <View style={s.thumb}>
        {track.icon_url ? (
          <Image source={{ uri: track.icon_url }} style={s.thumbImg} resizeMode="cover" />
        ) : (
            <Text style={{ fontSize: 30 }}>✨</Text>
        )}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.title} numberOfLines={2}>
          {track.title}
        </Text>
        {!!track.description && (
          <Text style={s.desc} numberOfLines={2}>
            {track.description}
          </Text>
        )}
      </View>

      <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.go}>
        <Text style={s.goText}>›</Text>
      </LinearGradient>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 24, marginBottom: 14 },
  thumb: {
    width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  thumbImg: { width: '100%', height: '100%' },
  title: { color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 20 },
  desc: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '600', marginTop: 4 },
  go: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  goText: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: -2 },
});
