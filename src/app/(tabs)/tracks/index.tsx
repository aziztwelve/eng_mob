import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQueries } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  Briefcase, TrendUp, Target, Airplane, ChatCircle, GraduationCap, Headphones,
  type Icon as PhosphorIcon,
} from 'phosphor-react-native';
import { TracksApi } from '@/lib/api-client';
import { useTracks } from '@/hooks/use-tracks';
import { useOnboardingState } from '@/hooks/use-onboarding';
import { useCompletedLessons } from '@/lib/lesson-progress';
import { TrackPathCard } from '@/components/tracks/track-path-card';
import { ProgressRing, MiniChart } from '@/components/tracks/progress-bits';
import { glass, GOLD } from '@/components/sunset';
import type { Track } from '@/types/api';

const GOALS: { key: string; Icon: PhosphorIcon; tint: string }[] = [
  { key: 'work', Icon: Briefcase, tint: '#5B6BFF' },
  { key: 'business_english', Icon: TrendUp, tint: '#2EC4A0' },
  { key: 'exam', Icon: Target, tint: '#F2542D' },
  { key: 'travel', Icon: Airplane, tint: '#3FA9FF' },
  { key: 'speaking', Icon: ChatCircle, tint: '#F5A623' },
  { key: 'study', Icon: GraduationCap, tint: '#CE82FF' },
  { key: 'listening_shadowing', Icon: Headphones, tint: '#FF86B3' },
];

type GoalKey = string;
const LEGACY_GOAL_ALIASES: Record<string, GoalKey> = {
  education: 'study',
  career: 'work',
  brain: 'listening_shadowing',
};
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

