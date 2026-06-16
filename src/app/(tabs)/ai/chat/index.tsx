import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { MessageSquarePlus, Trash2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import {
  glass,
  SunsetHeader,
  SunsetSubhead,
  CtaButton,
  CTA,
} from '@/components/sunset';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatListScreen() {
  const [targetLang, setTargetLang] = useState(DEFAULT_TARGET_LANG);
  const insets = useSafeAreaInsets();

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
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 + insets.bottom }}
      >
        <SunsetHeader title="Свободный чат" />

        <QuotaWidget compact />

        {/* Новый чат */}
        <View style={[s.card, glass, { marginTop: 18 }]}>
          <View style={s.cardHeader}>
            <MessageSquarePlus size={18} color="#FFD84A" />
            <Text style={s.cardTitle}>Новый чат</Text>
          </View>
          <Text style={s.label}>Язык</Text>
          <LangPills
            options={AI_TARGET_LANGS}
            value={targetLang}
            onChange={setTargetLang}
            variant="full"
          />
          <View style={{ marginTop: 14 }}>
            <CtaButton
              label={startMut.isPending ? 'Создаём…' : 'Начать'}
              onPress={handleNew}
              block
            />
          </View>
          {!canChat && (
            <Text style={s.limitText}>
              Лимит чатов на сегодня исчерпан. Сбрасывается завтра.
            </Text>
          )}
        </View>

        {/* История */}
        <SunsetSubhead title="История" />

        {list.isLoading ? (
          <View style={[s.emptyCard, glass]}>
            <ActivityIndicator color="#FFD84A" />
          </View>
        ) : conversations.length === 0 ? (
          <View style={[s.emptyCard, glass]}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>💬</Text>
            <Text style={s.emptyTitle}>Пока пусто</Text>
            <Text style={s.emptyText}>Начните первый диалог кнопкой выше.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
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
  const tagColor = isTutor ? '#f59e0b' : isRoleplay ? '#f43f5e' : '#FFD84A';

  return (
    <View style={[s.row, glass]}>
      <Pressable onPress={onPress} style={{ flex: 1 }}>
        <View style={s.rowTop}>
          <Text style={s.rowTitle} numberOfLines={1}>
            {conv.title || `Чат от ${formatDate(conv.started_at)}`}
          </Text>
          <View style={[s.tag, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Text style={[s.tagText, { color: tagColor }]}>{tag}</Text>
          </View>
          {conv.target_language ? (
            <View style={[s.tag, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={s.tagText}>{conv.target_language.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>
        <Text style={s.rowMeta}>
          {conv.message_count} сообщений
          {conv.last_message_at ? ` · ${formatDate(conv.last_message_at)}` : ''}
        </Text>
      </Pressable>
      <Pressable
        onPress={onDelete}
        disabled={deleting}
        style={s.deleteBtn}
        accessibilityLabel="Удалить"
      >
        <Trash2 size={15} color="rgba(255,255,255,0.5)" />
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

const s = StyleSheet.create({
  card: { borderRadius: 22, padding: 16, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  limitText: { color: '#f87171', fontSize: 13, fontWeight: '600', marginTop: 4 },

  emptyCard: { borderRadius: 22, padding: 40, alignItems: 'center', marginTop: 4 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500', textAlign: 'center' },

  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 14, gap: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 },
  rowTitle: { color: '#fff', fontSize: 14, fontWeight: '700', flexShrink: 1 },
  rowMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '500', marginTop: 4 },
  tag: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  tagText: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  deleteBtn: { padding: 8, borderRadius: 12 },
});
