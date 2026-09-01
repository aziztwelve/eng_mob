import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Bell, Check, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { Avatar } from '@/components/ui/avatar';
import {
  useAcceptFriendRequest,
  usePendingFriends,
  useRejectFriendRequest,
} from '@/hooks/use-friends';
import type { FriendInfo } from '@/types/api';
import { useTranslation } from 'react-i18next';

/**
 * /friends/pending — incoming + outgoing friend requests.
 *
 * Backend: GET /api/v1/friends/pending?direction=all
 *   - is_incoming=true  → caller получатель (показываем Accept/Reject)
 *   - is_incoming=false → caller отправитель (показываем Cancel)
 */
export default function FriendsPendingScreen() {
  const { t } = useTranslation();
  const pending = usePendingFriends();
  const accept = useAcceptFriendRequest();
  const reject = useRejectFriendRequest();

  const list = pending.data?.requests ?? [];
  const incoming = list.filter((r) => r.is_incoming);
  const outgoing = list.filter((r) => !r.is_incoming);

  const onAccept = async (f: FriendInfo) => {
    try {
      await accept.mutateAsync(f.friendship_id);
      Toast.show({
        type: 'success',
        text1: t('friends.accepted_toast', { name: friendDisplayName(f) }),
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('common.accept_failed'),
        text2: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const onReject = async (f: FriendInfo, isOutgoing = false) => {
    try {
      await reject.mutateAsync(f.friendship_id);
      Toast.show({
        type: 'success',
        text1: isOutgoing ? t('friends.request_cancelled') : t('friends.request_rejected'),
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('common.update_failed'),
        text2: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: t('friends.requests') }} />
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
            <Bell size={28} color="#36E3FF" />
            <Text className="text-foreground font-black text-3xl">{t('friends.requests')}</Text>
          </View>
          <Text className="text-muted-foreground font-medium">
            {t('friends.requests_desc')}
          </Text>
        </View>

        {pending.isLoading ? (
          <View className="bg-card rounded-3xl border-4 border-border p-12 items-center">
            <ActivityIndicator color="#00FFA3" />
          </View>
        ) : list.length === 0 ? (
          <View className="bg-card rounded-3xl border-4 border-border p-8 items-center gap-2">
            <Text className="text-foreground font-black text-xl">
              {t('friends.no_pending')}
            </Text>
            <Text className="text-muted-foreground font-medium text-center">
              {t('friends.no_pending_desc')}
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {incoming.length > 0 && (
              <Section title={t('friends.incoming')} count={incoming.length}>
                {incoming.map((f, i) => (
                  <Row
                    key={f.friendship_id}
                    friend={f}
                    isLast={i === incoming.length - 1}
                    right={
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => onAccept(f)}
                          disabled={accept.isPending}
                          className="bg-emerald-500 rounded-xl px-3 py-2 flex-row items-center gap-1 active:opacity-80"
                        >
                          <Check size={14} color="#fff" />
                          <Text className="text-white font-bold text-xs">
                            {t('friends.accept')}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => onReject(f)}
                          disabled={reject.isPending}
                          className="bg-card border-2 border-border rounded-xl px-3 py-2 flex-row items-center gap-1 active:opacity-80"
                        >
                          <X size={14} color="#9ca3af" />
                          <Text className="text-muted-foreground font-bold text-xs">
                            {t('friends.reject')}
                          </Text>
                        </Pressable>
                      </View>
                    }
                  />
                ))}
              </Section>
            )}

            {outgoing.length > 0 && (
              <Section title={t('friends.outgoing')} count={outgoing.length}>
                {outgoing.map((f, i) => (
                  <Row
                    key={f.friendship_id}
                    friend={f}
                    isLast={i === outgoing.length - 1}
                    right={
                      <Pressable
                        onPress={() => onReject(f, true)}
                        disabled={reject.isPending}
                        className="bg-card border-2 border-border rounded-xl px-3 py-2 flex-row items-center gap-1 active:opacity-80"
                      >
                        <X size={14} color="#9ca3af" />
                        <Text className="text-muted-foreground font-bold text-xs">
                          {t('friends.cancel_req')}
                        </Text>
                      </Pressable>
                    }
                  />
                ))}
              </Section>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ----------------------------------------------------------------------------

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-card rounded-3xl border-4 border-border overflow-hidden">
      <View className="px-4 py-3 bg-muted/30 flex-row items-center justify-between border-b border-border">
        <Text className="text-foreground font-black">{title}</Text>
        <View className="border-2 border-border rounded-xl px-2 py-0.5">
          <Text className="text-muted-foreground font-bold tabular-nums">
            {count}
          </Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function Row({
  friend,
  isLast,
  right,
}: {
  friend: FriendInfo;
  isLast: boolean;
  right: React.ReactNode;
}) {
  return (
    <View
      className={`px-4 py-3 flex-row items-center gap-3 ${
        !isLast ? 'border-b border-border' : ''
      }`}
    >
      <Avatar uri={friend.avatar_url} name={friendDisplayName(friend)} size={44} />
      <View className="flex-1 min-w-0">
        <Text className="text-foreground font-bold" numberOfLines={1}>
          {friendDisplayName(friend)}
        </Text>
        <Text className="text-muted-foreground font-medium text-xs" numberOfLines={1}>
          {friend.username ? `@${friend.username}` : '—'}
        </Text>
      </View>
      {right}
    </View>
  );
}

function friendDisplayName(f: FriendInfo) {
  if (f.full_name) return f.full_name;
  if (f.username) return f.username;
  return f.user_id.slice(0, 8);
}
