import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, Link } from 'expo-router';
import {
  AlertTriangle,
  Clock,
  Play,
  Sparkles,
  Target,
  TrendingDown,
  ChevronRight,
} from 'lucide-react-native';

import { useSrsStats, useMistakes, useWeakSkills } from '@/hooks/use-srs';
import { NEON_GLOW, NEON_GLOW_STRONG, NEON_TEXT, CTA_GRADIENT } from '@/constants/neon';

/**
 * /practice — лендинг для практики (mirror /practice в web).
 *
 * Показывает SRS-stats (сколько карточек ждёт повторения), быстрые
 * ссылки на ошибки и weak-навыки, и большой CTA «Начать практику» →
 * `/practice/session`.
 */
export default function PracticeLandingScreen() {
  const stats = useSrsStats();
  const mistakes = useMistakes({ resolved: 'unresolved', limit: 1 });
  const weakSkills = useWeakSkills({ limit: 3 });

  const dueNow = stats.data?.due_now ?? 0;
  const total = stats.data?.total_items ?? 0;
  const unresolvedMistakes = mistakes.data?.total ?? 0;
  const hasWeakSkills = (weakSkills.data?.skills?.length ?? 0) > 0;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Practice' }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Sparkles size={28} color="#00FFA3" />
            <Text className="text-primary font-black text-3xl" style={NEON_TEXT}>
              Практика
            </Text>
          </View>
          <Text className="text-muted-foreground font-medium">
            Закрепляйте материал по алгоритму SM-2: повторяйте просроченные
            карточки, исправляйте ошибки и подкачивайте «ржавеющие» навыки.
          </Text>
        </View>

        {stats.isLoading ? (
          <View className="bg-card/70 rounded-3xl border border-border p-12 items-center justify-center" style={NEON_GLOW}>
            <ActivityIndicator color="#00FFA3" />
          </View>
        ) : total === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Stats card */}
            <View className="bg-card/70 rounded-3xl border border-border p-4 gap-4" style={NEON_GLOW}>
              <View className="flex-row flex-wrap">
                <Stat label="К повторению" value={dueNow} accent="primary" />
                <Stat
                  label="Освоено"
                  value={stats.data?.mastered ?? 0}
                  accent="success"
                />
                <Stat label="В работе" value={stats.data?.learning ?? 0} />
                <Stat label="Новые" value={stats.data?.fresh ?? 0} />
              </View>
              <View className="flex-row items-center justify-between flex-wrap gap-2 pt-2 border-t border-border/40">
                <Text className="text-muted-foreground text-xs font-medium">
                  Всего карточек: {total}
                </Text>
                <Text className="text-muted-foreground text-xs font-medium">
                  Сегодня повторено: {stats.data?.reviewed_today ?? 0}
                </Text>
              </View>
            </View>

            {/* Big CTA */}
            <Link href="/practice/session" asChild>
              <Pressable
                className="rounded-3xl border border-primary/60 p-5 gap-3 active:opacity-90"
                style={[{ backgroundColor: 'rgba(0,255,163,0.06)' }, NEON_GLOW]}
              >
                <View className="flex-row items-center gap-2">
                  <Play size={22} color="#00FFA3" fill="#00FFA3" />
                  <Text className="text-foreground font-black text-2xl">
                    Начать практику
                  </Text>
                </View>
                <Text className="text-muted-foreground font-medium">
                  {dueNow > 0
                    ? `${dueNow} карточек ждут повторения. Микс «просроченные / ошибки / слабые» (50 / 30 / 20).`
                    : 'Просроченных нет — пробежимся по слабым местам и ошибкам.'}
                </Text>
                <LinearGradient
                  colors={CTA_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[{ alignSelf: 'flex-start', borderRadius: 16, marginTop: 4 }, NEON_GLOW_STRONG]}
                >
                  <Text className="text-primary-foreground font-black text-base px-5 py-3">
                    Поехали →
                  </Text>
                </LinearGradient>
              </Pressable>
            </Link>
          </>
        )}

        {/* Quick links */}
        <View className="gap-3">
          <Link href="/practice/mistakes" asChild>
            <Pressable className="bg-card/70 rounded-3xl border border-border p-4 active:opacity-80" style={NEON_GLOW}>
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-2">
                    <AlertTriangle size={18} color="#f97316" />
                    <Text className="text-foreground font-black text-lg">
                      Ошибки
                    </Text>
                  </View>
                  <Text className="text-muted-foreground text-sm font-medium">
                    Шаги, на которых вы запинались
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  {unresolvedMistakes > 0 && (
                    <View className="bg-orange-500 rounded-xl px-3 py-1">
                      <Text className="text-white font-black text-base tabular-nums">
                        {unresolvedMistakes}
                      </Text>
                    </View>
                  )}
                  <ChevronRight size={20} color="#9ca3af" />
                </View>
              </View>
            </Pressable>
          </Link>

          <Link href="/profile/strength" asChild>
            <Pressable className="bg-card/70 rounded-3xl border border-border p-4 active:opacity-80" style={NEON_GLOW}>
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-2">
                    <TrendingDown size={18} color="#f59e0b" />
                    <Text className="text-foreground font-black text-lg">
                      Слабые навыки
                    </Text>
                  </View>
                  <Text className="text-muted-foreground text-sm font-medium">
                    Карта сильных и «ржавеющих» навыков
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  {hasWeakSkills && (
                    <View className="bg-amber-500 rounded-xl px-3 py-1">
                      <Text className="text-white font-black text-base tabular-nums">
                        {weakSkills.data?.skills?.length ?? 0}
                      </Text>
                    </View>
                  )}
                  <ChevronRight size={20} color="#9ca3af" />
                </View>
              </View>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: 'primary' | 'success';
}) {
  const colorClass =
    accent === 'primary'
      ? 'text-primary'
      : accent === 'success'
        ? 'text-emerald-500'
        : 'text-foreground';
  return (
    <View className="w-1/2 py-1">
      <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
        {label}
      </Text>
      <Text className={`text-3xl font-black tabular-nums ${colorClass}`}>
        {value}
      </Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View className="bg-card/70 rounded-3xl border border-border p-8 items-center gap-3" style={NEON_GLOW}>
      <Clock size={48} color="#9ca3af" />
      <Text className="text-foreground font-black text-2xl text-center">
        Карточек пока нет
      </Text>
      <Text className="text-muted-foreground font-medium text-center">
        Пройдите хотя бы один интерактивный шаг (translate, match pairs,
        listening, fill blank, tap words или story) — карточки появятся
        автоматически.
      </Text>
      <Link href="/courses" asChild>
        <Pressable className="bg-primary rounded-2xl px-5 py-3 mt-2 flex-row items-center gap-2 active:opacity-80">
          <Target size={18} color="#ffffff" />
          <Text className="text-primary-foreground font-black">К курсам</Text>
        </Pressable>
      </Link>
    </View>
  );
}
