import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Gem,
  History,
  Minus,
} from 'lucide-react-native';

import { useLeagueHistory, useLeaguesCatalog } from '@/hooks/use-leagues';
import { tsToDate } from '@/lib/api-client';
import type { League, LeagueHistoryEntry } from '@/types/api';

const PAGE_SIZE = 20;

/**
 * /leagues/history — история выступлений в лигах с пагинацией
 * (mirror web /leagues/history). Каждая запись = (user, week).
 */
export default function LeagueHistoryScreen() {
  const [offset, setOffset] = useState(0);

  const history = useLeagueHistory({ limit: PAGE_SIZE, offset });
  const catalog = useLeaguesCatalog();

  const leaguesById = new Map<number, League>();
  for (const l of catalog.data?.leagues ?? []) {
    leaguesById.set(l.id, l);
  }

  const entries = history.data?.entries ?? [];
  const total = history.data?.total ?? 0;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'История лиг' }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 self-start active:opacity-60"
        >
          <ArrowLeft size={16} color="#9ca3af" />
          <Text className="text-muted-foreground font-bold">К лигам</Text>
        </Pressable>

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <History size={28} color="#58cc02" />
            <Text className="text-foreground font-black text-3xl">
              История лиг
            </Text>
          </View>
          <Text className="text-muted-foreground font-medium">
            Все ваши еженедельные итоги: финальное место, заработанные XP и
            gems, переходы между лигами.
          </Text>
        </View>

        {history.isLoading ? (
          <View className="bg-card rounded-3xl border-4 border-border p-12 items-center justify-center">
            <ActivityIndicator color="#58cc02" />
          </View>
        ) : entries.length === 0 ? (
          <View className="bg-card rounded-3xl border-4 border-border p-8 items-center gap-2">
            <History size={42} color="#9ca3af" />
            <Text className="text-foreground font-black text-xl">
              Истории пока нет
            </Text>
            <Text className="text-muted-foreground font-medium text-center">
              Завершите первый еженедельный цикл, и итог появится здесь.
            </Text>
          </View>
        ) : (
          <>
            <View className="gap-3">
              {entries.map((e) => (
                <HistoryRow
                  key={e.id}
                  entry={e}
                  league={leaguesById.get(e.league_id)}
                />
              ))}
            </View>
            <Pagination
              total={total}
              offset={offset}
              pageSize={PAGE_SIZE}
              onChange={setOffset}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ----------------------------------------------------------------------------
// Row
// ----------------------------------------------------------------------------

function HistoryRow({
  entry,
  league,
}: {
  entry: LeagueHistoryEntry;
  league?: League;
}) {
  const accent = league?.color || '#94a3b8';
  const startDate = tsToDate(entry.cycle_start_at);
  const endDate = tsToDate(entry.cycle_end_at);

  return (
    <View
      className="bg-card rounded-2xl p-4"
      style={{ borderWidth: 4, borderColor: `${accent}88` }}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            borderWidth: 4,
            borderColor: accent,
            backgroundColor: `${accent}22`,
          }}
        >
          <Text
            className="font-black tabular-nums text-base"
            style={{ color: accent }}
          >
            #{entry.final_rank}
          </Text>
        </View>

        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text className="text-foreground font-black text-base flex-shrink" numberOfLines={1}>
              {league?.name ?? `League ${entry.league_id}`}
            </Text>
            <Outcome promoted={entry.promoted} demoted={entry.demoted} />
          </View>
          <Text className="text-muted-foreground font-medium text-xs mt-0.5">
            {formatPeriod(startDate, endDate)}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-foreground font-black tabular-nums">
            {entry.final_xp.toLocaleString('ru')}{' '}
            <Text className="text-muted-foreground font-bold text-xs">XP</Text>
          </Text>
          {entry.gems_earned > 0 && (
            <View className="flex-row items-center gap-1 mt-1">
              <Gem size={14} color="#06b6d4" />
              <Text className="text-cyan-500 font-bold text-sm">
                +{entry.gems_earned}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function Outcome({
  promoted,
  demoted,
}: {
  promoted: boolean;
  demoted: boolean;
}) {
  if (promoted) {
    return (
      <View className="flex-row items-center gap-1 bg-emerald-500 rounded-lg px-2 py-0.5">
        <ArrowUp size={12} color="#fff" />
        <Text className="text-white font-bold text-[10px] uppercase tracking-wider">
          Промо
        </Text>
      </View>
    );
  }
  if (demoted) {
    return (
      <View className="flex-row items-center gap-1 bg-rose-500 rounded-lg px-2 py-0.5">
        <ArrowDown size={12} color="#fff" />
        <Text className="text-white font-bold text-[10px] uppercase tracking-wider">
          Демо
        </Text>
      </View>
    );
  }
  return (
    <View className="flex-row items-center gap-1 border-2 border-border rounded-lg px-2 py-0.5">
      <Minus size={12} color="#9ca3af" />
      <Text className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
        Остались
      </Text>
    </View>
  );
}

function formatPeriod(start: Date | null, end: Date | null): string {
  if (!start || !end) return '';
  const fmt = new Intl.DateTimeFormat('ru', {
    day: 'numeric',
    month: 'short',
  });
  const year = end.getFullYear();
  return `${fmt.format(start)} – ${fmt.format(end)} ${year}`;
}

// ----------------------------------------------------------------------------
// Pagination
// ----------------------------------------------------------------------------

function Pagination({
  total,
  offset,
  pageSize,
  onChange,
}: {
  total: number;
  offset: number;
  pageSize: number;
  onChange: (next: number) => void;
}) {
  const page = Math.floor(offset / pageSize) + 1;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = offset > 0;
  const canNext = offset + pageSize < total;

  return (
    <View className="flex-row items-center justify-between gap-3">
      <Pressable
        disabled={!canPrev}
        onPress={() => onChange(Math.max(0, offset - pageSize))}
        className={`bg-card rounded-2xl border-2 border-border px-4 py-2 ${
          canPrev ? 'active:opacity-80' : 'opacity-40'
        }`}
      >
        <Text className="text-foreground font-bold">← Назад</Text>
      </Pressable>
      <Text className="text-muted-foreground font-medium text-sm tabular-nums">
        Стр. {page} из {pages}
      </Text>
      <Pressable
        disabled={!canNext}
        onPress={() => onChange(offset + pageSize)}
        className={`bg-card rounded-2xl border-2 border-border px-4 py-2 ${
          canNext ? 'active:opacity-80' : 'opacity-40'
        }`}
      >
        <Text className="text-foreground font-bold">Вперёд →</Text>
      </Pressable>
    </View>
  );
}
