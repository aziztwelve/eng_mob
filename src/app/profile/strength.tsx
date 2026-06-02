import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Stack, Link, router } from 'expo-router';
import {
  ArrowLeft,
  Layers,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';

import { useSkillStrengths, useWeakSkills } from '@/hooks/use-srs';
import { tsToDate } from '@/lib/api-client';
import {
  skillTypeShort,
  type SkillDecay,
  type SkillTypeShort,
} from '@/types/api';

type Filter = 'all' | 'module' | 'lesson';

const TABS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'module', label: 'Модули' },
  { value: 'lesson', label: 'Уроки' },
];

/**
 * /profile/strength — карта силы навыков (mirror web).
 *
 * Источник — `user_skill_decay`. course-service создаёт записи через
 * OnLessonCompleted, ежедневный cron в srs-service декрементирует
 * current_strength по decay_rate (default 0.05/day).
 */
export default function StrengthScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const skillType: SkillTypeShort | undefined =
    filter === 'all' ? undefined : filter;

  const weak = useWeakSkills({ skill_type: skillType, limit: 5 });
  const all = useSkillStrengths({ skill_type: skillType, limit: 100 });

  // Сортируем по current_strength ASC — слабые в начале.
  const sorted = useMemo(() => {
    const items = all.data?.skills ?? [];
    return [...items].sort((a, b) => a.current_strength - b.current_strength);
  }, [all.data]);

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Сила навыков' }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 self-start active:opacity-60"
        >
          <ArrowLeft size={16} color="#9ca3af" />
          <Text className="text-muted-foreground font-bold">Назад</Text>
        </Pressable>

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Layers size={28} color="#00FFA3" />
            <Text className="text-foreground font-black text-3xl">
              Сила навыков
            </Text>
          </View>
          <Text className="text-muted-foreground font-medium">
            Каждый завершённый урок и модуль становятся «навыком». Без практики
            навык медленно «ржавеет» (decay) — практикуйтесь, чтобы сохранить
            силу.
          </Text>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-card rounded-2xl border-2 border-border p-1">
          {TABS.map((t) => {
            const active = filter === t.value;
            return (
              <Pressable
                key={t.value}
                onPress={() => setFilter(t.value)}
                className={`flex-1 rounded-xl py-2 items-center ${
                  active ? 'bg-primary' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`font-bold text-xs ${
                    active ? 'text-primary-foreground' : 'text-foreground'
                  }`}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Top weak */}
        <View className="bg-card rounded-3xl border-4 border-border p-4 gap-3">
          <View className="flex-row items-center justify-between flex-wrap gap-2">
            <View className="flex-row items-center gap-2">
              <TrendingDown size={18} color="#f59e0b" />
              <Text className="text-foreground font-black text-lg">
                Слабые навыки
              </Text>
            </View>
            <Link href="/practice/session" asChild>
              <Pressable className="bg-primary rounded-2xl px-4 py-2 active:opacity-80">
                <Text className="text-primary-foreground font-bold text-sm">
                  Подтянуть
                </Text>
              </Pressable>
            </Link>
          </View>
          {weak.isLoading ? (
            <View className="items-center py-4">
              <ActivityIndicator color="#00FFA3" />
            </View>
          ) : (weak.data?.skills?.length ?? 0) === 0 ? (
            <Text className="text-muted-foreground font-medium text-sm">
              Слабых навыков нет — отлично!
            </Text>
          ) : (
            <View className="gap-2">
              {weak.data?.skills?.map((s) => (
                <SkillBar key={`${s.user_id}:${s.skill_id}`} skill={s} />
              ))}
            </View>
          )}
        </View>

        {/* All */}
        <View className="bg-card rounded-3xl border-4 border-border p-4 gap-3">
          <View className="flex-row items-center gap-2">
            <TrendingUp size={18} color="#10b981" />
            <Text className="text-foreground font-black text-lg">
              Все навыки
            </Text>
            {sorted.length > 0 && (
              <Text className="text-muted-foreground font-bold">
                · {sorted.length}
              </Text>
            )}
          </View>

          {all.isLoading ? (
            <View className="items-center py-4">
              <ActivityIndicator color="#00FFA3" />
            </View>
          ) : sorted.length === 0 ? (
            <Text className="text-muted-foreground font-medium text-sm">
              Здесь будут навыки, когда вы пройдёте первый урок.
            </Text>
          ) : (
            <View className="gap-2">
              {sorted.map((s) => (
                <SkillBar key={`${s.user_id}:${s.skill_id}`} skill={s} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function SkillBar({ skill }: { skill: SkillDecay }) {
  const pct = Math.round(
    Math.max(0, Math.min(1, skill.current_strength)) * 100,
  );
  const last = tsToDate(skill.last_practiced_at ?? null);
  const kind = skillTypeShort(skill.skill_type);
  const colorClass =
    pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-1 gap-1.5 min-w-0">
        <View className="flex-row items-center gap-2 flex-wrap">
          {kind && (
            <View className="bg-card border-2 border-border rounded-full px-2 py-0.5">
              <Text className="text-foreground text-[10px] font-bold uppercase">
                {kind === 'module' ? 'Модуль' : 'Урок'}
              </Text>
            </View>
          )}
          <Text
            className="text-muted-foreground text-xs font-mono flex-1"
            numberOfLines={1}
          >
            {skill.skill_id}
          </Text>
        </View>
        <View className="h-3 bg-muted rounded-full overflow-hidden border-2 border-border">
          <View className={`h-full ${colorClass}`} style={{ width: `${pct}%` }} />
        </View>
      </View>
      <View className="items-end">
        <Text className="text-foreground font-black text-lg tabular-nums">
          {pct}%
        </Text>
        <Text className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">
          {last ? last.toLocaleDateString() : '—'}
        </Text>
      </View>
    </View>
  );
}
