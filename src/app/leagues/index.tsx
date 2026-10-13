import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Stack, Link, router } from 'expo-router';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronRight,
  Crown,
  Flame,
  Gem,
  History,
  Medal,
  Sparkles,
  Trophy,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Avatar } from '@/components/ui/avatar';
import { useMyLeaderboard, useMyLeague } from '@/hooks/use-leagues';
import { tsToDate } from '@/lib/api-client';
import type { LeaderboardEntry, League } from '@/types/api';
import { useTranslation } from 'react-i18next';
import { CANDY_GRADIENT, neon } from '@/components/neon-screen';

/**
 * /leagues — главный экран лиг (mirror web /leagues).
 *
 * Композиция:
 *   1. Hero — текущая лига + cycle timer + my rank + my XP
 *   2. Promotion / demotion zone подсказки
 *   3. Leaderboard (топ 30 моей когорты с zone-разметкой + is_me)
 *
 * Backend:
 *   GET /api/v1/leagues/mine             → моя лига + cohort + rank
 *   GET /api/v1/leagues/mine/leaderboard → топ 30
 *
 * Gateway автоматически делает EnsureUserInLeague перед чтением.
 */
export default function LeaguesScreen() {
  const { t } = useTranslation();
  const myLeague = useMyLeague();
  const board = useMyLeaderboard();

  const isLoading = myLeague.isLoading || board.isLoading;
  const isError = myLeague.isError && board.isError;

  const league = board.data?.league ?? myLeague.data?.user_league.league;
  const entries = board.data?.entries ?? [];
  const cycleEnd = board.data?.cycle_end_at ?? myLeague.data?.cycle_end_at;
  const myRank =
    board.data?.my_rank ?? myLeague.data?.user_league.rank_in_cohort ?? 0;
  const myXP =
    board.data?.my_weekly_xp ?? myLeague.data?.user_league.weekly_xp ?? 0;
  const promotionCount = board.data?.promotion_count ?? 0;
  const demotionCount = board.data?.demotion_count ?? 0;

  return (
    <LinearGradient className="flex-1" colors={CANDY_GRADIENT.colors} locations={CANDY_GRADIENT.locations}>
      <Stack.Screen options={{ title: t('social.leagues') }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 self-start active:opacity-60"
        >
          <ArrowLeft size={16} color="#9ca3af" />
          <Text className="text-muted-foreground font-bold">{t('social.back')}</Text>
        </Pressable>

        <View className="flex-row items-start justify-between gap-3 flex-wrap">
          <View className="flex-1 gap-2 min-w-0">
            <View className="flex-row items-center gap-2">
              <Trophy size={28} color="#f59e0b" />
            <Text className="text-white font-black text-4xl tracking-tight">
                Лиги
              </Text>
            </View>
            <Text className="text-muted-foreground font-medium">
              Соревнуйтесь в когорте из 30 человек. Топ 7 → новая лига,
              низ 5 → старая. Цикл — неделя по UTC.
            </Text>
          </View>
          <Link href="/leagues/history" asChild>
            <Pressable className="bg-card rounded-2xl border-2 border-border px-3 py-2 flex-row items-center gap-1 active:opacity-80">
              <History size={16} color="#fff" />
              <Text className="text-foreground font-bold">{t('social.history')}</Text>
            </Pressable>
          </Link>
        </View>

        {isLoading ? (
          <View className="bg-card rounded-3xl border-4 border-border p-12 items-center justify-center">
            <ActivityIndicator color="#00FFA3" />
          </View>
        ) : isError ? (
          <ErrorState />
        ) : (
          <>
              <Hero
              league={league}
              cycleEndAt={cycleEnd}
              myRank={myRank}
              myXP={myXP}
              cohortSize={entries.length}
              promotionCount={promotionCount}
            />

            {(promotionCount > 0 || demotionCount > 0) && (
              <ZoneHints
                promotionCount={promotionCount}
                demotionCount={demotionCount}
                cohortSize={entries.length > 0 ? entries.length : 30}
              />
            )}

            <Leaderboard
              entries={entries}
              promotionCount={promotionCount}
              demotionCount={demotionCount}
            />
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

// ----------------------------------------------------------------------------
// Hero
// ----------------------------------------------------------------------------

function Hero({
  league,
  cycleEndAt,
  myRank,
  myXP,
  cohortSize,
  promotionCount,
}: {
  league?: League;
  cycleEndAt?: string;
  myRank: number;
  myXP: number;
  cohortSize: number;
  promotionCount: number;
}) {
  const accent = league?.color || '#CD7F32';
  return (
    <View className="gap-3">
      <View className="rounded-3xl border border-white/20 bg-white/10 px-5 py-4 flex-row items-center gap-4 overflow-hidden">
        <View className="h-14 w-14 rounded-full border-2 border-pink-400 items-center justify-center bg-violet-950">
          <Flame size={27} color="#FFDF5E" fill="#FF6BBF" />
        </View>
        <View className="flex-1">
          <Text className="text-white/70 font-bold text-xs">Твое место</Text>
          <Text className="text-white font-black text-2xl">#{myRank || '—'} <Text className="text-pink-200 text-base">· {myXP.toLocaleString('ru')} XP</Text></Text>
        </View>
        <View className="items-end gap-1">
          <Text className="text-white/60 text-[10px] font-bold uppercase">Неделя</Text>
          <View className="flex-row gap-1 items-end">
            {[10, 16, 12, 22, 18, 29, 38].map((height, index) => (
              <View key={index} className="w-1.5 rounded-full bg-pink-400" style={{ height }} />
            ))}
          </View>
        </View>
      </View>

      <View className="rounded-[28px] overflow-hidden border" style={{ borderColor: `${accent}AA` }}>
        <LinearGradient colors={['rgba(27,17,83,0.96)', 'rgba(76,16,91,0.88)']} className="p-5 gap-5">
          <View className="flex-row items-center gap-4">
            <View className="h-20 w-20 rounded-3xl items-center justify-center border-2 border-blue-200 bg-blue-600/30">
              <Gem size={42} color="#BEE3FF" fill="#2583FF" />
            </View>
            <View className="flex-1 min-w-0 gap-1">
              <Text className="text-white font-black text-2xl" numberOfLines={1}>{league?.name ?? 'Сапфировая лига'}</Text>
              <View className="flex-row items-center gap-2">
                <CycleTimer endsAt={cycleEndAt} />
                <View className="rounded-full bg-amber-300/15 border border-amber-300/60 px-2 py-1">
                  <Text className="text-amber-200 text-xs font-black">Топ {promotionCount || 10}</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-white/70 font-bold text-sm">До следующей лиги</Text>
              <Text className="text-amber-200 font-black">{Math.max(0, (promotionCount || 10) - myRank)} мест</Text>
            </View>
            <View className="h-3 rounded-full bg-black/35 overflow-hidden">
              <LinearGradient colors={[neon.primary, '#FF6BBF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(12, ((promotionCount || 10) / Math.max(cohortSize || 30, 1)) * 100))}%` }} />
            </View>
            <Text className="text-white/65 text-xs">Топ {promotionCount || 10} проходят в следующую лигу</Text>
          </View>

          <View className="rounded-2xl bg-black/20 px-4 py-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2"><Sparkles size={18} color="#FFDF5E" /><Text className="text-white font-bold">Следующая награда</Text></View>
            <ChevronRight size={20} color="#FFDF5E" />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

function CycleTimer({ endsAt }: { endsAt?: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = useMemo(() => {
    if (!endsAt) return null;
    const end = tsToDate(endsAt);
    if (!end) return null;
    const ms = end.getTime() - now;
    if (ms <= 0) return { d: 0, h: 0, m: 0, ended: true };
    const totalMin = Math.floor(ms / 60000);
    const d = Math.floor(totalMin / (60 * 24));
    const h = Math.floor((totalMin / 60) % 24);
    const m = totalMin % 60;
    return { d, h, m, ended: false };
  }, [endsAt, now]);

  if (!remaining) {
    return (
      <Text className="text-muted-foreground font-medium text-sm">
        Цикл активен
      </Text>
    );
  }
  if (remaining.ended) {
    return (
      <Text className="text-amber-500 font-bold text-sm">
        Подведение итогов скоро…
      </Text>
    );
  }
  return (
    <View>
      <Text className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
        До конца
      </Text>
      <Text className="text-white font-black tabular-nums">
        {remaining.d}д {remaining.h}ч {remaining.m}м
      </Text>
    </View>
  );
}

// ----------------------------------------------------------------------------
// Zone hints
// ----------------------------------------------------------------------------

function ZoneHints({
  promotionCount,
  demotionCount,
  cohortSize,
}: {
  promotionCount: number;
  demotionCount: number;
  cohortSize: number;
}) {
  return (
    <View className="gap-3">
      {promotionCount > 0 && (
        <View
          className="rounded-2xl p-4 flex-row items-center gap-3"
          style={{
            borderWidth: 4,
            borderColor: 'rgba(16,185,129,0.6)',
            backgroundColor: 'rgba(16,185,129,0.08)',
          }}
        >
          <ArrowUp size={22} color="#10b981" />
          <View className="flex-1">
            <Text className="text-emerald-400 font-black">
              Промо-зона: топ {promotionCount}
            </Text>
            <Text className="text-muted-foreground font-medium text-sm">
              Места 1–{promotionCount} переходят в следующую лигу
            </Text>
          </View>
        </View>
      )}
      {demotionCount > 0 && (
        <View
          className="rounded-2xl p-4 flex-row items-center gap-3"
          style={{
            borderWidth: 4,
            borderColor: 'rgba(244,63,94,0.6)',
            backgroundColor: 'rgba(244,63,94,0.08)',
          }}
        >
          <ArrowDown size={22} color="#f43f5e" />
          <View className="flex-1">
            <Text className="text-rose-400 font-black">
              Зона риска: низ {demotionCount}
            </Text>
            <Text className="text-muted-foreground font-medium text-sm">
              Места {cohortSize - demotionCount + 1}–{cohortSize} опустятся в
              предыдущую лигу
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ----------------------------------------------------------------------------
// Leaderboard
// ----------------------------------------------------------------------------

function Leaderboard({

  entries,
  promotionCount,
  demotionCount,
}: {
  entries: LeaderboardEntry[];
  promotionCount: number;
  demotionCount: number;
}) {
  const { t } = useTranslation();
  if (entries.length === 0) {
    return (
      <View className="bg-card rounded-3xl border-4 border-border p-8 items-center">
        <Text className="text-muted-foreground font-medium text-center">
          Когорта пока пуста. Получите XP, чтобы появиться на доске!
        </Text>
      </View>
    );
  }
  const cohortSize = entries.length;
  return (
    <View className="bg-[#250b42]/90 rounded-3xl border border-white/20 overflow-hidden">
      <View className="px-5 py-4 border-b border-white/10 flex-row items-center justify-between">
        <Text className="text-white font-black text-xl">{t('social.top_cohort')}</Text>
        <View className="rounded-full border border-pink-300/50 bg-pink-300/10 px-3 py-1"><Text className="text-pink-100 font-bold text-xs">Рейтинг</Text></View>
      </View>
      {entries.map((e, idx) => (
        <React.Fragment key={e.user_id}>
          <LeaderboardRow entry={e} isPromotion={e.rank <= promotionCount && promotionCount > 0} isDemotion={demotionCount > 0 && e.rank > cohortSize - demotionCount} isLast={idx === entries.length - 1} />
          {promotionCount > 0 && e.rank === promotionCount && idx < entries.length - 1 && (
            <View className="flex-row items-center gap-2 px-4 py-2 bg-emerald-400/10 border-y border-emerald-300/25"><ArrowUp size={14} color="#6EE7B7" /><Text className="text-emerald-200 text-xs font-black">Топ {promotionCount} проходят</Text></View>
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

function LeaderboardRow({
  entry,
  isPromotion,
  isDemotion,
  isLast,
}: {
  entry: LeaderboardEntry;
  isPromotion: boolean;
  isDemotion: boolean;
  isLast: boolean;
}) {
  const isTop3 = entry.rank <= 3;
  const name = entry.full_name || `User ${entry.user_id.slice(0, 6)}`;

  let bg = '';
  if (entry.is_me) bg = 'bg-pink-500/25 border-y border-pink-300/60';
  else if (isPromotion) bg = 'bg-emerald-500/10';
  else if (isDemotion) bg = 'bg-rose-500/10';

  return (
    <View
      className={`flex-row items-center gap-3 px-4 py-3 ${bg} ${
        !isLast ? 'border-b border-border' : ''
      }`}
    >
      <View className="w-8 items-center justify-center">
        {isTop3 ? (
          <Medal
            size={22}
            color={
              entry.rank === 1 ? '#f59e0b' : entry.rank === 2 ? '#9ca3af' : '#b45309'
            }
          />
        ) : (
        <Text className="text-white/70 font-black tabular-nums">
            {entry.rank}
          </Text>
        )}
      </View>

      <Avatar uri={entry.avatar_url} name={name} size={40} />

      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-2">
          <Text
            className="text-white font-bold flex-shrink"
            numberOfLines={1}
          >
            {name}
          </Text>
          {entry.is_me && (
            <View className="bg-pink-300 rounded-lg px-2 py-0.5">
              <Text className="text-violet-950 font-black text-[10px] uppercase tracking-wider">
                Вы
              </Text>
            </View>
          )}
        </View>
      </View>

      <View>
        <Text className="text-white font-black tabular-nums text-right">
          {entry.weekly_xp.toLocaleString('ru')}
        </Text>
        <Text className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider text-right">
          XP
        </Text>
      </View>
    </View>
  );
}

// ----------------------------------------------------------------------------
// Error state
// ----------------------------------------------------------------------------

function ErrorState() {
  return (
    <View className="bg-card rounded-3xl border-4 border-border p-8 items-center gap-3">
      <Trophy size={48} color="#9ca3af" />
      <Text className="text-foreground font-black text-2xl text-center">
        Лиги ещё недоступны
      </Text>
      <Text className="text-muted-foreground font-medium text-center">
        Похоже, social-service не отвечает. Попробуйте позже.
      </Text>
    </View>
  );
}
