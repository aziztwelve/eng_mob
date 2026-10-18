import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet, BackHandler } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueries } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  Briefcase, TrendUp, Target, Airplane, ChatCircle, GraduationCap, Headphones, CaretLeft,
  type Icon as PhosphorIcon,
} from 'phosphor-react-native';
import { TracksApi } from '@/lib/api-client';
import { useTracks } from '@/hooks/use-tracks';
import { useOnboardingState } from '@/hooks/use-onboarding';
import { useCompletedLessons } from '@/lib/lesson-progress';
import { CloudTrackPath } from '@/components/tracks/cloud-track-path';

import type { Track } from '@/types/api';

// Light panel for the Explore Levels design (white card with a blue border).

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

export default function TracksScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ goal?: string; level?: string }>();
  const [search, setSearch] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<GoalKey | null>(null);
  // Уровень приходит deep-link'ом из Practice (сетка уровней) и живёт
  // до закрытия экрана; используется только как фильтр запроса.
  const [level, setLevel] = useState<string | null>(null);

  useEffect(() => {
    if (params.goal && GOALS.some((goal) => goal.key === params.goal)) {
      setSelectedGoal(params.goal);
    }
    if (params.level) {
      setLevel(params.level.toUpperCase());
    }
  }, [params.goal, params.level]);

  // Hardware/system back: from a direction go back to the directions list first.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (selectedGoal) {
          setSelectedGoal(null);
          setSearch('');
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [selectedGoal]),
  );
  // Leaving the screen resets it to the directions list (no stale inner page on return).
  useFocusEffect(
    useCallback(() => () => {
      setSelectedGoal(null);
      setSearch('');
    }, []),
  );

  const onboarding = useOnboardingState();
  const language = onboarding.data?.target_language || undefined;

  const { data, isLoading, error, refetch } = useTracks({
    search: search || undefined,
    language,
    level: (level ?? (selectedGoal ? 'A1' : null))?.toLowerCase(),
    // API добавляет к трекам выбранной цели универсальные (motivation: []).
    motivation: selectedGoal ? [selectedGoal] : undefined,
    limit: 500,
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

  const completedFor = (i: number) => {
    const serverIds = progressQueries[i]?.data?.lessons.filter((l) => l.completed).map((l) => l.lesson_id) ?? [];
    return new Set<string>([...(localCompleted ?? []), ...serverIds]);
  };

  const router = useRouter();

  if (selectedGoal) return <View className="flex-1">
    <Stack.Screen options={{ headerShown: false }} />
    <CloudTrackPath key={selectedGoal} title={goalTitle(selectedGoal)} level={level ?? 'A1'}
      items={selectedTracks.map((track, index) => ({
        track,
        lessons: [...(trackQueries[index]?.data?.lessons ?? [])].sort((a, b) => a.order_index - b.order_index).map(lesson => ({ id: lesson.id, completed: completedFor(index).has(lesson.id) })),
        loading: trackQueries[index]?.isPending || progressQueries[index]?.isPending || false,
        error: !!trackQueries[index]?.error || !!progressQueries[index]?.error,
      }))}
      loading={isLoading} error={!!error}
      onRetry={() => { void refetch(); trackQueries.forEach(query => query.refetch()); progressQueries.forEach(query => query.refetch()); }}
      onBack={() => { setSelectedGoal(null); setSearch(''); }}
      onLevel={setLevel}
      onOpenTrack={track => router.push(`/(tabs)/tracks/${track.code || track.id}`)}
      onContinue={id => router.push(`/learn/${id}`)} />
  </View>;

  const bottomPad = { paddingBottom: 78 + insets.bottom };

  // Directions (goals) inside a level: sky background, icon tiles in two columns.
  return (
    <LinearGradient colors={['#A9E0FF', '#D6F0FF', '#FFFFFF']} locations={[0, 0.24, 0.56]} style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        key="goals-list"
        data={GOALS}
        keyExtractor={(item) => item.key}
        contentContainerStyle={[st.goalsGrid, bottomPad]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={st.goalsTop}>
            <Pressable onPress={() => router.back()} style={st.goalsBack} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('common.back')}>
              <CaretLeft size={22} weight="bold" color="#171A1C" />
            </Pressable>
            <View style={{ flex: 1 }}>
              {level ? <Text style={st.goalsSub}>{level} · {t(`tracks.level_titles.${level}` as never)}</Text> : null}
              <Text style={st.goalsTitle}>{t('tracks.goals_title')}</Text>
            </View>
          </View>
        }
        numColumns={2}
        columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
        renderItem={({ item }) => {
          const count = (tracksByGoal.get(item.key) ?? []).length;
          const open = count > 0;
          return (
            <Pressable
              disabled={!open}
              onPress={() => setSelectedGoal(item.key)}
              accessibilityRole="button"
              style={[st.goalTile, !open && { opacity: 0.7 }]}
            >
              <View style={[st.goalTileIcon, { backgroundColor: open ? item.tint : '#B8C4CC' }]}>
                <item.Icon size={26} weight="fill" color="#FFFFFF" />
              </View>
              <Text style={st.goalTileTitle} numberOfLines={2}>{goalTitle(item.key)}</Text>
              <Text style={st.goalTileCount}>{open ? t('tracks.tracks_count', { count }) : t('tracks.soon')}</Text>
            </Pressable>
          );
        }}
      />

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
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  title: { color: '#171A1C', fontSize: 28, fontWeight: '900' },
  underline: { width: 44, height: 3, borderRadius: 2, marginTop: 6 },
  subtitle: { color: '#5D686F', fontSize: 13, fontWeight: '600', marginTop: 10 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginTop: 14 },
  searchInput: { flex: 1, color: '#171A1C', fontSize: 15, fontWeight: '600' },

  /* Шапка уровня */
  pathHeader: { flexDirection: 'row', alignItems: 'center' },
  backCircle: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#C9EDFF',
  },
  backCircleText: { color: '#171A1C', fontSize: 24, fontWeight: '900', marginTop: -2 },
  levelTitle: { color: '#171A1C', fontSize: 20, fontWeight: '900' },
  levelSub: { color: '#5D686F', fontSize: 13, fontWeight: '700', marginTop: 2 },
  progressPill: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  progressPillText: { color: '#1AB3FF', fontSize: 13, fontWeight: '900' },

  /* Прогресс-карточка в стиле AI-hub */
  progressCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 12, marginTop: 12 },
  pctCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 4, borderColor: '#59C8FF', alignItems: 'center', justifyContent: 'center' },
  pctText: { color: '#171A1C', fontSize: 12, fontWeight: '900' },
  progressTitle: { color: '#171A1C', fontSize: 16, fontWeight: '900' },
  progressText: { color: '#5D686F', fontSize: 12.5, fontWeight: '600', marginTop: 2 },

  /* Сетки уровней / целей */
  goalsTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  goalsBack: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderBottomWidth: 4, borderColor: '#C9EDFF' },
  goalsSub: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: '#2E5A74' },
  goalsTitle: { fontFamily: 'Nunito_900Black', fontSize: 21, color: '#171A1C' },
  goalTile: { width: '48.4%', flexGrow: 0, padding: 14, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderBottomWidth: 4, borderColor: '#D6EFFC' },
  goalTileIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  goalTileTitle: { fontFamily: 'Nunito_900Black', fontSize: 16, lineHeight: 20, color: '#171A1C', marginTop: 10, minHeight: 40 },
  goalTileCount: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: '#5D686F', marginTop: 2 },
  goalsGrid: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
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
