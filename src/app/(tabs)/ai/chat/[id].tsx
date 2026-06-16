import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { ChatInput } from '@/components/ai/chat-input';
import { ChatMessage } from '@/components/ai/chat-message';
import { hasQuotaLeft } from '@/components/ai/quota-widget';
import { useAIConversation, useAIQuota, useSendMessage } from '@/hooks/use-ai';
import { glass, CTA } from '@/components/sunset';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatConversationScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id;
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const conv = useAIConversation(id);
  const quota = useAIQuota();
  const sendMut = useSendMessage(id ?? '');
  const scrollRef = useRef<ScrollView>(null);

  const messages = conv.data?.messages ?? [];
  const conversation = conv.data?.conversation;
  const canChat = hasQuotaLeft(quota.data, 'chat');

  // Скролл вниз при новых сообщениях и при открытии клавиатуры
  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    return () => clearTimeout(t);
  }, [messages.length, sendMut.isPending, keyboardHeight]);

  const handleSend = async (content: string, wantAudio: boolean) => {
    try {
      await sendMut.mutateAsync({ content, want_audio: wantAudio });
    } catch (e) {
      console.error('send message failed', e);
    }
  };

  const isRoleplay = conversation?.scenario.startsWith('roleplay_') ?? false;
  const isTutor = conversation?.scenario === 'tutor_qa';

  // Android: adjustResize сам двигает окно → inputBar нужен отступ только от таббара
  // когда клавиатура закрыта. Когда открыта — окно уже сжато, таббар скрыт.
  // iOS: KAV поднимает всё, паддинг = safe area.
  const inputPaddingBottom = Platform.OS === 'ios'
    ? (keyboardHeight > 0 ? 8 : tabBarHeight + 8)
    : (keyboardHeight > 0 ? 8 : tabBarHeight + 8);

  const content = (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={[s.header, glass, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.headerTitle} numberOfLines={1}>
            {conversation?.title || (conv.isLoading ? 'Загрузка…' : 'Чат')}
          </Text>
          {conversation && (
            <View style={s.badgesRow}>
              <ScenarioBadge isTutor={isTutor} isRoleplay={isRoleplay} />
              {conversation.target_language ? (
                <View style={s.metaBadge}>
                  <Text style={s.metaBadgeText}>{conversation.target_language.toUpperCase()}</Text>
                </View>
              ) : null}
              {conversation.user_level ? (
                <View style={s.metaBadge}>
                  <Text style={s.metaBadgeText}>{conversation.user_level}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {conv.isLoading ? (
          <View style={[s.emptyCard, glass]}>
            <ActivityIndicator color="#FFD84A" />
          </View>
        ) : conv.error || !conversation ? (
          <View style={[s.emptyCard, glass]}>
            <Text style={s.emptyTitle}>Диалог не найден</Text>
            <Pressable onPress={() => router.replace('/ai/chat')} style={s.backToListBtn}>
              <LinearGradient colors={CTA} style={s.backToListGrad}>
                <Text style={s.backToListText}>К списку</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : messages.length === 0 ? (
          <View style={[s.emptyCard, glass]}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>💬</Text>
            <Text style={s.emptyText}>Напишите первое сообщение, чтобы начать.</Text>
          </View>
        ) : (
          messages.map((m) => <ChatMessage key={m.id} message={m} />)
        )}

        {sendMut.isPending && (
          <View style={s.typingRow}>
            <View style={[s.typingAvatar, glass]}>
              <ActivityIndicator size="small" color="#9ca3af" />
            </View>
            <View style={[s.typingBubble, glass]}>
              <Text style={s.typingText}>AI печатает…</Text>
            </View>
          </View>
        )}

        {sendMut.isError && (
          <View style={s.errBubble}>
            <Text style={s.errText}>Не удалось отправить. Попробуйте ещё раз.</Text>
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={[s.inputBar, { paddingBottom: inputPaddingBottom }]}>
        {!canChat && (
          <View style={s.limitBar}>
            <Text style={s.limitText}>Лимит чатов исчерпан. Сбрасывается завтра.</Text>
          </View>
        )}
        <ChatInput
          onSend={handleSend}
          loading={sendMut.isPending}
          placeholder={isRoleplay ? 'Отвечайте по сценарию…' : 'Напишите сообщение…'}
        />
      </View>
    </View>
  );

  // iOS — KAV поднимает inputBar над клавиатурой
  // Android — adjustResize сам сжимает окно, KAV не нужен (вызывает двойной сдвиг)
  if (Platform.OS === 'ios') {
    return (
      <View style={{ flex: 1 }}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView
          behavior="padding"
          keyboardVerticalOffset={0}
          style={{ flex: 1 }}
        >
          {content}
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      {content}
    </View>
  );
}

function ScenarioBadge({ isTutor, isRoleplay }: { isTutor: boolean; isRoleplay: boolean }) {
  const tag = isTutor ? 'Tutor' : isRoleplay ? 'Roleplay' : 'Free chat';
  const color = isTutor ? '#f59e0b' : isRoleplay ? '#f43f5e' : '#FFD84A';
  return (
    <View style={[s.metaBadge, { borderColor: `${color}44` }]}>
      <Text style={[s.metaBadgeText, { color }]}>{tag}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: { padding: 6, borderRadius: 12 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' },
  metaBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  metaBadgeText: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  scrollContent: { padding: 14, paddingTop: 10, paddingBottom: 14, gap: 12 },

  emptyCard: { borderRadius: 22, padding: 40, alignItems: 'center', gap: 10 },
  emptyTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500', textAlign: 'center' },
  backToListBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  backToListGrad: { paddingHorizontal: 20, paddingVertical: 10 },
  backToListText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  typingRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  typingAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  typingBubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9 },
  typingText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },

  errBubble: {
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: 'rgba(248,113,113,0.08)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)',
  },
  errText: { color: '#f87171', fontSize: 13, fontWeight: '600' },

  inputBar: {
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  limitBar: {
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
  },
  limitText: { color: '#f59e0b', fontSize: 12, fontWeight: '600' },
});
