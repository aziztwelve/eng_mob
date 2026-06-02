import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Check, Search, UserPlus, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { Avatar } from '@/components/ui/avatar';
import {
  useFriendsSearch,
  useSendFriendRequest,
} from '@/hooks/use-friends';
import {
  friendshipStatusToShort,
  type FriendInfo,
} from '@/types/api';

/**
 * /friends/search — поиск пользователей по username и отправка запроса.
 *
 * Backend: GET /api/v1/friends/search?q=&limit=  (auth-service.SearchByUsername).
 *   Min query length 2.
 *
 * Действие на каждом результате зависит от current friendship_status:
 *   - none      → кнопка «Добавить»
 *   - pending   → бейдж «Запрос отправлен» / «Хочет дружить с вами»
 *   - accepted  → бейдж «Уже друзья»
 *   - blocked   → бейдж «Заблокировано»
 */
export default function FriendsSearchScreen() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  // Debounce 250ms — не дёргаем backend на каждый ввод.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const results = useFriendsSearch(debounced);
  const sendReq = useSendFriendRequest();

  const onSend = async (f: FriendInfo) => {
    try {
      const resp = await sendReq.mutateAsync(f.user_id);
      if (resp.auto_accepted) {
        Toast.show({
          type: 'success',
          text1: `${friendDisplayName(f)} добавлен в друзья`,
          text2: 'Был встречный запрос — авто-принят.',
        });
      } else {
        Toast.show({ type: 'success', text1: 'Запрос отправлен' });
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Не удалось отправить',
        text2: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const list = results.data?.users ?? [];
  const trimmed = debounced.trim();

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Поиск' }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 self-start active:opacity-60"
        >
          <ArrowLeft size={16} color="#9ca3af" />
          <Text className="text-muted-foreground font-bold">К друзьям</Text>
        </Pressable>

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Search size={28} color="#00FFA3" />
            <Text className="text-foreground font-black text-3xl">Поиск</Text>
          </View>
          <Text className="text-muted-foreground font-medium">
            Найдите друзей по username (минимум 2 символа). Поиск по префиксу.
          </Text>
        </View>

        {/* Input */}
        <View className="bg-card rounded-2xl border-2 border-border flex-row items-center gap-2 px-3">
          <Search size={18} color="#9ca3af" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="username…"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            autoCorrect={false}
            className="flex-1 text-foreground font-medium"
            style={{ paddingVertical: 14, color: '#fff' }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} className="active:opacity-60">
              <X size={18} color="#9ca3af" />
            </Pressable>
          )}
        </View>

        {/* Results */}
        {trimmed.length < 2 ? (
          <View className="bg-card rounded-3xl border-4 border-border p-8 items-center gap-2">
            <Text className="text-foreground font-black text-xl">
              Введите хотя бы 2 символа
            </Text>
            <Text className="text-muted-foreground font-medium text-center">
              Поиск работает по префиксу username.
            </Text>
          </View>
        ) : results.isLoading ? (
          <View className="bg-card rounded-3xl border-4 border-border p-12 items-center">
            <ActivityIndicator color="#00FFA3" />
          </View>
        ) : list.length === 0 ? (
          <View className="bg-card rounded-3xl border-4 border-border p-8 items-center gap-2">
            <Text className="text-foreground font-black text-xl">
              Никого не нашли
            </Text>
            <Text className="text-muted-foreground font-medium text-center">
              По запросу «{trimmed}» ничего не найдено.
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
                <Avatar uri={f.avatar_url} name={friendDisplayName(f)} size={44} />
                <View className="flex-1 min-w-0">
                  <Text className="text-foreground font-bold" numberOfLines={1}>
                    {friendDisplayName(f)}
                  </Text>
                  <Text
                    className="text-muted-foreground font-medium text-xs"
                    numberOfLines={1}
                  >
                    {f.username ? `@${f.username}` : '—'}
                  </Text>
                </View>
                <ResultAction friend={f} onSend={onSend} pending={sendReq.isPending} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ResultAction({
  friend,
  onSend,
  pending,
}: {
  friend: FriendInfo;
  onSend: (f: FriendInfo) => void;
  pending: boolean;
}) {
  const status = friendshipStatusToShort(friend.friendship_status);

  if (status === 'accepted') {
    return (
      <View className="flex-row items-center gap-1 border-2 border-border rounded-xl px-2 py-1">
        <Check size={12} color="#9ca3af" />
        <Text className="text-muted-foreground font-bold text-xs">
          Уже друзья
        </Text>
      </View>
    );
  }
  if (status === 'pending') {
    return (
      <View className="border-2 border-border rounded-xl px-2 py-1">
        <Text className="text-muted-foreground font-bold text-xs">
          {friend.is_incoming ? 'Хочет дружить' : 'Запрос отправлен'}
        </Text>
      </View>
    );
  }
  if (status === 'blocked') {
    return (
      <View className="border-2 border-rose-500/50 rounded-xl px-2 py-1">
        <Text className="text-rose-400 font-bold text-xs">Заблокировано</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => onSend(friend)}
      disabled={pending}
      className="bg-primary rounded-xl px-3 py-2 flex-row items-center gap-1 active:opacity-80"
    >
      <UserPlus size={14} color="#1a1a1a" />
      <Text className="text-primary-foreground font-bold text-xs">
        Добавить
      </Text>
    </Pressable>
  );
}

function friendDisplayName(f: FriendInfo) {
  if (f.full_name) return f.full_name;
  if (f.username) return f.username;
  return f.user_id.slice(0, 8);
}
