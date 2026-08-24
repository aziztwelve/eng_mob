import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTracks } from '@/hooks/use-tracks';
import { useOnboardingState } from '@/hooks/use-onboarding';
import { TrackCard } from '@/components/tracks/track-card';
import type { Track, TrackType } from '@/types/api';

const GOLD = ['#FFDF5E', '#FFB338'] as const;
const glass = {
  backgroundColor: 'rgba(255,255,255,0.14)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.22)',
} as const;

const GOALS = [
  { key: 'work', title: 'Работа и карьера', emoji: '💼' },
  { key: 'exam', title: 'Экзамен', emoji: '🎯' },
  { key: 'travel', title: 'Путешествия', emoji: '✈️' },
  { key: 'relocation', title: 'Переезд', emoji: '🏠' },
  { key: 'speaking', title: 'Разговорная практика', emoji: '🗣️' },
  { key: 'study', title: 'Учёба', emoji: '📚' },
  { key: 'social', title: 'Друзья и общение', emoji: '🫂' },
  { key: 'content', title: 'Фильмы и книги', emoji: '🎬' },
  { key: 'listening_shadowing', title: 'Listening & Shadowing', emoji: '🎧' },
] as const;

type GoalKey = typeof GOALS[number]['key'];
const LEGACY_GOAL_ALIASES: Record<string, GoalKey> = {
  education: 'study',
  career: 'work',
  hobby: 'content',
  family: 'social',
  brain: 'listening_shadowing',
};
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