export default function TracksScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ goal?: string; level?: string }>();
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<GoalKey | null>(null);

  useEffect(() => {
    if (params.goal && GOALS.some((goal) => goal.key === params.goal)) {
      setSelectedGoal(params.goal);
    }
    if (params.level && LEVELS.includes(params.level)) {
      setSelectedLevel(params.level);
    }
  }, [params.goal, params.level]);

  const onboarding = useOnboardingState();
  const language = onboarding.data?.target_language || undefined;

  const { data, isLoading, error } = useTracks({
    search: search || undefined,
    language,
    level: selectedLevel?.toLowerCase(),
    // API добавляет к трекам выбранной цели универсальные (motivation: []).
    motivation: selectedGoal ? [selectedGoal] : undefined,
    limit: 100,
  });

  const all = useMemo<Track[]>(() => data?.tracks ?? [], [data?.tracks]);
  const tracksByGoal = useMemo(() => {
    const byGoal = new Map<GoalKey, Track[]>();
    GOALS.forEach(({ key }) => byGoal.set(key, []));
    all.forEach((track) => {
      const goals = (track.motivation ?? []).map((goal) => LEGACY_GOAL_ALIASES[goal] ?? goal);
      goals.forEach((goal) => byGoal.get(goal)?.push(track));
    });
    return byGoal;
  }, [all]);

  const selectedTracks = useMemo(
    () => (selectedGoal ? (tracksByGoal.get(selectedGoal) ?? []) : []),
    [selectedGoal, tracksByGoal],
  );
  const selectedGoalMeta = selectedGoal ? GOALS.find((goal) => goal.key === selectedGoal) : null;
  const goalTitle = (key: string) => t(`tracks.goals.${key}` as never);

  const { data: localCompleted } = useCompletedLessons();

  // Уроки и серверный прогресс для карточек выбранной цели. Ключи совпадают
  // с useTrack / useTrackProgress — кэш шарится с экраном трека.
  const trackQueries = useQueries({
    queries: selectedTracks.map((track) => ({
      queryKey: ['track', track.code || track.id, true] as const,
      queryFn: () => TracksApi.get(track.code || track.id, true),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const progressQueries = useQueries({
    queries: selectedTracks.map((track) => ({
      queryKey: ['trackProgress', track.code || track.id] as const,
      queryFn: () => TracksApi.progress(track.code || track.id),
      staleTime: 30 * 1000,
    })),
  });

  // Общий прогресс уровня: завершённые уроки по всем трекам цели.
  const overall = useMemo(() => {
    let total = 0;
    let doneCount = 0;
    trackQueries.forEach((query, i) => {
      const lessons = query.data?.lessons ?? [];
      const serverIds = progressQueries[i]?.data?.lessons.filter((l) => l.completed).map((l) => l.lesson_id) ?? [];
      const doneSet = new Set<string>([...(localCompleted ?? []), ...serverIds]);
      total += lessons.length;
      doneCount += lessons.filter((lesson) => doneSet.has(lesson.id)).length;
    });
    return { total, doneCount, pct: total > 0 ? Math.round((doneCount / total) * 100) : 0 };
  }, [trackQueries, progressQueries, localCompleted]);

  const completedFor = (i: number) => {
    const serverIds = progressQueries[i]?.data?.lessons.filter((l) => l.completed).map((l) => l.lesson_id) ?? [];
    return new Set<string>([...(localCompleted ?? []), ...serverIds]);
  };

  const bottomPad = { paddingBottom: 78 + insets.bottom };

  type Item = (typeof GOALS)[number] | string;
  const items: Item[] = selectedLevel ? GOALS : LEVELS;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: t('tracks.title') }} />

      {selectedLevel && selectedGoal ? (
        /* Просмотр уровня+цели: прогресс-карточка в стиле AI-hub */
        <FlatList
          key={`tracks-${selectedGoal}`}
          data={selectedTracks}
          renderItem={({ item, index }) => (
            <TrackPathCard
              code={item.code || item.id}
              title={item.title}
              lessons={trackQueries[index]?.data?.lessons}
              loading={trackQueries[index]?.isLoading}
              completed={completedFor(index)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 12, ...bottomPad }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              <View style={st.pathHeader}>
                <Pressable
                  onPress={() => { setSelectedGoal(null); setSearch(''); }}
                  style={st.backCircle}
                  hitSlop={8}
                >
                  <Text style={st.backCircleText}>‹</Text>
                </Pressable>
                <View style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
                  <Text style={st.levelTitle} numberOfLines={1}>
                    {selectedLevel} · {t(`tracks.level_titles.${selectedLevel}` as never)}
                  </Text>
                  <Text style={st.levelGoal} numberOfLines={1}>{selectedGoalMeta ? goalTitle(selectedGoalMeta.key) : ''}</Text>
                </View>
                <View style={[st.progressPill, glass]}>
                  <Text style={st.progressPillText}>{t('tracks.tracks_count', { count: selectedTracks.length })}</Text>
                </View>
              </View>

              {/* Прогресс уровня — карточка как «Твой прогресс с AI» */}
              <View style={[st.progressCard, glass]}>
                <ProgressRing pct={overall.pct} />
                <View style={{ flex: 1 }}>
                  <Text style={st.progressTitle}>{t('tracks.your_progress')}</Text>
                  <Text style={st.progressText}>{t('tracks.lessons_done', { done: overall.doneCount, total: overall.total })}</Text>
                  <Text style={st.progressText}>
                    {overall.pct >= 100 ? t('tracks.level_done') : t('tracks.keep_going')}
                  </Text>
                </View>
                <MiniChart pct={overall.pct} />
              </View>

              <View style={[st.search, glass]}>
                <Text style={{ fontSize: 16 }}>🔍</Text>
                <TextInput style={st.searchInput} placeholder={t('tracks.search')} placeholderTextColor="rgba(255,255,255,0.5)" value={search} onChangeText={setSearch} />
              </View>
            </View>
          }
        />
      ) : (
        <FlatList
          key={selectedLevel ? 'goals-grid' : 'levels-grid'}
          data={items}
          numColumns={2}
          keyExtractor={(item) => (typeof item === 'string' ? item : item.key)}
          contentContainerStyle={[st.goalsGrid, bottomPad]}
          columnWrapperStyle={st.goalRow}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 0 }}>
              <Text style={st.title}>{t('tracks.title')}</Text>
              <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.underline} />
              <Text style={st.subtitle}>
                {selectedLevel ? t('tracks.level_then') : t('tracks.level_first')}
              </Text>
              {selectedLevel && (
                <Pressable onPress={() => setSelectedLevel(null)} style={st.backButton}>
                  <Text style={st.backButtonText}>{t('tracks.back_to_levels')}</Text>
                </Pressable>
              )}
            </View>
          }
          renderItem={({ item }) =>
            typeof item === 'string' ? (
              <Pressable onPress={() => setSelectedLevel(item)} style={[st.goalCard, glass]}>
                <Text style={st.levelEmoji}>{item}</Text>
                <Text style={st.goalTitle}>{t(`tracks.level_titles.${item}` as never)}</Text>
                <Text style={st.goalCount}>{t('tracks.choose_level')}</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => setSelectedGoal(item.key)} style={[st.goalCard, glass]}>
                <View style={[st.goalIcon, { backgroundColor: item.tint, shadowColor: item.tint }]}>
                  <item.Icon size={24} color="#fff" weight="fill" />
                </View>
                <Text style={st.goalTitle}>{goalTitle(item.key)}</Text>
                <Text style={st.goalCount}>
                  {(tracksByGoal.get(item.key) ?? []).length
                    ? t('tracks.tracks_count', { count: (tracksByGoal.get(item.key) ?? []).length })
                    : t('tracks.soon')}
                </Text>
              </Pressable>
            )
          }
        />
      )}

      {(isLoading || error) && !selectedGoal && (
        <View style={st.center}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#FFD84A" />
          ) : (
            <>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>😕</Text>
              <Text style={st.msg}>{t('tracks.load_error')}</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  title: { color: '#fff', fontSize: 28, fontWeight: '900' },
  underline: { width: 44, height: 3, borderRadius: 2, marginTop: 6 },
  subtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '600', marginTop: 10 },
  backButton: { alignSelf: 'flex-start', marginTop: 14, paddingVertical: 4 },
  backButtonText: { color: '#FFE69A', fontSize: 14, fontWeight: '900' },
  levelEmoji: { color: '#FFE69A', fontSize: 34, fontWeight: '900', letterSpacing: 1 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginTop: 14 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '600' },

  /* Шапка уровня */
  pathHeader: { flexDirection: 'row', alignItems: 'center' },
  backCircle: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
  backCircleText: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: -2 },
  levelTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  levelGoal: { color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: '700', marginTop: 2 },
  progressPill: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  progressPillText: { color: '#FFD84A', fontSize: 13, fontWeight: '900' },

  /* Прогресс-карточка в стиле AI-hub */
  progressCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, padding: 16, marginTop: 16 },
  progressTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  progressText: { color: 'rgba(255,255,255,0.8)', fontSize: 12.5, fontWeight: '600', marginTop: 2 },

  /* Сетки уровней / целей */
  goalsGrid: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 40 },
  goalRow: { gap: 12, marginBottom: 12 },
  goalCard: { flex: 1, minHeight: 142, borderRadius: 20, padding: 16, justifyContent: 'space-between' },
  goalIcon: {
    width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.55, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  goalTitle: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 12 },
  goalCount: { color: 'rgba(255,255,255,0.64)', fontSize: 12, fontWeight: '700', marginTop: 6 },

  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 24 },
  msg: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 15 },
});
