import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  ArrowLeft,
  Bot,
  MessageSquarePlus,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { QuotaWidget, hasQuotaLeft } from '@/components/ai/quota-widget';
import {
  useAIConversations,
  useAIQuota,
  useDeleteConversation,
  useStartConversation,
} from '@/hooks/use-ai';
import type { AIConversation } from '@/types/api';

import { AI_TARGET_LANGS, DEFAULT_TARGET_LANG } from '@/lib/ai-languages';
import { LangPills } from '@/components/ai/lang-pills';

/**
 * /ai/chat — список конверсаций + кнопка «Новый чат» (free_chat scenario).
 * Roleplay-конкретные сценарии — на /ai/roleplay.
 */
export default function ChatListScreen() {
  const [targetLang, setTargetLang] = useState(DEFAULT_TARGET_LANG);

  const list = useAIConversations({ limit: 50 });
  const quota = useAIQuota();
  const startMut = useStartConversation();
  const deleteMut = useDeleteConversation();

  const conversations = list.data?.conversations ?? [];
  const canChat = hasQuotaLeft(quota.data, 'chat');

  const handleNew = async () => {
    if (!canChat) return;
    try {
      const resp = await startMut.mutateAsync({
        scenario: 'free_chat',
        target_language: targetLang,
      });
      router.push(`/ai/chat/${resp.conversation.id}`);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Не удалось начать',
        text2: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Удалить диалог', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMut.mutateAsync(id);
            Toast.show({ type: 'success', text1: 'Диалог удалён' });
          } catch (err) {
            Toast.show({
              type: 'error',
              text1: 'Не удалось удалить',
              text2: err instanceof Error ? err.message : undefined,
            });
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Свободный чат' }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 self-start active:opacity-60"
        >
          <ArrowLeft size={16} color="#9ca3af" />
          <Text className="text-muted-foreground font-bold">К AI hub</Text>
        </Pressable>

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Sparkles size={28} color="#00FFA3" />
            <Text className="text-foreground font-black text-3xl">
              Свободный чат
            </Text>
          </View>
          <Text className="text-muted-foreground font-medium">
            Поговорите с AI на изучаемом языке. Каждое сообщение оценивается
            на грамматические ошибки.
          </Text>
        </View>

        <QuotaWidget compact />

        {/* Новый чат */}
        <View className="bg-primary/5 rounded-3xl border-4 border-primary/30 p-4 gap-3">
          <View className="flex-row items-center gap-2">
            <MessageSquarePlus size={20} color="#00FFA3" />
            <Text className="text-foreground font-black text-lg">
              Новый чат
            </Text>
          </View>

          <View className="gap-2">
            <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
              Язык
            </Text>
            <LangPills
              options={AI_TARGET_LANGS}
              value={targetLang}
              onChange={setTargetLang}
              variant="full"
            />
          </View>

          <Pressable
            onPress={handleNew}
            disabled={!canChat || startMut.isPending}
            className={`rounded-2xl px-4 py-3 flex-row items-center justify-center gap-2 ${
              canChat && !startMut.isPending
                ? 'bg-primary active:opacity-80'
                : 'bg-muted opacity-60'
            }`}
          >
            {startMut.isPending ? (
              <ActivityIndicator size="small" color="#1a1a1a" />
            ) : (
              <MessageSquarePlus size={18} color="#1a1a1a" />
            )}
            <Text className="text-primary-foreground font-black">
              Начать
            </Text>
          </Pressable>

          {!canChat && (
            <Text className="text-destructive font-medium text-sm">
              Лимит чатов на сегодня исчерпан. Сбрасывается завтра.
            </Text>
          )}
        </View>

        {/* История */}
        <View className="gap-2">
          <Text className="text-foreground font-black text-lg">История</Text>

          {list.isLoading ? (
            <View className="bg-card rounded-3xl border-4 border-border p-12 items-center">
              <ActivityIndicator color="#00FFA3" />
            </View>
          ) : conversations.length === 0 ? (
            <View className="bg-card rounded-3xl border-4 border-border p-8 items-center gap-2">
              <Bot size={42} color="#9ca3af" />
              <Text className="text-foreground font-black text-xl">
                Пока пусто
              </Text>
              <Text className="text-muted-foreground font-medium text-center">
                Начните первый диалог кнопкой выше.
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {conversations.map((c) => (
                <ConversationRow
                  key={c.id}
                  conv={c}
                  onPress={() => router.push(`/ai/chat/${c.id}`)}
                  onDelete={() => handleDelete(c.id)}
                  deleting={deleteMut.isPending}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function ConversationRow({
  conv,
  onPress,
  onDelete,
  deleting,
}: {
  conv: AIConversation;
  onPress: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const isRoleplay = conv.scenario.startsWith('roleplay_');
  const isTutor = conv.scenario === 'tutor_qa';
  const tag = isTutor ? 'Tutor' : isRoleplay ? 'Roleplay' : 'Free chat';
  const tagBg = isTutor
    ? 'bg-amber-500/15'
    : isRoleplay
      ? 'bg-rose-500/15'
      : 'bg-primary/15';
  const tagColor = isTutor
    ? 'text-amber-500'
    : isRoleplay
      ? 'text-rose-500'
      : 'text-primary';

  return (
    <View className="bg-card border-2 border-border rounded-2xl p-3 flex-row items-center gap-2">
      <Pressable
        onPress={onPress}
        className="flex-1 min-w-0 active:opacity-70"
      >
        <View className="flex-row items-center gap-2 flex-wrap">
          <Text
            className="text-foreground font-black text-base flex-shrink"
            numberOfLines={1}
          >
            {conv.title || `Чат от ${formatDate(conv.started_at)}`}
          </Text>
          <View className={`rounded-lg px-2 py-0.5 ${tagBg}`}>
            <Text
              className={`font-bold text-[10px] uppercase tracking-wider ${tagColor}`}
            >
              {tag}
            </Text>
          </View>
          {conv.target_language && (
            <View className="bg-muted rounded-lg px-2 py-0.5">
              <Text className="text-foreground font-bold text-[10px] uppercase tracking-wider">
                {conv.target_language}
              </Text>
            </View>
          )}
        </View>
        <Text className="text-muted-foreground font-medium text-xs mt-1">
          {conv.message_count} сообщений
          {conv.last_message_at
            ? ` · ${formatDate(conv.last_message_at)}`
            : ''}
        </Text>
      </Pressable>
      <Pressable
        onPress={onDelete}
        disabled={deleting}
        className="rounded-xl p-2 active:bg-destructive/10"
        accessibilityLabel="Удалить"
      >
        <Trash2 size={16} color="#FF4B7E" />
      </Pressable>
    </View>
  );
}

function formatDate(s?: string): string {
  if (!s) return '';
  try {
    return new Date(s).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return s;
  }
}
