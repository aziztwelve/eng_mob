import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Bot } from 'lucide-react-native';

import { ChatInput } from '@/components/ai/chat-input';
import { ChatMessage } from '@/components/ai/chat-message';
import { hasQuotaLeft } from '@/components/ai/quota-widget';
import {
  useAIConversation,
  useAIQuota,
  useSendMessage,
} from '@/hooks/use-ai';

/**
 * /ai/chat/[id] — экран одной конверсации (free_chat / roleplay_* / tutor_qa).
 *
 * Авто-скролл к низу при появлении новых сообщений (включая «AI печатает…»).
 * KeyboardAvoidingView для нормального поведения keyboard на iOS.
 */
export default function ChatConversationScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id;

  const conv = useAIConversation(id);
  const quota = useAIQuota();
  const sendMut = useSendMessage(id ?? '');
  const scrollRef = useRef<ScrollView>(null);

  const messages = conv.data?.messages ?? [];
  const conversation = conv.data?.conversation;
  const canChat = hasQuotaLeft(quota.data, 'chat');

  // Auto-scroll on new messages or send-mut state change.
  useEffect(() => {
    // Небольшой timeout — даём message bubble отрендериться.
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(t);
  }, [messages.length, sendMut.isPending]);

  const handleSend = async (content: string, wantAudio: boolean) => {
    try {
      await sendMut.mutateAsync({ content, want_audio: wantAudio });
    } catch (e) {
      console.error('send message failed', e);
    }
  };

  const isRoleplay = conversation?.scenario.startsWith('roleplay_') ?? false;
  const isTutor = conversation?.scenario === 'tutor_qa';

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: conversation?.title?.slice(0, 30) || 'Чат',
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ flex: 1 }}
      >
        <View className="px-3 pt-2 flex-row items-center gap-2">
          <Pressable
            onPress={() => router.back()}
            className="rounded-xl p-2 active:opacity-60"
          >
            <ArrowLeft size={20} color="#fff" />
          </Pressable>
          <View className="flex-1 min-w-0">
            <Text
              className="text-foreground font-black text-base"
              numberOfLines={1}
            >
              {conversation?.title || (conv.isLoading ? 'Загрузка…' : 'Чат')}
            </Text>
            {conversation && (
              <View className="flex-row items-center gap-1 flex-wrap">
                <ScenarioBadge isTutor={isTutor} isRoleplay={isRoleplay} />
                {conversation.target_language && (
                  <View className="bg-muted rounded-lg px-2 py-0.5">
                    <Text className="text-foreground font-bold text-[10px] uppercase tracking-wider">
                      {conversation.target_language}
                    </Text>
                  </View>
                )}
                {conversation.user_level && (
                  <View className="bg-muted rounded-lg px-2 py-0.5">
                    <Text className="text-foreground font-bold text-[10px] uppercase tracking-wider">
                      {conversation.user_level}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            padding: 12,
            paddingTop: 8,
            paddingBottom: 12,
            gap: 12,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {conv.isLoading ? (
            <View className="bg-card rounded-3xl border-4 border-border p-12 items-center">
              <ActivityIndicator color="#58cc02" />
            </View>
          ) : conv.error || !conversation ? (
            <View className="bg-card rounded-3xl border-4 border-border p-8 items-center gap-3">
              <Text className="text-foreground font-black text-lg">
                Диалог не найден
              </Text>
              <Pressable
                onPress={() => router.replace('/ai/chat')}
                className="bg-primary rounded-2xl px-4 py-2 active:opacity-80"
              >
                <Text className="text-primary-foreground font-black">
                  К списку
                </Text>
              </Pressable>
            </View>
          ) : messages.length === 0 ? (
            <View className="bg-card rounded-3xl border-4 border-border p-12 items-center gap-2">
              <Bot size={36} color="#9ca3af" />
              <Text className="text-muted-foreground font-medium text-center">
                Напишите первое сообщение, чтобы начать.
              </Text>
            </View>
          ) : (
            messages.map((m) => <ChatMessage key={m.id} message={m} />)
          )}

          {sendMut.isPending && (
            <View className="flex-row gap-2">
              <View className="w-9 h-9 rounded-2xl bg-card border-2 border-border items-center justify-center">
                <ActivityIndicator size="small" color="#9ca3af" />
              </View>
              <View className="rounded-2xl px-3 py-2 border-2 bg-card border-border self-start">
                <Text className="text-muted-foreground font-medium text-sm">
                  AI печатает…
                </Text>
              </View>
            </View>
          )}

          {sendMut.isError && (
            <View
              className="rounded-2xl px-3 py-2"
              style={{
                borderWidth: 2,
                borderColor: 'rgba(239,68,68,0.3)',
                backgroundColor: 'rgba(239,68,68,0.05)',
              }}
            >
              <Text className="text-destructive font-medium text-sm">
                Не удалось отправить сообщение. Попробуйте ещё раз.
              </Text>
            </View>
          )}
        </ScrollView>

        <View className="px-3 pb-3 pt-1 gap-2 border-t border-border bg-background">
          {!canChat && (
            <View
              className="rounded-2xl px-3 py-2"
              style={{
                borderWidth: 2,
                borderColor: 'rgba(245,158,11,0.3)',
                backgroundColor: 'rgba(245,158,11,0.05)',
              }}
            >
              <Text className="text-amber-500 font-medium text-sm">
                Лимит чатов исчерпан. Откройте новый завтра или перейдите на
                Premium.
              </Text>
            </View>
          )}
          <ChatInput
            onSend={handleSend}
            loading={sendMut.isPending}
            placeholder={
              isRoleplay
                ? 'Отвечайте по сценарию…'
                : 'Напишите сообщение…'
            }
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function ScenarioBadge({
  isTutor,
  isRoleplay,
}: {
  isTutor: boolean;
  isRoleplay: boolean;
}) {
  const tag = isTutor ? 'Tutor' : isRoleplay ? 'Roleplay' : 'Free chat';
  const bg = isTutor
    ? 'bg-amber-500/15'
    : isRoleplay
      ? 'bg-rose-500/15'
      : 'bg-primary/15';
  const color = isTutor
    ? 'text-amber-500'
    : isRoleplay
      ? 'text-rose-500'
      : 'text-primary';
  return (
    <View className={`rounded-lg px-2 py-0.5 ${bg}`}>
      <Text
        className={`font-bold text-[10px] uppercase tracking-wider ${color}`}
      >
        {tag}
      </Text>
    </View>
  );
}
