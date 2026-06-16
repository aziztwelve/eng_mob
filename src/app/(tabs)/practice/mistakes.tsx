import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';

import { useMistakes } from '@/hooks/use-srs';
import { tsToDate } from '@/lib/api-client';
import type { Mistake, MistakeFilter } from '@/types/api';

const PAGE_SIZE = 20;

const TABS: Array<{ value: MistakeFilter; label: string }> = [
  { value: 'unresolved', label: 'Не исправлены' },
  { value: 'resolved', label: 'Исправлены' },
  { value: 'all', label: 'Все' },
];

/**
 * /practice/mistakes — список ошибок (mirror web mistakes/page).
 *
 * Источник правды — `user_mistakes` в srs-service. Записи отмечаются
 * `is_resolved=TRUE` автоматически при первом корректном ответе на тот же
 * шаг (см. step-validation.recordSRS). Здесь — только просмотр.
 */
export default function MistakesScreen() {
  const [tab, setTab] = useState<MistakeFilter>('unresolved');
  const [page, setPage] = useState(0);

  const onTabChange = (v: MistakeFilter) => {
    setTab(v);
    setPage(0);
  };

  const q = useMistakes({
    resolved: tab,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const list = q.data?.mistakes ?? [];
  const total = q.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Ошибки' }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 self-start active:opacity-60"
        >
          <ArrowLeft size={16} color="#9ca3af" />
          <Text className="text-muted-foreground font-bold">К практике</Text>
        </Pressable>

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <AlertTriangle size={28} color="#f97316" />
            <Text className="text-foreground font-black text-3xl">Ошибки</Text>
          </View>
          <Text className="text-muted-foreground font-medium">
            Шаги, на которых вы запинались. Снимаются автоматически, когда вы
            отвечаете правильно на тот же шаг.
          </Text>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-card rounded-2xl border-2 border-border p-1">
          {TABS.map((t) => {
            const active = tab === t.value;
            return (
              <Pressable
                key={t.value}
                onPress={() => onTabChange(t.value)}
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

        {/* List */}
        {q.isLoading ? (
          <View className="bg-card rounded-3xl border-4 border-border p-12 items-center justify-center">
            <ActivityIndicator color="#FFD84A" />
          </View>
        ) : list.length === 0 ? (
          <View className="bg-card rounded-3xl border-4 border-border p-8 items-center gap-2">
            <Text className="text-foreground font-black text-xl">
              Здесь пусто
            </Text>
            <Text className="text-muted-foreground font-medium text-center">
              {tab === 'unresolved'
                ? 'Все ошибки исправлены — отличная работа!'
                : tab === 'resolved'
                  ? 'Пока нет исправленных ошибок.'
                  : 'У вас ещё нет зарегистрированных ошибок.'}
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {list.map((m) => (
              <MistakeRow key={m.id} mistake={m} />
            ))}
          </View>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-muted-foreground text-xs font-bold tabular-nums">
              Стр. {page + 1} / {totalPages} · всего {total}
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || q.isFetching}
                className={`flex-row items-center bg-card border-2 border-border rounded-2xl px-3 py-2 ${
                  page === 0 || q.isFetching ? 'opacity-40' : 'active:opacity-80'
                }`}
              >
                <ChevronLeft size={16} color="#ffffff" />
                <Text className="text-foreground font-bold text-xs ml-1">
                  Назад
                </Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  setPage((p) => (p + 1 < totalPages ? p + 1 : p))
                }
                disabled={page + 1 >= totalPages || q.isFetching}
                className={`flex-row items-center bg-card border-2 border-border rounded-2xl px-3 py-2 ${
                  page + 1 >= totalPages || q.isFetching
                    ? 'opacity-40'
                    : 'active:opacity-80'
                }`}
              >
                <Text className="text-foreground font-bold text-xs mr-1">
                  Вперёд
                </Text>
                <ChevronRight size={16} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MistakeRow({ mistake }: { mistake: Mistake }) {
  const [expanded, setExpanded] = useState(false);
  const last = tsToDate(mistake.last_made_at ?? null);
  const resolved = mistake.is_resolved;
  const hasAnswer =
    mistake.incorrect_answer &&
    Object.keys(mistake.incorrect_answer).length > 0;

  return (
    <View className="bg-card rounded-2xl border-4 border-border p-4 gap-2">
      <View className="flex-row items-center justify-between flex-wrap gap-2">
        <View className="flex-row items-center gap-2 flex-wrap">
          {resolved ? (
            <View className="flex-row items-center gap-1 bg-emerald-500 rounded-full px-3 py-1">
              <CheckCircle2 size={12} color="#ffffff" />
              <Text className="text-white text-xs font-bold">Исправлено</Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-1 bg-orange-500 rounded-full px-3 py-1">
              <AlertTriangle size={12} color="#ffffff" />
              <Text className="text-white text-xs font-bold">
                Не исправлено
              </Text>
            </View>
          )}
          <Text className="text-muted-foreground text-sm font-bold tabular-nums">
            ×{mistake.times_made}
          </Text>
        </View>
        <Text className="text-muted-foreground text-xs font-bold">
          {last ? last.toLocaleDateString() : '—'}
        </Text>
      </View>

      <Text className="text-muted-foreground text-xs font-mono" numberOfLines={1}>
        step: {mistake.step_id}
      </Text>

      {hasAnswer && (
        <View>
          <Pressable
            onPress={() => setExpanded((e) => !e)}
            className="active:opacity-60"
          >
            <Text className="text-muted-foreground text-xs font-bold">
              {expanded ? '▼ Скрыть ответ' : '▶ Ваш ответ'}
            </Text>
          </Pressable>
          {expanded && (
            <View className="bg-muted rounded-lg p-3 mt-2">
              <Text className="text-foreground text-xs font-mono">
                {JSON.stringify(mistake.incorrect_answer, null, 2)}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
