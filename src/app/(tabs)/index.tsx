import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTracks } from '@/hooks/use-tracks';
import { useDailyLesson } from '@/hooks/use-daily-lesson';
import { useCourses } from '@/hooks/use-courses';
import { TrackCard } from '@/components/tracks/track-card';
import { DailyLessonCard } from '@/components/tracks/daily-lesson-card';
import { MyLanguagesSection } from '@/components/home/MyLanguagesSection';
import { Mascot } from '@/components/onboarding/Mascot';
import { NEON_GLOW, NEON_TEXT, HERO_GRADIENT } from '@/constants/neon';
import type { Course } from '@/types/api';

function SectionTitle({
  label,
  onSeeAll,
}: {
  label: string;
  onSeeAll?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <View className="flex-row items-center">
        <View className="w-1.5 h-6 rounded-full bg-primary mr-2.5" style={NEON_GLOW} />
        <Text className="text-foreground font-black text-xl">{label}</Text>
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} className="active:opacity-70">
          <Text className="text-primary font-bold">See all →</Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * Главный экран после логина.
 * Секции:
 *   1. Daily Lesson — первый урок из daily-track
 *   2. Tracks       — каталог тематических треков (limit 6)
 *   3. Courses      — структурированные курсы (теже моки/API, что и /courses)
 */
export default function HomeScreen() {
  const router = useRouter();
  const daily = useDailyLesson();
  const tracksQuery = useTracks({ limit: 6 });
  const coursesQuery = useCourses({ limit: 4 });

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Neon hero header */}
      <LinearGradient
        colors={HERO_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          borderBottomWidth: 2,
          borderColor: 'rgba(0, 255, 163, 0.25)',
          ...NEON_GLOW,
        }}
      >
        <View className="flex-row items-center justify-between px-5 pt-12 pb-6">
          <View className="flex-1 pr-3">
            <Text className="text-3xl font-black text-primary" style={NEON_TEXT}>
              LingoLearn
            </Text>
            <Text className="text-muted-foreground text-sm mt-1">
              Daily lessons, tracks and structured courses — all in one place.
            </Text>
          </View>
          <Mascot pose="cheering" size={84} />
        </View>
      </LinearGradient>

      {/* === My Languages === */}
      <MyLanguagesSection />

      {/* === Daily Lesson === */}
      <View className="px-4 pt-5">
        <SectionTitle label="🗓️ Daily Lesson" />
        <DailyLessonCard
          track={daily.track ?? undefined}
          lesson={daily.lesson ?? undefined}
          isLoading={daily.isLoading}
        />
      </View>

      {/* === Tracks === */}
      <View className="px-4 pt-6">
        <SectionTitle label="🧭 Tracks" onSeeAll={() => router.push('/(tabs)/tracks')} />

        {tracksQuery.isLoading ? (
          <View className="bg-card/70 rounded-3xl border border-border p-6 items-center" style={NEON_GLOW}>
            <ActivityIndicator size="small" color="#00FFA3" />
          </View>
        ) : tracksQuery.error ? (
          <View className="bg-card/70 rounded-3xl border border-border p-6" style={NEON_GLOW}>
            <Text className="text-muted-foreground text-center">
              Не удалось загрузить треки.
            </Text>
          </View>
        ) : (tracksQuery.data?.tracks?.length ?? 0) === 0 ? (
          <View className="bg-card/70 rounded-3xl border border-border p-6" style={NEON_GLOW}>
            <Text className="text-muted-foreground text-center">
              Треки ещё не настроены — добавь публикованные треки.
            </Text>
          </View>
        ) : (
          (tracksQuery.data?.tracks ?? []).map((track) => (
            <TrackCard key={track.id} track={track} />
          ))
        )}
      </View>

      {/* === Courses === */}
      <View className="px-4 pt-6">
        <SectionTitle label="📚 Courses" onSeeAll={() => router.push('/(tabs)/courses')} />

        {coursesQuery.isLoading ? (
          <View className="bg-card/70 rounded-3xl border border-border p-6 items-center" style={NEON_GLOW}>
            <ActivityIndicator size="small" color="#00FFA3" />
          </View>
        ) : coursesQuery.error ? (
          <View className="bg-card/70 rounded-3xl border border-border p-6" style={NEON_GLOW}>
            <Text className="text-muted-foreground text-center">
              Не удалось загрузить курсы.
            </Text>
          </View>
        ) : !coursesQuery.data || coursesQuery.data.length === 0 ? (
          <View className="bg-card/70 rounded-3xl border border-border p-6" style={NEON_GLOW}>
            <Text className="text-muted-foreground text-center">
              Опубликованных курсов пока нет.
            </Text>
          </View>
        ) : (
          coursesQuery.data.map((c: Course) => (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/(tabs)/courses/${c.id}`)}
              className="bg-card/70 rounded-3xl border border-border p-4 mb-4 active:scale-95"
              style={NEON_GLOW}
            >
              <View className="flex-row items-start">
                <View className="bg-muted rounded-2xl w-16 h-16 items-center justify-center mr-3">
                  <Text className="text-3xl">📚</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-black text-base mb-1" numberOfLines={2}>
                    {c.title}
                  </Text>
                  <Text className="text-muted-foreground text-sm" numberOfLines={2}>
                    {c.description}
                  </Text>
                  {!!c.level && (
                    <View className="bg-primary/20 self-start px-3 py-1 rounded-full mt-2">
                      <Text className="text-primary font-bold text-xs uppercase">{c.level}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}