export default function TracksScreen() {
  const params = useLocalSearchParams<{ goal?: string }>();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [trackType, setTrackType] = useState<TrackType | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<GoalKey | null>(null);

  useEffect(() => {
    if (params.goal && GOALS.some((goal) => goal.key === params.goal)) {
      setSelectedGoal(params.goal as GoalKey);
    }
  }, [params.goal]);

  const onboarding = useOnboardingState();
  const language = onboarding.data?.target_language || undefined;

  const { data, isLoading, error } = useTracks({
    search: search || undefined,
    track_type: trackType ?? undefined,
    language,
    level: selectedLevel?.toLowerCase(),
    // API добавляет к трекам выбранной цели универсальные (motivation: []).
    // Они тоже должны быть доступны в каждой цели.
    motivation: selectedGoal ? [selectedGoal] : undefined,
    // На уровне показываем все цели и их треки, а не только первую страницу.
    limit: 100,
  });

  const all = useMemo<Track[]>(() => data?.tracks ?? [], [data?.tracks]);
  const tracksByGoal = useMemo(() => {
    const byGoal = new Map<GoalKey, Track[]>();
    GOALS.forEach(({ key }) => byGoal.set(key, []));

    all.forEach((track) => {
      const goals = (track.motivation ?? []).map((goal) => LEGACY_GOAL_ALIASES[goal] ?? goal);
      const matchingGoals = goals.filter((goal): goal is GoalKey => GOALS.some((item) => item.key === goal));
      matchingGoals.forEach((goal) => byGoal.get(goal)?.push(track));
    });

    return byGoal;
  }, [all]);
  // Сервис также возвращает технические персональные треки других пользователей.
  // В каталоге целей показываем только опубликованные тематические программы.
  const selectedTracks = useMemo(
    () => selectedGoal
      ? (tracksByGoal.get(selectedGoal) ?? []).filter((track) => track.track_type === 'thematic')
      : [],
    [selectedGoal, tracksByGoal],
  );
  const selectedGoalMeta = selectedGoal ? GOALS.find((goal) => goal.key === selectedGoal) : null;

  // Если у цели одна тематическая программа (как у «Путешествий»), не
  // показываем пользователю промежуточный технический контейнер трека.
  useEffect(() => {
    if (selectedLevel && selectedGoal && !isLoading && selectedTracks.length === 1) {
      const track = selectedTracks[0];
      router.replace(`/(tabs)/tracks/${track.code || track.id}?goal=${selectedGoal}` as never);
    }
  }, [isLoading, router, selectedGoal, selectedLevel, selectedTracks]);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Уроки' }} />

      {/* Header */}
      <View style={{ paddingHorizontal: 18, paddingTop: 12 }}>
        <Text style={st.title}>Уроки</Text>
        <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.underline} />
        <View style={[st.levelNode, glass]}>
          <Text style={st.levelNodeText}>
            {selectedLevel ? `${selectedLevel} → ` : ''}Уровень → цель → треки
          </Text>
        </View>
        <Text style={st.subtitle}>
          {selectedGoal ? 'Выбери трек, затем урок' : selectedLevel ? 'Теперь выбери цель обучения' : 'Сначала выбери свой уровень'}
        </Text>

        {selectedLevel && <>
          <Pressable onPress={() => {
            if (selectedGoal) setSelectedGoal(null);
            else setSelectedLevel(null);
            setSearch('');
            setTrackType(null);
          }} style={st.backButton}>
            <Text style={st.backButtonText}>{selectedGoal ? '‹ Все цели' : '‹ Все уровни'}</Text>
          </Pressable>
          {selectedGoal && <View style={[st.search, glass]}>
            <Text style={{ fontSize: 16 }}>🔍</Text>
            <TextInput style={st.searchInput} placeholder="Поиск треков..." placeholderTextColor="rgba(255,255,255,0.5)" value={search} onChangeText={setSearch} />
          </View>}
        </>}
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
      ) : !selectedLevel ? (
        <FlatList
          key="levels-grid"
          data={LEVELS}
          numColumns={2}
          keyExtractor={(levelItem) => levelItem}
          contentContainerStyle={st.goalsGrid}
          columnWrapperStyle={st.goalRow}
          renderItem={({ item: levelItem }) => (
            <Pressable onPress={() => setSelectedLevel(levelItem)} style={[st.goalCard, glass]}>
              <Text style={st.levelEmoji}>{levelItem}</Text>
              <Text style={st.goalTitle}>{levelItem === 'A1' ? 'Начальный' : levelItem === 'C1' ? 'Продвинутый' : 'Уровень CEFR'}</Text>
              <Text style={st.goalCount}>Выбрать уровень</Text>
            </Pressable>
          )}
        />
      ) : !selectedGoal ? (
        <FlatList
          key="goals-grid"
          data={GOALS}
          numColumns={2}
          keyExtractor={(goal) => goal.key}
          contentContainerStyle={st.goalsGrid}
          columnWrapperStyle={st.goalRow}
          renderItem={({ item: goal }) => {
            const count = (tracksByGoal.get(goal.key) ?? []).filter((track) => track.track_type === 'thematic').length;
            return <Pressable onPress={() => setSelectedGoal(goal.key)} style={[st.goalCard, glass]}>
              <Text style={st.goalEmoji}>{goal.emoji}</Text>
              <Text style={st.goalTitle}>{goal.title}</Text>
              <Text style={st.goalCount}>{count ? `${count} треков` : 'Скоро появятся'}</Text>
            </Pressable>;
          }}
        />
      ) : selectedTracks.length === 0 ? (
        <View style={st.center}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>🔍</Text>
          <Text style={st.msg}>Для цели «{selectedGoalMeta?.title}» треков пока нет</Text>
        </View>
      ) : (
        <FlatList
          key={`tracks-${selectedGoal}`}
          data={selectedTracks}
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
  levelNode: { alignSelf: 'flex-start', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginTop: 12 },
  levelNodeText: { color: '#FFE69A', fontSize: 12, fontWeight: '900' },
  levelEmoji: { color: '#FFE69A', fontSize: 34, fontWeight: '900', letterSpacing: 1 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginTop: 14 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '600' },
  backButton: { alignSelf: 'flex-start', marginTop: 14, paddingVertical: 4 },
  backButtonText: { color: '#FFE69A', fontSize: 14, fontWeight: '900' },
  goalsGrid: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 40 },
  goalRow: { gap: 12, marginBottom: 12 },
  goalCard: { flex: 1, minHeight: 142, borderRadius: 20, padding: 16, justifyContent: 'space-between' },
  goalEmoji: { fontSize: 30 },
  goalTitle: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 12 },
  goalCount: { color: 'rgba(255,255,255,0.64)', fontSize: 12, fontWeight: '700', marginTop: 6 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  pillActive: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  pillText: { color: 'rgba(255,255,255,0.85)', fontWeight: '800', fontSize: 13 },
  pillTextActive: { color: '#fff', fontWeight: '800', fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  msg: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10 },
  sectionEyebrow: { color: 'rgba(255,223,94,0.75)', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  sectionCount: { color: 'rgba(255,255,255,0.62)', fontSize: 13, fontWeight: '800' },
  emptyGoal: { color: 'rgba(255,255,255,0.52)', fontSize: 13, fontWeight: '600', marginBottom: 6 },
});
