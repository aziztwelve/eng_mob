import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Crown, Medal, Users, UserPlus, Inbox, Search } from 'lucide-react-native';

import { Avatar } from '@/components/ui/avatar';
import { useMyLeaderboard, useMyLeague } from '@/hooks/use-leagues';
import { useFriends, usePendingFriends, useFriendsLeaderboard } from '@/hooks/use-friends';
import { tsToDate } from '@/lib/api-client';

type SocialTab = 'leagues' | 'friends' | 'leaderboard';

/**
 * /social - Социальный хаб (Phase 4 mobile redesign).
 *
 * Top-tabs:
 *   1. Лиги         - сводка моей лиги + топ-5 когорты + Full link
 *   2. Друзья       - список друзей + pending count + Search/Pending/Full
 *   3. Лидерборд    - друзья по XP (top 10) + Full link
 *
 * Все detailed-flows остаются в /leagues/* и /friends/*.
 */
export default function SocialScreen() {
  const [tab, setTab] = useState<SocialTab>('leagues');

  return (
    <>
      <Stack.Screen options={{ title: 'Social' }} />
      <View className="flex-1 bg-background">
        <SocialTopTabs active={tab} onChange={setTab} />
        {tab === 'leagues' && <LeaguesView />}
        {tab === 'friends' && <FriendsView />}
        {tab === 'leaderboard' && <LeaderboardView />}
      </View>
    </>
  );
}

// ============================================================
// Top-tabs
// ============================================================

