import React from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StatusBar, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, ChevronRight, History, MessageCircle, Trash2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useAIConversationHistory, useDeleteConversation } from '@/hooks/use-ai';
import type { AIConversation } from '@/types/api';
import { tsToDate } from '@/lib/api-client';

export default function ChatListScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const list = useAIConversationHistory();
  const deleteMut = useDeleteConversation();
  const conversations = [...new Map(
    (list.data?.pages.flatMap(page => page.conversations ?? []) ?? []).map(item => [item.id, item]),
  ).values()];

  const handleDelete = (id: string) => {
    Alert.alert(t('ai.delete_dialog'), t('ai.delete_desc'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMut.mutateAsync(id);
            Toast.show({ type: 'success', text1: t('ai.dialog_deleted') });
          } catch (error) {
            Toast.show({ type: 'error', text1: t('common.delete_failed'), text2: error instanceof Error ? error.message : undefined });
          }
        },
      },
    ]);
  };

  const retry = () => { void list.refetch(); };
  const loadMore = () => {
    if (list.hasNextPage && !list.isFetching && !list.isFetchNextPageError) void list.fetchNextPage();
  };

  return (
    <View className="flex-1 px-5 pt-2">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      <View className="mb-4 flex-row items-center gap-3">
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/ai')}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="h-11 w-11 items-center justify-center rounded-full border border-[#C9EDFF] bg-white"
        >
          <ArrowLeft size={22} color="#247FA8" />
        </Pressable>
        <Text className="flex-1 font-nunito-black text-[26px] text-[#102350]">{t('ai.history_title')}</Text>
      </View>
      <FlatList
        className="flex-1"
        data={conversations}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        refreshControl={<RefreshControl refreshing={list.isRefetching && !list.isFetchingNextPage} onRefresh={retry} tintColor="#1789BD" colors={['#1789BD']} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View className="mb-4 gap-3">
            <Text className="font-nunito-semibold text-sm leading-5 text-[#526879]">{t('ai.history_hint')}</Text>
            {list.isRefetchError && conversations.length > 0 && <RetryCard label={t('common.load_failed')} retry={retry} />}
          </View>
        }
        ListEmptyComponent={list.isPending ? (
          <View className="items-center rounded-[20px] bg-white p-8"><ActivityIndicator color="#1789BD" /></View>
        ) : list.isError ? (
          <RetryCard label={t('common.load_failed')} retry={retry} />
        ) : (
          <View className="items-center gap-3 rounded-[20px] border border-[#C9EDFF] bg-white px-6 py-10">
            <History size={36} color="#1789BD" />
            <Text className="text-center font-nunito-extrabold text-lg text-[#102350]">{t('ai.empty')}</Text>
            <Text className="text-center font-nunito-semibold text-sm leading-5 text-[#526879]">{t('ai.history_empty_hint')}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <ConversationRow
            conv={item}
            locale={i18n.resolvedLanguage}
            onPress={() => router.push(item.scenario === 'free_chat' ? `/free-talk/${item.id}` : `/ai/chat/${item.id}`)}
            onDelete={() => handleDelete(item.id)}
            deleting={deleteMut.isPending}
            deletingThis={deleteMut.isPending && deleteMut.variables === item.id}
          />
        )}
        ListFooterComponent={list.isFetchingNextPage ? (
          <ActivityIndicator className="py-5" color="#1789BD" />
        ) : list.isFetchNextPageError ? (
          <View className="mt-3"><RetryCard label={t('common.load_failed')} retry={() => { void list.fetchNextPage(); }} /></View>
        ) : null}
      />
    </View>
  );
}

function RetryCard({ label, retry }: { label: string; retry: () => void }) {
  const { t } = useTranslation();
  return (
    <View accessibilityRole="alert" className="gap-3 rounded-[20px] border border-[#C9EDFF] bg-white p-5">
      <Text className="font-nunito-bold text-[#B33D3D]">{label}</Text>
      <Pressable onPress={retry} accessibilityRole="button" className="min-h-11 items-center justify-center rounded-full bg-[#EAF8FF] px-4">
        <Text className="font-nunito-extrabold text-[#1789BD]">{t('practice.retry')}</Text>
      </Pressable>
    </View>
  );
}

function ConversationRow({ conv, locale, onPress, onDelete, deleting, deletingThis }: {
  conv: AIConversation;
  locale?: string;
  onPress: () => void;
  onDelete: () => void;
  deleting: boolean;
  deletingThis: boolean;
}) {
  const { t } = useTranslation();
  const tag = conv.scenario === 'tutor_qa' ? 'Tutor' : conv.scenario.startsWith('roleplay_') ? 'Roleplay' : 'Free Talk';
  const title = !conv.title || conv.title === 'Free chat' ? 'Free Talk' : conv.title;
  const date = formatDate(conv.last_message_at || conv.started_at, locale);

  return (
    <View className="flex-row items-center rounded-[20px] border border-[#C9EDFF] bg-white">
      <Pressable onPress={onPress} accessibilityRole="button" className="min-h-[96px] flex-1 flex-row items-center gap-3 py-4 pl-4 pr-2">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-[#EAF8FF]">
          <MessageCircle size={22} color="#1789BD" />
        </View>
        <View className="flex-1 gap-1.5">
          <Text numberOfLines={2} className="font-nunito-extrabold text-base leading-5 text-[#102350]">{title}</Text>
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="font-nunito-bold text-xs text-[#1789BD]">{tag}</Text>
            {conv.target_language && <Text className="font-nunito-bold text-xs text-[#526879]">{conv.target_language.toUpperCase()}</Text>}
          </View>
          <Text className="font-nunito-semibold text-xs leading-4 text-[#526879]">{t('ai.history_messages', { count: conv.message_count ?? 0 })}{date ? ` · ${date}` : ''}</Text>
        </View>
        <ChevronRight size={18} color="#247FA8" />
      </Pressable>
      <Pressable onPress={onDelete} disabled={deleting} accessibilityRole="button" accessibilityLabel={`${t('ai.delete_dialog')}: ${title}`} className="mr-1 h-11 w-11 items-center justify-center">
        {deletingThis ? <ActivityIndicator size="small" color="#526879" /> : <Trash2 size={17} color="#526879" />}
      </Pressable>
    </View>
  );
}

function formatDate(value?: string, locale?: string): string {
  if (!value) return '';
  try {
    const date = tsToDate(value);
    return date?.toLocaleDateString(locale || 'en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) ?? '';
  } catch {
    return '';
  }
}
