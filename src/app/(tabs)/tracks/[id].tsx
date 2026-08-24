import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Check, BookOpen } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { useTrack, useTrackProgress } from '@/hooks/use-tracks';
import { useCompletedLessons } from '@/lib/lesson-progress';

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
const GOAL_TITLES: Record<string, string> = {
  work: 'Работа и карьера', exam: 'Экзамен', travel: 'Путешествия',
  relocation: 'Переезд',
  speaking: 'Разговорная практика', study: 'Учёба', social: 'Друзья и общение',
  content: 'Фильмы и книги', listening_shadowing: 'Listening & Shadowing',
};

export default function TrackDetailsScreen() {
  const { id, goal } = useLocalSearchParams<{ id: string; goal?: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: track, isLoading, error } = useTrack(id, true);
  const { data: localCompleted } = useCompletedLessons();
  const { data: serverCompleted } = useTrackProgress(id);

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
  const title = goal ? GOAL_TITLES[goal] ?? track.title : track.title;
  const lessons = track.lessons ?? [];
  // Источник правды для замков: серверный прогресс (кросс-девайс) ∪ локальный
  // (мгновенно отражает только что пройденный урок до синка с сервером).
  const completed = new Set<string>([
    ...(localCompleted ? [...localCompleted] : []),
    ...(serverCompleted ? [...serverCompleted] : []),
  ]);
  const isCompleted = (i: number) => {
    const lid = lessons[i]?.id;
    return !!lid && completed.has(lid);
  };
  // Урок доступен, если он первый, уже пройден, или пройден предыдущий.
  const isUnlocked = (i: number) => i === 0 || isCompleted(i) || isCompleted(i - 1);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title }} />
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
          <Text style={s.title}>{title}</Text>
          <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.underline} />
          {!!track.description && <Text style={s.desc}>{track.description}</Text>}
        </View>

        <Pressable
          onPress={() => router.push(`/(tabs)/tracks/${track.code || track.id}/dictionary` as never)}
          style={[s.dictionary, glass]}
        >
          <View style={s.dictionaryIcon}>
            <BookOpen size={24} color="#FFD84A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.dictionaryTitle}>Словарь трека</Text>
            <Text style={s.dictionaryText}>Выбери слова и добавь их во флешкарты</Text>
          </View>
          <Text style={s.dictionaryArrow}>›</Text>
        </Pressable>

        {/* Lessons */}
        <View style={{ gap: 12 }}>
          <Text style={s.section}>Уроки {lessons.length ? `· ${lessons.length}` : ''}</Text>
          {lessons.length > 0 ? (
            lessons.map((lesson, idx) => {
              const done = isCompleted(idx);
              const unlocked = isUnlocked(idx);
              const onPress = () => {
                if (!unlocked) {
                  Toast.show({ type: 'info', text1: t('lesson.locked') });
                  return;
                }
                router.push(`/learn/${lesson.id}`);
              };
              return (
                <Pressable
                  key={lesson.id}
                  onPress={onPress}
                  style={[s.lesson, glass, !unlocked && s.lessonLocked]}
                >
                  <View style={[s.num, done && s.numDone, !unlocked && s.numLocked]}>
                    {done ? (
                      <Check size={18} color="#0E2A14" strokeWidth={3} />
                    ) : !unlocked ? (
                      <Lock size={16} color="rgba(255,255,255,0.7)" />
                    ) : (
                      <Text style={s.numText}>{idx + 1}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[s.lessonTitle, !unlocked && s.lockedText]} numberOfLines={2}>{lesson.title}</Text>
                    {!!lesson.description && (
                      <Text style={[s.lessonDesc, !unlocked && s.lockedText]} numberOfLines={2}>{lesson.description}</Text>
                    )}
                  </View>
                  {unlocked ? (
                    <LinearGradient colors={done ? GOLD : CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.go}>
                      <Text style={[s.goText, done && { color: '#3D0A1A' }]}>{done ? '↻' : '›'}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={s.goLocked}>
                      <Lock size={16} color="rgba(255,255,255,0.55)" />
                    </View>
                  )}
                </Pressable>
              );
            })
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

  dictionary: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 14 },
  dictionaryIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,216,74,0.16)' },
  dictionaryTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  dictionaryText: { color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 3 },
  dictionaryArrow: { color: '#FFD84A', fontSize: 28, fontWeight: '900' },

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

  lessonLocked: { opacity: 0.55 },
  numDone: { backgroundColor: '#7CE2A0', borderColor: '#7CE2A0' },
  numLocked: { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.22)' },
  lockedText: { color: 'rgba(255,255,255,0.6)' },
  goLocked: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
});
