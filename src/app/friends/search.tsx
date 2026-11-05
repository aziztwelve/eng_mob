import { KeyboardLift } from '@/components/keyboard-lift';
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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
          text1: t('friends.added_toast', { name: friendDisplayName(f) }),
          text2: t('friends.auto_accepted'),
        });
      } else {
        Toast.show({ type: 'success', text1: t('common.request_sent') });
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('common.send_failed'),
        text2: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const list = results.data?.users ?? [];
  const trimmed = debounced.trim();

  return (
    <View className="flex-1 bg-transparent">
      <Stack.Screen options={{ title: t('friends.search') }} />
      <KeyboardLift>
<ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 self-start active:opacity-60"
        >
          <ArrowLeft size={16} color="#5D686F" />
          <Text className="text-mieo-body font-nunito-bold">{t('friends.to_friends')}</Text>
        </Pressable>

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Search size={28} color="#2FA8E6" />
            <Text className="text-mieo-heading font-nunito-black text-3xl">{t('friends.search')}</Text>
          </View>
          <Text className="text-mieo-body font-nunito-medium">
            {t('friends.search_desc')}
          </Text>
        </View>

        {/* Input */}
        <View className="bg-mieo-surface rounded-2xl border-2 border-mieo-stroke flex-row items-center gap-2 px-3">
          <Search size={18} color="#5D686F" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('friends.search_ph')}
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            autoCorrect={false}
            className="flex-1 text-mieo-heading font-nunito-medium"
            style={{ paddingVertical: 14, color: '#171A1C' }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} className="active:opacity-60">
              <X size={18} color="#5D686F" />
            </Pressable>
          )}
        </View>

        {/* Results */}
        {trimmed.length < 2 ? (
          <View className="bg-mieo-surface rounded-3xl border-[1.5px] border-b-4 border-mieo-stroke p-8 items-center gap-2">
            <Text className="text-mieo-heading font-nunito-black text-xl">
              {t('friends.min_chars')}
            </Text>
            <Text className="text-mieo-body font-nunito-medium text-center">
              {t('friends.prefix_hint')}
            </Text>
          </View>
        ) : results.isLoading ? (
          <View className="bg-mieo-surface rounded-3xl border-[1.5px] border-b-4 border-mieo-stroke p-12 items-center">
            <ActivityIndicator color="#2FA8E6" />
          </View>
        ) : list.length === 0 ? (
          <View className="bg-mieo-surface rounded-3xl border-[1.5px] border-b-4 border-mieo-stroke p-8 items-center gap-2">
            <Text className="text-mieo-heading font-nunito-black text-xl">
              {t('friends.nobody_found')}
            </Text>
            <Text className="text-mieo-body font-nunito-medium text-center">
              {t('friends.nothing_for', { q: trimmed })}
            </Text>
          </View>
        ) : (
          <View className="bg-mieo-surface rounded-3xl border-[1.5px] border-b-4 border-mieo-stroke overflow-hidden">
            {list.map((f, i) => (
              <View
                key={f.user_id}
                className={`px-4 py-3 flex-row items-center gap-3 ${
                  i < list.length - 1 ? 'border-b border-mieo-stroke' : ''
                }`}
              >
                <Avatar uri={f.avatar_url} name={friendDisplayName(f)} size={44} />
                <View className="flex-1 min-w-0">
                  <Text className="text-mieo-heading font-nunito-bold" numberOfLines={1}>
                    {friendDisplayName(f)}
                  </Text>
                  <Text
                    className="text-mieo-body font-nunito-medium text-xs"
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
</KeyboardLift>
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
  const { t } = useTranslation();
  const status = friendshipStatusToShort(friend.friendship_status);

  if (status === 'accepted') {
    return (
      <View className="flex-row items-center gap-1 border-2 border-mieo-stroke rounded-xl px-2 py-1">
        <Check size={12} color="#5D686F" />
        <Text className="text-mieo-body font-nunito-bold text-xs">
          {t('friends.already_friends')}
        </Text>
      </View>
    );
  }
  if (status === 'pending') {
    return (
      <View className="border-2 border-mieo-stroke rounded-xl px-2 py-1">
        <Text className="text-mieo-body font-nunito-bold text-xs">
          {friend.is_incoming ? t('friends.wants_friendship') : t('friends.request_sent_badge')}
        </Text>
      </View>
    );
  }
  if (status === 'blocked') {
    return (
      <View className="border-2 border-rose-500/50 rounded-xl px-2 py-1">
        <Text className="text-rose-400 font-nunito-bold text-xs">{t('friends.blocked')}</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => onSend(friend)}
      disabled={pending}
      className="bg-mieo-primary rounded-xl px-3 py-2 flex-row items-center gap-1 active:opacity-80"
    >
      <UserPlus size={14} color="#1a1a1a" />
      <Text className="text-white font-nunito-bold text-xs">
        {t('friends.add')}
      </Text>
    </Pressable>
  );
}

function friendDisplayName(f: FriendInfo) {
  if (f.full_name) return f.full_name;
  if (f.username) return f.username;
  return f.user_id.slice(0, 8);
}
