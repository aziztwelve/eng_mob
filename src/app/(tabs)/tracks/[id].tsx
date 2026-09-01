import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Check, Lock, Play, Trophy } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { useTrack, useTrackProgress } from '@/hooks/use-tracks';
import { useCompletedLessons } from '@/lib/lesson-progress';
import { ProgressRing, MiniChart } from '@/components/tracks/progress-bits';
import { glass, GOLD } from '@/components/sunset';

const TINTS = ['#5B6BFF', '#3FA9FF', '#F5A623', '#2EC4A0', '#F2542D', '#CE82FF', '#FF86B3'] as const;
function tintFor(code: string) {
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  return TINTS[hash % TINTS.length];
}

export default function TrackDetailsScreen() {
  const { id, goal } = useLocalSearchParams<{ id: string; goal?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { data: track, isLoading, error } = useTrack(id, true);
  const { data: localCompleted } = useCompletedLessons();
  const { data: serverCompleted } = useTrackProgress(id);

  if (isLoading) {
    return (
      <View style={s.center}>
        <Stack.Screen options={{ title: t('tracks.title') }} />
        <ActivityIndicator size="large" color="#FFD84A" />
      </View>
    );
  }

  if (error || !track) {
    return (
      <View style={s.center}>
        <Stack.Screen options={{ title: t('tracks.title') }} />
        <Text style={{ fontSize: 44, marginBottom: 12 }}>😕</Text>
        <Text style={s.errTitle}>{t('tracks.not_found')}</Text>
      </View>
    );
  }

  const code = track.code || track.id;
  const tint = tintFor(code);
  const title = goal ? t(`tracks.goals.${goal}` as never) ?? track.title : track.title;
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

  const doneCount = lessons.filter((lesson) => completed.has(lesson.id)).length;
  const pct = lessons.length > 0 ? Math.round((doneCount / lessons.length) * 100) : 0;
  const currentIdx = lessons.findIndex((_, i) => isUnlocked(i) && !isCompleted(i));
  const allDone = lessons.length > 0 && doneCount === lessons.length;

  const openLesson = (i: number) => {
    if (!isUnlocked(i)) {
      Toast.show({ type: 'info', text1: t('lesson.locked') });
      return;
    }
    router.push(`/learn/${lessons[i].id}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title }} />
      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 90 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Прогресс-карточка трека — как «Твой прогресс с AI» */}
        <View style={[s.progressCard, glass]}>
          <ProgressRing pct={pct} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.title} numberOfLines={2}>{title}</Text>
            <Text style={s.progressText}>{t('tracks.lessons_done', { done: doneCount, total: lessons.length })}</Text>
            <Text style={s.progressText}>
              {allDone ? t('tracks.track_passed') : t('tracks.keep_going')}
            </Text>
          </View>
          <MiniChart pct={pct} />
        </View>

        {!!track.description && (
          <Text style={s.desc}>{track.description}</Text>
        )}

        {/* Словарь трека */}
        <Pressable
          onPress={() => router.push(`/(tabs)/tracks/${code}/dictionary` as never)}
          style={[s.dictionary, glass]}
        >
          <View style={[s.dictionaryIcon, { backgroundColor: `${tint}26`, borderColor: `${tint}66` }]}>
            <BookOpen size={22} color={tint} weight="duotone" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.dictionaryTitle}>{t('tracks.track_dictionary')}</Text>
            <Text style={s.dictionaryText}>{t('tracks.dictionary_hint')}</Text>
          </View>
          <Text style={s.dictionaryArrow}>›</Text>
        </Pressable>

        {/* Уроки — карточки в стиле AI-инструментов */}
        <Text style={s.section}>{t('tracks.lessons')} {lessons.length ? `· ${lessons.length}` : ''}</Text>
        {lessons.length > 0 ? (
          lessons.map((lesson, idx) => {
            const done = isCompleted(idx);
            const unlocked = isUnlocked(idx);
            const isCurrent = idx === currentIdx;
            return (
              <Pressable
                key={lesson.id}
                onPress={() => openLesson(idx)}
                style={[s.lesson, glass, isCurrent && s.lessonCurrent]}
              >
                <View
                  style={[
                    s.lessonThumb,
                    { backgroundColor: done ? `${tint}26` : 'rgba(255,255,255,0.08)', borderColor: done ? `${tint}66` : 'rgba(255,255,255,0.18)' },
                  ]}
                >
                  {done ? (
                    <Check size={22} color={tint} weight="bold" />
                  ) : unlocked ? (
                    <Text style={[s.lessonNum, { color: tint }]}>{idx + 1}</Text>
                  ) : (
                    <Lock size={20} color="rgba(255,255,255,0.4)" weight="fill" />
                  )}
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[s.lessonTitle, !unlocked && s.lockedText]} numberOfLines={2}>
                    {lesson.title}
                  </Text>
                  {!!lesson.description && (
                    <Text style={[s.lessonDesc, !unlocked && s.lockedText]} numberOfLines={2}>
                      {lesson.description}
                    </Text>
                  )}
                  {isCurrent && <Text style={[s.currentLabel, { color: tint }]}>{t('tracks.next_lesson')}</Text>}
                </View>

                {unlocked ? (
                  isCurrent ? (
                    <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.go}>
                      <Play size={18} color="#3D0A1A" weight="fill" />
                    </LinearGradient>
                  ) : (
                    <Text style={s.goDone}>↻</Text>
                  )
                ) : (
                  <View style={s.goLocked}>
                    <Lock size={16} color="rgba(255,255,255,0.45)" weight="fill" />
                  </View>
                )}
              </Pressable>
            );
          })
        ) : (
          <View style={[s.emptyCard, glass]}>
            <Text style={{ fontSize: 36 }}>🦉</Text>
            <Text style={s.emptyText}>{t('tracks.lessons_soon')}</Text>
          </View>
        )}

        {/* Финальная карточка-трофей */}
        {allDone && (
          <View style={[s.trophyCard, glass]}>
            <Trophy size={26} color="#FFD84A" weight="fill" />
            <Text style={s.trophyText}>{t('tracks.track_done')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errTitle: { color: '#fff', fontWeight: '800', fontSize: 18, marginBottom: 16 },

  progressCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, padding: 16 },
  title: { color: '#fff', fontSize: 16, fontWeight: '900', flexShrink: 1 },
  progressText: { color: 'rgba(255,255,255,0.8)', fontSize: 12.5, fontWeight: '600', marginTop: 2 },
  desc: { color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 19, marginTop: 12 },

  dictionary: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 14, marginTop: 16 },
  dictionaryIcon: {
    width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  dictionaryTitle: { color: '#fff', fontSize: 15.5, fontWeight: '900' },
  dictionaryText: { color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 3 },
  dictionaryArrow: { color: '#FFD84A', fontSize: 28, fontWeight: '900' },

  section: { color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 22, marginBottom: 12 },

  lesson: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, marginBottom: 10 },
  lessonCurrent: { borderColor: 'rgba(255,216,74,0.55)', backgroundColor: 'rgba(255,216,74,0.10)' },
  lessonThumb: {
    width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  lessonNum: { fontSize: 18, fontWeight: '900' },
  lessonTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  lessonDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 3 },
  currentLabel: { fontSize: 11, fontWeight: '800', marginTop: 5, letterSpacing: 0.3 },
  go: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  goDone: { color: 'rgba(255,255,255,0.55)', fontSize: 22, fontWeight: '900' },
  goLocked: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  emptyCard: { borderRadius: 20, padding: 28, alignItems: 'center', gap: 10 },
  emptyText: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 14 },
  lockedText: { color: 'rgba(255,255,255,0.55)' },

  trophyCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 20, padding: 16, marginTop: 6,
  },
  trophyText: { color: '#FFD84A', fontSize: 15, fontWeight: '900' },
});
