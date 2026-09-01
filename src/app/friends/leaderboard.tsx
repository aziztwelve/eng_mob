import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Stack, Link, router } from 'expo-router';
import { ArrowLeft, Medal, Trophy, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/avatar';
import { useFriendsLeaderboard } from '@/hooks/use-friends';
import type { LeaderboardFriendEntry } from '@/types/api';

/**
 * /friends/leaderboard — рейтинг среди друзей + self.
 *
 * Backend: GET /api/v1/friends/leaderboard?limit=
 *   sort: weekly_xp DESC, ranks 1..N. Включает self.
 */
export default function FriendsLeaderboardScreen() {
  const { t } = useTranslation();
  const board = useFriendsLeaderboard();
  const entries = board.data?.entries ?? [];

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: t('friends.lb_title') }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 self-start active:opacity-60"
        >
          <ArrowLeft size={16} color="#9ca3af" />
          <Text className="text-muted-foreground font-bold">{t('friends.to_friends')}</Text>
        </Pressable>

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Trophy size={28} color="#f59e0b" />
            <Text className="text-foreground font-black text-3xl">
              {t('friends.lb_title')}
            </Text>
          </View>
          <Text className="text-muted-foreground font-medium">
            {t('friends.lb_desc')}
          </Text>
        </View>

        {board.isLoading ? (
          <View className="bg-card rounded-3xl border-4 border-border p-12 items-center">
            <ActivityIndicator color="#00FFA3" />
          </View>
        ) : entries.length === 0 ? (
          <View className="bg-card rounded-3xl border-4 border-border p-8 items-center gap-3">
            <Users size={42} color="#9ca3af" />
            <Text className="text-foreground font-black text-xl">{t('friends.lb_empty')}</Text>
            <Text className="text-muted-foreground font-medium text-center">
              {t('friends.lb_empty_desc')}
            </Text>
            <Link href="/friends/search" asChild>
              <Pressable className="bg-primary rounded-2xl px-5 py-3 mt-2 active:opacity-80">
                <Text className="text-primary-foreground font-black">
                  {t('friends.find_friends')}
                </Text>
              </Pressable>
            </Link>
          </View>
        ) : (
          <View className="bg-card rounded-3xl border-4 border-border overflow-hidden">
            {entries.map((e, i) => (
              <Row
                key={e.user_id}
                entry={e}
                isLast={i === entries.length - 1}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Row({
  entry,
  isLast,
}: {
  entry: LeaderboardFriendEntry;
  isLast: boolean;
}) {
  const { t } = useTranslation();
  const isTop3 = entry.rank <= 3;
  const name = displayName(entry);

  return (
    <View
      className={`flex-row items-center gap-3 px-4 py-3 ${
        entry.is_me ? 'bg-primary/10' : ''
      } ${!isLast ? 'border-b border-border' : ''}`}
    >
      <View className="w-10 items-center justify-center">
        {isTop3 ? (
          <Medal
            size={26}
            color={
              entry.rank === 1
                ? '#f59e0b'
                : entry.rank === 2
                ? '#9ca3af'
                : '#f97316'
            }
          />
        ) : (
          <View className="border-2 border-border rounded-xl px-2 py-1 min-w-[36px] items-center">
            <Text className="text-foreground font-black tabular-nums">
              {entry.rank}
            </Text>
          </View>
        )}
      </View>

      <Avatar uri={entry.avatar_url} name={name} size={44} />

      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-2">
          <Text
            className="text-foreground font-bold flex-shrink"
            numberOfLines={1}
          >
            {name}
          </Text>
          {entry.is_me && (
            <Text className="text-primary font-black text-xs">{t('friends.you')}</Text>
          )}
        </View>
        <Text
          className="text-muted-foreground font-medium text-xs"
          numberOfLines={1}
        >
          {entry.username ? `@${entry.username}` : '—'}
        </Text>
      </View>

      <View>
        <Text className="text-foreground font-black tabular-nums text-right">
          {entry.weekly_xp.toLocaleString('ru')}
        </Text>
        <Text className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider text-right">
          XP
        </Text>
      </View>
    </View>
  );
}

function displayName(e: LeaderboardFriendEntry) {
  if (e.full_name) return e.full_name;
  if (e.username) return e.username;
  return e.user_id.slice(0, 8);
}
