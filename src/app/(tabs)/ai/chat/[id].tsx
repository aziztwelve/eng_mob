import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { ArrowLeft, Mic, Square, X } from 'lucide-react-native';
import { Audio } from 'expo-av';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { ChatInput } from '@/components/ai/chat-input';
import { ChatMessage } from '@/components/ai/chat-message';
import { hasQuotaLeft } from '@/components/ai/quota-widget';
import { useAIConversation, useAIQuota, useSendMessage, useTranscribeAudio } from '@/hooks/use-ai';
import { getChatTTSUri } from '@/lib/tts';
import { glass, CTA } from '@/components/sunset';
import { LinearGradient } from 'expo-linear-gradient';

/* STT — формат записи под Google STT (как в chat-input/ai-hub). */
const STT_SR = 16000;
const STT_REC_OPTS: Audio.RecordingOptions = {
  isMeteringEnabled: false,
  android: { extension: '.amr', outputFormat: Audio.AndroidOutputFormat.AMR_WB, audioEncoder: Audio.AndroidAudioEncoder.AMR_WB, sampleRate: STT_SR, numberOfChannels: 1, bitRate: 23850 },
  ios: { extension: '.wav', outputFormat: Audio.IOSOutputFormat.LINEARPCM, audioQuality: Audio.IOSAudioQuality.HIGH, sampleRate: STT_SR, numberOfChannels: 1, bitRate: 256000, linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false },
  web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
};
function sttMeta(): { encoding: string; sampleRate: number; type: string; name: string } {
  if (Platform.OS === 'ios') return { encoding: 'LINEAR16', sampleRate: STT_SR, type: 'audio/wav', name: 'rec.wav' };
  if (Platform.OS === 'web') return { encoding: 'WEBM_OPUS', sampleRate: 48000, type: 'audio/webm', name: 'rec.webm' };
  return { encoding: 'AMR_WB', sampleRate: STT_SR, type: 'audio/amr-wb', name: 'rec.amr' };
}

type VoicePhase = 'recording' | 'processing' | 'speaking';

/**
 * VoiceConsole — hands-free голосовой диалог: запись → авто-отправка →
 * ответ AI → авто-озвучка (Google TTS) → снова запись. Цикл до закрытия.
 */
function VoiceConsole({
  language,
  send,
  onClose,
}: {
  language?: string;
  send: (text: string) => Promise<string>;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<VoicePhase>('recording');
  const recRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const activeRef = useRef(true);
  const transcribeMut = useTranscribeAudio();

  const beginRecording = useCallback(async () => {
    if (!activeRef.current) return;
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) { Toast.show({ type: 'error', text1: 'Нет доступа к микрофону' }); onClose(); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(STT_REC_OPTS);
      if (!activeRef.current) { try { await recording.stopAndUnloadAsync(); } catch {} return; }
      recRef.current = recording;
      setPhase('recording');
    } catch (e) { console.error('voice rec failed', e); Toast.show({ type: 'error', text1: 'Не удалось начать запись' }); onClose(); }
  }, [onClose]);

  const playReply = useCallback(async (reply: string) => {
    if (!reply.trim()) { void beginRecording(); return; }
    try {
      setPhase('speaking');
      const uri = await getChatTTSUri(reply, language ?? 'en');
      if (!activeRef.current) return;
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((st) => {
        if (st.isLoaded && st.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          if (soundRef.current === sound) soundRef.current = null;
          if (activeRef.current) void beginRecording();
        }
      });
    } catch (e) {
      console.warn('voice tts failed', e);
      if (activeRef.current) void beginRecording();
    }
  }, [beginRecording, language]);

  const stopAndSend = useCallback(async () => {
    const rec = recRef.current;
    recRef.current = null;
    if (!rec) return;
    setPhase('processing');
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true }).catch(() => {});
      if (!uri) { void beginRecording(); return; }
      const meta = sttMeta();
      const out = await transcribeMut.mutateAsync({ audio: { uri, type: meta.type, name: meta.name }, language: language ?? 'en', encoding: meta.encoding, sample_rate: meta.sampleRate });
      const text = out.text?.trim();
      if (!text) { Toast.show({ type: 'info', text1: 'Речь не распознана' }); void beginRecording(); return; }
      const reply = await send(text);
      if (!activeRef.current) return;
      await playReply(reply);
    } catch (e) {
      console.error('voice turn failed', e);
      Toast.show({ type: 'error', text1: 'Ошибка', text2: e instanceof Error ? e.message : undefined });
      if (activeRef.current) void beginRecording();
    }
  }, [beginRecording, playReply, send, transcribeMut, language]);

  useEffect(() => {
    activeRef.current = true;
    void beginRecording();
    return () => {
      activeRef.current = false;
      recRef.current?.stopAndUnloadAsync().catch(() => {});
      recRef.current = null;
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
      Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true }).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const label = phase === 'recording' ? 'Слушаю… нажмите, чтобы отправить' : phase === 'processing' ? 'Обрабатываю…' : 'AI отвечает 🔊';

  return (
    <View style={vs.wrap}>
      <Pressable onPress={onClose} style={vs.close} hitSlop={8}>
        <X size={18} color="rgba(255,255,255,0.7)" />
      </Pressable>
      <Pressable onPress={stopAndSend} disabled={phase !== 'recording'} style={vs.btnWrap}>
        {phase === 'recording' ? (
          <View style={[vs.btn, vs.btnRec]}><Square size={22} color="#fff" fill="#fff" /></View>
        ) : phase === 'speaking' ? (
          <View style={[vs.btn, vs.btnSpeak]}><Text style={{ fontSize: 22 }}>🔊</Text></View>
        ) : (
          <View style={[vs.btn, vs.btnProc]}><ActivityIndicator color="#fff" /></View>
        )}
      </Pressable>
      <Text style={vs.label} numberOfLines={2}>{label}</Text>
    </View>
  );
}

