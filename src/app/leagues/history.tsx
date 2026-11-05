import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    <View className="flex-1 bg-transparent">
      <Stack.Screen options={{ title: t('lg.history_title') }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 self-start active:opacity-60"
        >
          <ArrowLeft size={16} color="#5D686F" />
          <Text className="text-mieo-body font-nunito-bold">{t('lg.to_leagues')}</Text>
        </Pressable>

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <History size={28} color="#2FA8E6" />
            <Text className="text-mieo-heading font-nunito-black text-3xl">
              {t('lg.history_title')}
            </Text>
          </View>
          <Text className="text-mieo-body font-nunito-medium">
            {t('lg.history_desc')}
          </Text>
        </View>

        {history.isLoading ? (
          <View className="bg-mieo-surface rounded-3xl border-[1.5px] border-b-4 border-mieo-stroke p-12 items-center justify-center">
            <ActivityIndicator color="#2FA8E6" />
          </View>
        ) : entries.length === 0 ? (
          <View className="bg-mieo-surface rounded-3xl border-[1.5px] border-b-4 border-mieo-stroke p-8 items-center gap-2">
            <History size={42} color="#5D686F" />
            <Text className="text-mieo-heading font-nunito-black text-xl">
              {t('lg.no_history')}
            </Text>
            <Text className="text-mieo-body font-nunito-medium text-center">
              {t('lg.no_history_desc')}
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
  const { t } = useTranslation();
  const accent = league?.color || '#94a3b8';
  const startDate = tsToDate(entry.cycle_start_at);
  const endDate = tsToDate(entry.cycle_end_at);

  return (
    <View
      className="bg-mieo-surface rounded-2xl p-4"
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
            className="font-nunito-black tabular-nums text-base"
            style={{ color: accent }}
          >
            #{entry.final_rank}
          </Text>
        </View>

        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text className="text-mieo-heading font-nunito-black text-base flex-shrink" numberOfLines={1}>
              {league?.name ?? t('lg.league_n', { n: entry.league_id })}
            </Text>
            <Outcome promoted={entry.promoted} demoted={entry.demoted} />
          </View>
          <Text className="text-mieo-body font-nunito-medium text-xs mt-0.5">
            {formatPeriod(startDate, endDate)}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-mieo-heading font-nunito-black tabular-nums">
            {entry.final_xp.toLocaleString('ru')}{' '}
            <Text className="text-mieo-body font-nunito-bold text-xs">XP</Text>
          </Text>
          {entry.gems_earned > 0 && (
            <View className="flex-row items-center gap-1 mt-1">
              <Gem size={14} color="#06b6d4" />
              <Text className="text-cyan-500 font-nunito-bold text-sm">
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
  const { t } = useTranslation();
  if (promoted) {
    return (
      <View className="flex-row items-center gap-1 bg-emerald-500 rounded-lg px-2 py-0.5">
        <ArrowUp size={12} color="#fff" />
        <Text className="text-white font-nunito-bold text-[10px] uppercase tracking-wider">
          {t('lg.promoted')}
        </Text>
      </View>
    );
  }
  if (demoted) {
    return (
      <View className="flex-row items-center gap-1 bg-rose-500 rounded-lg px-2 py-0.5">
        <ArrowDown size={12} color="#fff" />
        <Text className="text-white font-nunito-bold text-[10px] uppercase tracking-wider">
          {t('lg.demoted')}
        </Text>
      </View>
    );
  }
  return (
    <View className="flex-row items-center gap-1 border-2 border-mieo-stroke rounded-lg px-2 py-0.5">
      <Minus size={12} color="#5D686F" />
      <Text className="text-mieo-body font-nunito-bold text-[10px] uppercase tracking-wider">
        {t('lg.stayed')}
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
  const { t } = useTranslation();
  const page = Math.floor(offset / pageSize) + 1;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = offset > 0;
  const canNext = offset + pageSize < total;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Pressable
        disabled={!canPrev}
        onPress={() => onChange(Math.max(0, offset - pageSize))}
        className={`bg-mieo-surface rounded-2xl border-2 border-mieo-stroke px-4 py-2 ${
          canPrev ? 'active:opacity-80' : 'opacity-40'
        }`}
      >
        <Text className="text-mieo-heading font-nunito-bold">{t('lg.prev')}</Text>
      </Pressable>
      <Text className="text-mieo-body font-nunito-medium text-sm tabular-nums">
        {t('lg.page_of', { page, pages })}
      </Text>
      <Pressable
        disabled={!canNext}
        onPress={() => onChange(offset + pageSize)}
        className={`bg-mieo-surface rounded-2xl border-2 border-mieo-stroke px-4 py-2 ${
          canNext ? 'active:opacity-80' : 'opacity-40'
        }`}
      >
        <Text className="text-mieo-heading font-nunito-bold">{t('lg.next')}</Text>
      </Pressable>
    </View>
  );
}