function SocialTopTabs({
  active,
  onChange,
}: {
  active: SocialTab;
  onChange: (t: SocialTab) => void;
}) {
  const items: { key: SocialTab; label: string; emoji: string }[] = [
    { key: 'leagues', label: 'Лиги', emoji: '👑' },
    { key: 'friends', label: 'Друзья', emoji: '👥' },
    { key: 'leaderboard', label: 'Лидерборд', emoji: '📊' },
  ];
  return (
    <View className="flex-row bg-card border-b-2 border-border px-2 pt-2 pb-2 gap-2">
      {items.map((it) => {
        const isActive = active === it.key;
        return (
          <Pressable
            key={it.key}
            onPress={() => onChange(it.key)}
            className={`flex-1 py-2 rounded-2xl items-center ${
              isActive ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <Text
              className={`font-black text-xs ${
                isActive ? 'text-primary-foreground' : 'text-foreground'
              }`}
            >
              {it.emoji} {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ============================================================
// Leagues view
// ============================================================

function LeaguesView() {
  const router = useRouter();
  const myLeague = useMyLeague();
  const board = useMyLeaderboard();

  const league = board.data?.league ?? myLeague.data?.user_league.league;
  const entries = (board.data?.entries ?? []).slice(0, 5);
  const cycleEnd = board.data?.cycle_end_at ?? myLeague.data?.cycle_end_at;
  const myRank =
    board.data?.my_rank ?? myLeague.data?.user_league.rank_in_cohort ?? 0;
  const myXp =
    board.data?.my_weekly_xp ?? myLeague.data?.user_league.weekly_xp ?? 0;

  if (myLeague.isLoading || board.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#58cc02" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {/* Hero */}
      <View className="bg-card rounded-3xl p-5 border-4 border-border items-center mb-4">
        <Crown size={48} color="#fbbf24" />
        <Text className="text-foreground font-black text-2xl mt-2">
          {league?.name ?? 'Лига'}
        </Text>
        {cycleEnd && (
          <Text className="text-muted-foreground text-sm mt-1">
            До конца: {formatRemaining(cycleEnd)}
          </Text>
        )}
        <View className="flex-row gap-6 mt-4">
          <View className="items-center">
            <Text className="text-primary font-black text-2xl">#{myRank || '—'}</Text>
            <Text className="text-muted-foreground text-xs uppercase">Ранк</Text>
          </View>
          <View className="items-center">
            <Text className="text-amber-500 font-black text-2xl">{myXp}</Text>
            <Text className="text-muted-foreground text-xs uppercase">XP</Text>
          </View>
        </View>
      </View>

      {/* Top 5 of cohort */}
      <View className="bg-card rounded-3xl p-4 border-4 border-border mb-4">
        <Text className="text-foreground font-black text-base mb-3">
          Топ когорты
        </Text>
        {entries.length === 0 ? (
          <Text className="text-muted-foreground">Пока пусто.</Text>
        ) : (
          entries.map((e, idx) => (
            <View
              key={e.user_id}
              className={`flex-row items-center py-2 ${
                idx < entries.length - 1 ? 'border-b border-border' : ''
              } ${e.is_me ? 'bg-primary/10 -mx-2 px-2 rounded-xl' : ''}`}
            >
              <Text className="text-foreground font-black w-8">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
              </Text>
              <Avatar uri={e.avatar_url} name={e.full_name} size={32} />
              <Text className="flex-1 ml-3 text-foreground font-bold" numberOfLines={1}>
                {e.full_name || `User ${(e.user_id ?? '').slice(0, 6)}`}
                {e.is_me ? ' (Я)' : ''}
              </Text>
              <Text className="text-amber-500 font-black">
                {(e.weekly_xp ?? 0).toLocaleString('ru')} XP
              </Text>
            </View>
          ))
        )}
      </View>

      <Pressable
        onPress={() => router.push('/leagues')}
        className="bg-primary rounded-2xl py-4 items-center"
      >
        <Text className="text-primary-foreground font-black uppercase">
          Открыть лигу полностью →
        </Text>
      </Pressable>
      <Pressable
        onPress={() => router.push('/leagues/history')}
        className="bg-muted rounded-2xl py-3 items-center mt-2"
      >
        <Text className="text-foreground font-bold">История выступлений</Text>
      </Pressable>
    </ScrollView>
  );
}

// ============================================================
// Friends view
// ============================================================

function FriendsView() {
  const router = useRouter();
  const friends = useFriends({ limit: 10 });
  const incoming = usePendingFriends({ direction: 'incoming', limit: 1 });
  const incomingCount = incoming.data?.total ?? 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {/* Action cards */}
      <View className="flex-row gap-3 mb-4">
        <ActionCard
          emoji="🔍"
          label="Найти"
          icon={<Search size={20} color="#58cc02" />}
          onPress={() => router.push('/friends/search')}
        />
        <ActionCard
          emoji="📥"
          label="Заявки"
          badge={incomingCount}
          icon={<Inbox size={20} color="#58cc02" />}
          onPress={() => router.push('/friends/pending')}
        />
      </View>

      <View className="bg-card rounded-3xl p-4 border-4 border-border">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-foreground font-black text-base">
            Мои друзья
          </Text>
          <Pressable onPress={() => router.push('/friends')}>
            <Text className="text-primary font-bold">Все →</Text>
          </Pressable>
        </View>

        {friends.isLoading ? (
          <ActivityIndicator color="#58cc02" />
        ) : (friends.data?.friends?.length ?? 0) === 0 ? (
          <View className="items-center py-8">
            <Users size={48} color="#666" />
            <Text className="text-muted-foreground mt-2 text-center">
              Друзей пока нет.
            </Text>
            <Pressable
              onPress={() => router.push('/friends/search')}
              className="bg-primary rounded-2xl py-3 px-6 mt-3 flex-row items-center gap-2"
            >
              <UserPlus size={18} color="#fff" />
              <Text className="text-primary-foreground font-black">Найти друзей</Text>
            </Pressable>
          </View>
        ) : (
          (friends.data?.friends ?? []).map((f, idx, arr) => (
            <View
              key={f.user_id}
              className={`flex-row items-center py-2 ${
                idx < arr.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <Avatar
                uri={f.avatar_url}
                name={f.full_name || f.username}
                size={36}
              />
              <View className="flex-1 ml-3">
                <Text className="text-foreground font-bold" numberOfLines={1}>
                  {f.full_name ||
                    f.username ||
                    `User ${(f.user_id ?? '').slice(0, 6)}`}
                </Text>
                {(f.weekly_xp ?? 0) > 0 && (
                  <Text className="text-muted-foreground text-xs">
                    {(f.weekly_xp ?? 0).toLocaleString('ru')} XP за неделю
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function ActionCard({
  emoji,
  label,
  icon,
  badge,
  onPress,
}: {
  emoji: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 bg-card rounded-2xl p-4 border-2 border-border items-center active:scale-95"
    >
      <View className="relative">
        {icon ?? <Text className="text-3xl">{emoji}</Text>}
        {!!badge && badge > 0 && (
          <View className="absolute -top-1 -right-2 bg-destructive rounded-full min-w-5 h-5 px-1 items-center justify-center">
            <Text className="text-white font-black text-xs">{badge}</Text>
          </View>
        )}
      </View>
      <Text className="text-foreground font-black mt-2">{label}</Text>
    </Pressable>
  );
}

// ============================================================
// Leaderboard view (friends-based)
// ============================================================

function LeaderboardView() {
  const router = useRouter();
  const board = useFriendsLeaderboard(10);

  if (board.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#58cc02" />
      </View>
    );
  }

  const entries = board.data?.entries ?? [];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View className="bg-card rounded-3xl p-5 border-4 border-border items-center mb-4">
        <Medal size={40} color="#fbbf24" />
        <Text className="text-foreground font-black text-xl mt-2">
          Лидерборд друзей
        </Text>
        <Text className="text-muted-foreground text-xs">По общему XP</Text>
      </View>

      <View className="bg-card rounded-3xl p-4 border-4 border-border mb-4">
        {entries.length === 0 ? (
          <View className="items-center py-6">
            <Text className="text-muted-foreground">Добавь друзей, чтобы соревноваться.</Text>
            <Pressable
              onPress={() => router.push('/friends/search')}
              className="bg-primary rounded-2xl py-3 px-6 mt-3"
            >
              <Text className="text-primary-foreground font-black">Найти друзей</Text>
            </Pressable>
          </View>
        ) : (
          entries.map((e, idx) => (
            <View
              key={e.user_id}
              className={`flex-row items-center py-2 ${
                idx < entries.length - 1 ? 'border-b border-border' : ''
              } ${e.is_me ? 'bg-primary/10 -mx-2 px-2 rounded-xl' : ''}`}
            >
              <Text className="text-foreground font-black w-8">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
              </Text>
              <Avatar uri={e.avatar_url} name={e.full_name || e.username} size={32} />
              <Text className="flex-1 ml-3 text-foreground font-bold" numberOfLines={1}>
                {e.full_name ||
                  e.username ||
                  `User ${(e.user_id ?? '').slice(0, 6)}`}
                {e.is_me ? ' (Я)' : ''}
              </Text>
              <Text className="text-amber-500 font-black">
                {(e.weekly_xp ?? 0).toLocaleString('ru')} XP
              </Text>
            </View>
          ))
        )}
      </View>

      {entries.length > 0 && (
        <Pressable
          onPress={() => router.push('/friends/leaderboard')}
          className="bg-primary rounded-2xl py-4 items-center"
        >
          <Text className="text-primary-foreground font-black uppercase">
            Полный лидерборд →
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

// ============================================================
// Helpers
// ============================================================

function formatRemaining(ts: unknown): string {
  const end = tsToDate(ts as never);
  if (!end) return '—';
  const diffMs = end.getTime() - Date.now();
  if (diffMs <= 0) return 'завершено';
  const days = Math.floor(diffMs / (24 * 3600 * 1000));
  const hours = Math.floor((diffMs % (24 * 3600 * 1000)) / (3600 * 1000));
  if (days > 0) return `${days}д ${hours}ч`;
  const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
  return `${hours}ч ${mins}м`;
}