const vs = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6, paddingHorizontal: 4 },
  close: { padding: 8, borderRadius: 12 },
  btnWrap: {},
  btn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  btnRec: { backgroundColor: 'rgba(248,113,113,0.92)' },
  btnSpeak: { backgroundColor: 'rgba(124,92,255,0.75)' },
  btnProc: { backgroundColor: 'rgba(255,255,255,0.2)' },
  label: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default function ChatConversationScreen() {
  const params = useLocalSearchParams<{ id: string; draft?: string }>();
  const id = params.id;
  const draft = typeof params.draft === 'string' ? params.draft : undefined;
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

  // Голосовой режим: отправляет сообщение и возвращает текст ответа AI
  // (для авто-озвучки в VoiceConsole).
  const [voiceMode, setVoiceMode] = useState(false);
  const sendForVoice = async (text: string): Promise<string> => {
    const resp = await sendMut.mutateAsync({ content: text, want_audio: false });
    return resp.assistant_message?.content ?? '';
  };

  // Автоотправка первого сообщения (draft из AI-хаба) — один раз, когда
  // конверсация загружена и ещё пустая.
  const draftSentRef = useRef(false);
  useEffect(() => {
    if (draftSentRef.current) return;
    if (!draft || !conversation) return;
    if (messages.length > 0) return;
    if (sendMut.isPending) return;
    draftSentRef.current = true;
    void handleSend(draft, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, conversation, messages.length]);

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
          messages.map((m) => <ChatMessage key={m.id} message={m} language={conversation?.target_language} />)
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
        {voiceMode ? (
          <View style={[s.voiceWrap, glass]}>
            <VoiceConsole
              language={conversation?.target_language}
              send={sendForVoice}
              onClose={() => setVoiceMode(false)}
            />
          </View>
        ) : (
          <View style={s.inputRow}>
            <View style={{ flex: 1 }}>
              <ChatInput
                onSend={handleSend}
                loading={sendMut.isPending}
                language={conversation?.target_language}
                showMic={false}
                placeholder={isRoleplay ? 'Отвечайте по сценарию…' : 'Напишите сообщение…'}
              />
            </View>
            <Pressable
              onPress={() => canChat && setVoiceMode(true)}
              disabled={!canChat}
              style={[s.voiceBtn, !canChat && s.voiceBtnDisabled]}
              accessibilityLabel="Голосовой диалог"
            >
              <Mic size={20} color={canChat ? '#fff' : 'rgba(255,255,255,0.4)'} />
            </Pressable>
          </View>
        )}
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
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  voiceBtn: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(124,92,255,0.85)',
  },
  voiceBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.12)' },
  voiceWrap: { borderRadius: 22, paddingHorizontal: 6, paddingVertical: 4 },
});
