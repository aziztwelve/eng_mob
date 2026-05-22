import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Stack, Link, router } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  Search,
  Trophy,
  UserMinus,
  Users,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { Avatar } from '@/components/ui/avatar';
import {
  useFriends,
  usePendingFriends,
  useRemoveFriend,
} from '@/hooks/use-friends';
import type { FriendInfo } from '@/types/api';

/**
 * /friends — главный экран Friends. Показывает список accepted-друзей
 * + три большие кнопки навигации в подэкраны (search / pending / leaderboard).
 *
 * Sub-routes в Stack (выбор пользователя):
 *   /friends           — этот экран (accepted-список + actions)
 *   /friends/pending   — incoming / outgoing запросы
 *   /friends/search    — поиск пользователей
 *   /friends/leaderboard — рейтинг среди друзей + self
 */
export default function FriendsScreen() {
  const friends = useFriends();
  const pending = usePendingFriends({ direction: 'incoming', limit: 50 });
  const remove = useRemoveFriend();

  const list = friends.data?.friends ?? [];
  const incomingCount = pending.data?.total ?? 0;

  const onRemove = (f: FriendInfo) => {
    Alert.alert(
      'Удалить из друзей',
      `Удалить ${friendDisplayName(f)} из списка друзей?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove.mutateAsync(f.user_id);
              Toast.show({ type: 'success', text1: 'Удалён из друзей' });
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: 'Не удалось удалить',
                text2: err instanceof Error ? err.message : undefined,
              });
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Друзья' }} />
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
            <Users size={28} color="#58cc02" />
            <Text className="text-foreground font-black text-3xl">Друзья</Text>
          </View>
          <Text className="text-muted-foreground font-medium">
            Добавляйте друзей и сравнивайте прогресс на friends-leaderboard.
          </Text>
        </View>

        {/* Quick actions */}
        <View className="gap-3">
          <Link href="/friends/search" asChild>
            <Pressable className="bg-card rounded-2xl border-4 border-border p-4 flex-row items-center gap-3 active:opacity-80">
              <View className="bg-primary/15 rounded-2xl p-2">
                <Search size={22} color="#58cc02" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-black text-base">
                  Поиск пользователей
                </Text>
                <Text className="text-muted-foreground font-medium text-sm">
                  Найти по username и отправить запрос
                </Text>
              </View>
              <Text className="text-muted-foreground">→</Text>
            </Pressable>
          </Link>

          <Link href="/friends/pending" asChild>
            <Pressable className="bg-card rounded-2xl border-4 border-border p-4 flex-row items-center gap-3 active:opacity-80">
              <View className="bg-secondary/15 rounded-2xl p-2">
                <Bell size={22} color="#1cb0f6" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-black text-base">
                  Запросы
                </Text>
                <Text className="text-muted-foreground font-medium text-sm">
                  Входящие и исходящие
                </Text>
              </View>
              {incomingCount > 0 && (
                <View className="bg-rose-500 rounded-xl px-3 py-1">
                  <Text className="text-white font-black tabular-nums">
                    {incomingCount}
                  </Text>
                </View>
              )}
              <Text className="text-muted-foreground">→</Text>
            </Pressable>
          </Link>

          <Link href="/friends/leaderboard" asChild>
            <Pressable className="bg-card rounded-2xl border-4 border-border p-4 flex-row items-center gap-3 active:opacity-80">
              <View className="bg-amber-500/15 rounded-2xl p-2">
                <Trophy size={22} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-black text-base">
                  Friends Leaderboard
                </Text>
                <Text className="text-muted-foreground font-medium text-sm">
                  Сравните weekly XP среди друзей
                </Text>
              </View>
              <Text className="text-muted-foreground">→</Text>
            </Pressable>
          </Link>
        </View>

        {/* Friends list */}
        <View className="gap-2">
          <Text className="text-foreground font-black text-lg">
            Ваши друзья {friends.data ? `(${friends.data.total})` : ''}
          </Text>

          {friends.isLoading ? (
            <View className="bg-card rounded-3xl border-4 border-border p-12 items-center">
              <ActivityIndicator color="#58cc02" />
            </View>
          ) : list.length === 0 ? (
            <View className="bg-card rounded-3xl border-4 border-border p-8 items-center gap-2">
              <Users size={42} color="#9ca3af" />
              <Text className="text-foreground font-black text-xl">
                Пока нет друзей
              </Text>
              <Text className="text-muted-foreground font-medium text-center">
                Найдите кого-нибудь во вкладке «Поиск» и отправьте запрос.
              </Text>
            </View>
          ) : (
            <View className="bg-card rounded-3xl border-4 border-border overflow-hidden">
              {list.map((f, i) => (
                <View
                  key={f.user_id}
                  className={`px-4 py-3 flex-row items-center gap-3 ${
                    i < list.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <Avatar uri={f.avatar_url} name={friendDisplayName(f)} size={48} />
                  <View className="flex-1 min-w-0">
                    <Text
                      className="text-foreground font-bold"
                      numberOfLines={1}
                    >
                      {friendDisplayName(f)}
                    </Text>
                    <Text
                      className="text-muted-foreground font-medium text-xs"
                      numberOfLines={1}
                    >
                      {f.username ? `@${f.username}` : '—'}
                      {f.weekly_xp > 0
                        ? ` • ${f.weekly_xp.toLocaleString('ru')} XP`
                        : ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => onRemove(f)}
                    disabled={remove.isPending}
                    className="bg-card border-2 border-border rounded-xl px-3 py-2 flex-row items-center gap-1 active:opacity-80"
                  >
                    <UserMinus size={14} color="#9ca3af" />
                    <Text className="text-muted-foreground font-bold text-xs">
                      Удалить
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function friendDisplayName(f: FriendInfo) {
  if (f.full_name) return f.full_name;
  if (f.username) return f.username;
  return f.user_id.slice(0, 8);
}
