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
import { requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { STT_RECORDING_OPTIONS, sttFormatMeta } from '@/lib/stt-recording';
import { SoundSlot } from '@/lib/audio';
import { warmStreamConnection } from '@/lib/ai-api';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { ChatInput } from '@/components/ai/chat-input';
import { ChatMessage } from '@/components/ai/chat-message';
import { ScenarioTasksPanel } from '@/components/ai/scenario-tasks';
import { hasQuotaLeft } from '@/components/ai/quota-widget';
import { useAIConversation, useAIQuota, useAIScenarios, useSendMessage, useSendMessageStream, useTranscribeAudio } from '@/hooks/use-ai';
import { getChatTTSUri } from '@/lib/tts';
import { glass, CTA } from '@/components/sunset';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

/**
 * Splits streamed text into whole sentences. A terminator at the very end of the
 * buffer is kept back (it may be "Dr." or "..." that is not finished yet) unless
 * `flush` is set.
 */
function takeSentences(buffer: string, flush: boolean, eager = false): { sentences: string[]; rest: string } {
  const sentences: string[] = [];
  const re = /^([\s\S]+?[.!?…]+["')\]”’]*)(\s+|$)/;
  // `eager` (first spoken chunk only): a long first sentence may be cut at a
  // comma/colon so the audio starts earlier.
  const eagerRe = /^([\s\S]{20,}?[,;:])(\s+)/;
  let rest = buffer;
  for (;;) {
    const m = re.exec(rest) ?? (eager && sentences.length === 0 ? eagerRe.exec(rest) : null);
    if (!m || (m[2] === '' && !flush)) break;
    const sentence = m[1].trim();
    if (sentence) sentences.push(sentence);
    rest = rest.slice(m[0].length);
  }
  if (flush && rest.trim()) {
    sentences.push(rest.trim());
    rest = '';
  }
  return { sentences, rest };
}

type VoicePhase = 'idle' | 'recording' | 'processing' | 'speaking';

/** Потолок одной записи: STT синхронный, длинные записи дороже и медленнее. */
const MAX_RECORD_MS = 30_000;

/**
 * VoiceConsole — пошаговый голосовой диалог: нажали микрофон → говорим →
 * нажали ещё раз (или истёк потолок записи) → распознавание → ответ AI →
 * озвучка → ждём следующего нажатия. Пока AI отвечает, микрофон заблокирован,
 * перебить его нельзя.
 */
function VoiceConsole({
  language,
  send,
  onClose,
}: {
  language?: string;
  send: (text: string, onDelta: (delta: string) => void) => Promise<string>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const recorder = useAudioRecorder(STT_RECORDING_OPTIONS);
  const soundRef = useRef(new SoundSlot());
  const activeRef = useRef(true);
  const limitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopAndSendRef = useRef<() => void>(() => {});
  const transcribeMut = useTranscribeAudio();

  const clearLimitTimer = useCallback(() => {
    if (limitTimerRef.current) { clearTimeout(limitTimerRef.current); limitTimerRef.current = null; }
  }, []);

  /** Ход закончился: ждём следующего нажатия на микрофон. */
  const goIdle = useCallback(() => {
    if (activeRef.current) setPhase('idle');
  }, []);

  /** Старт записи — только по нажатию пользователя. */
  const beginRecording = useCallback(async () => {
    if (!activeRef.current) return;
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) { Toast.show({ type: 'error', text1: 'Нет доступа к микрофону' }); onClose(); return; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      if (!activeRef.current) { try { await recorder.stop(); } catch {} return; }
      recorder.record();
      warmStreamConnection();
      setPhase('recording');
      clearLimitTimer();
      limitTimerRef.current = setTimeout(() => stopAndSendRef.current(), MAX_RECORD_MS);
    } catch (e) { console.error('voice rec failed', e); Toast.show({ type: 'error', text1: 'Не удалось начать запись' }); onClose(); }
  }, [onClose, clearLimitTimer, recorder]);

  // Sentence-by-sentence playback of a streamed reply. The audio of the next
  // sentence is requested while the previous one is still playing.
  const speechRef = useRef({ buffer: '', queue: [] as Promise<string>[], playing: false, done: false, spoken: 0 });

  const pumpSpeech = useCallback(() => {
    const sp = speechRef.current;
    if (sp.playing || !activeRef.current) return;
    const next = sp.queue.shift();
    if (!next) {
      if (sp.done) goIdle();
      return;
    }
    sp.playing = true;
    setPhase('speaking');
    void next.then((uri) => {
      if (!activeRef.current) return;
      if (!uri) { sp.playing = false; pumpSpeech(); return; }
      soundRef.current.play({ uri }, { onFinish: () => { sp.playing = false; pumpSpeech(); } });
    });
  }, [goIdle]);

  const enqueueSpeech = useCallback((sentences: string[]) => {
    const sp = speechRef.current;
    for (const sentence of sentences) {
      sp.spoken += 1;
      sp.queue.push(getChatTTSUri(sentence, language ?? 'en').catch((e) => { console.warn('voice tts failed', e); return ''; }));
    }
    pumpSpeech();
  }, [language, pumpSpeech]);

  const stopAndSend = useCallback(async () => {
    clearLimitTimer();
    if (!recorder.isRecording) return;
    setPhase('processing');
    try {
      await recorder.stop();
      if (!activeRef.current) return;
      const uri = recorder.uri;
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
      if (!uri) { goIdle(); return; }
      const meta = sttFormatMeta();
      const out = await transcribeMut.mutateAsync({ audio: { uri, type: meta.type, name: meta.name }, language: language ?? 'en', encoding: meta.encoding, sample_rate: meta.sampleRate });
      if (!activeRef.current) return;
      const text = out.text?.trim();
      if (!text) { Toast.show({ type: 'info', text1: 'Речь не распознана' }); goIdle(); return; }
      const sp = speechRef.current;
      sp.buffer = ''; sp.queue.length = 0; sp.playing = false; sp.done = false; sp.spoken = 0;
      const reply = await send(text, (delta) => {
        if (!activeRef.current) return;
        sp.buffer += delta;
        const { sentences, rest } = takeSentences(sp.buffer, false, sp.spoken === 0);
        sp.buffer = rest;
        if (sentences.length) enqueueSpeech(sentences);
      });
      if (!activeRef.current) return;
      const tail = takeSentences(sp.buffer, true);
      sp.buffer = '';
      if (tail.sentences.length) enqueueSpeech(tail.sentences);
      sp.done = true;
      if (sp.spoken === 0 && !reply.trim()) {
        Toast.show({ type: 'info', text1: 'AI не ответил, повторите фразу' });
        goIdle();
        return;
      }
      pumpSpeech();
    } catch (e) {
      console.warn('voice turn failed', e);
      Toast.show({ type: 'error', text1: t('common.error'), text2: e instanceof Error ? e.message : undefined });
      goIdle();
    }
  }, [clearLimitTimer, goIdle, enqueueSpeech, pumpSpeech, send, transcribeMut, language, recorder, t]);

  stopAndSendRef.current = () => { void stopAndSend(); };

  useEffect(() => {
    activeRef.current = true;
    const sound = soundRef.current;
    return () => {
      activeRef.current = false;
      clearLimitTimer();
      if (recorder.isRecording) void recorder.stop().catch(() => {});
      sound.stop();
      setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    };
  }, [clearLimitTimer, recorder]);

  const label =
    phase === 'idle' ? 'Нажмите на микрофон и говорите'
    : phase === 'recording' ? 'Слушаю… нажмите, чтобы отправить'
    : phase === 'processing' ? ''
    : 'AI отвечает 🔊';

  const onMicPress = () => {
    if (phase === 'idle') void beginRecording();
    else if (phase === 'recording') void stopAndSend();
  };

  return (
    <View style={vs.wrap}>
      <Pressable onPress={onClose} style={vs.close} hitSlop={8}>
        <X size={18} color="#5D686F" />
      </Pressable>
      <Pressable onPress={onMicPress} disabled={phase === 'processing' || phase === 'speaking'} style={vs.btnWrap}>
        {phase === 'idle' ? (
          <View style={[vs.btn, vs.btnIdle]}><Mic size={24} color="#fff" /></View>
        ) : phase === 'recording' ? (
          <View style={[vs.btn, vs.btnRec]}><Square size={22} color="#fff" fill="#fff" /></View>
        ) : phase === 'speaking' ? (
          <View style={[vs.btn, vs.btnSpeak]}><Text style={{ fontSize: 22 }}>🔊</Text></View>
        ) : (
          <View style={[vs.btn, vs.btnProc]}><Mic size={24} color="#5D686F" /></View>
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
  btnIdle: { backgroundColor: '#2FA8E6' },
  btnRec: { backgroundColor: 'rgba(248,113,113,0.92)' },
  btnSpeak: { backgroundColor: '#59C8FF' },
  btnProc: { backgroundColor: '#EAF8FF' },
  label: { flex: 1, color: '#171A1C', fontSize: 14, fontFamily: 'Nunito_700Bold' },
});

export default function ChatConversationScreen() {
  const { t } = useTranslation();
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
  const streamMut = useSendMessageStream(id ?? '');
  const scrollRef = useRef<ScrollView>(null);

  // The backend can store an assistant reply with empty text when the model
  // answers nothing; such blank bubbles are hidden.
  const messages = (conv.data?.messages ?? []).filter(
    (m) => m.role === 'MESSAGE_ROLE_USER' || m.content.trim() !== '',
  );
  const conversation = conv.data?.conversation;
  const canChat = hasQuotaLeft(quota.data, 'chat');
  const lastMessageLength = messages.at(-1)?.content.length;

  // Скролл вниз при новых сообщениях и при открытии клавиатуры
  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    return () => clearTimeout(t);
  }, [messages.length, lastMessageLength, sendMut.isPending, streamMut.isPending, keyboardHeight]);

  const handleSend = async (content: string, wantAudio: boolean) => {
    await sendMut.mutateAsync({ content, want_audio: wantAudio });
  };

  // Голосовой режим: отправляет сообщение и возвращает текст ответа AI
  // (для авто-озвучки в VoiceConsole).
  const [voiceMode, setVoiceMode] = useState(false);
  const sendForVoice = async (text: string, onDelta: (delta: string) => void): Promise<string> => {
    const resp = await streamMut.mutateAsync({ content: text, onDelta });
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
    void handleSend(draft, false).catch(error => {
      Toast.show({ type: 'error', text1: t('ai.send_err'), text2: error instanceof Error ? error.message : undefined });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, conversation, messages.length]);

  const isRoleplay = conversation?.scenario.startsWith('roleplay_') ?? false;
  const isTutor = conversation?.scenario === 'tutor_qa';

  // Tasks of the scene come with the static scenario list (success_criteria).
  const scenarioList = useAIScenarios();
  const sceneTasks = isRoleplay
    ? scenarioList.data?.scenarios?.find((sc) => sc.id === conversation?.scenario)?.success_criteria ?? []
    : [];

  // Android: adjustResize сам двигает окно → inputBar нужен отступ только от таббара
  // когда клавиатура закрыта. Когда открыта — окно уже сжато, таббар скрыт.
  // iOS: KAV поднимает всё, паддинг = safe area.
  // The floating tab bar sits above the system inset, so the inset is added too,
  // otherwise the bar covers the bottom of the input row.
  const inputPaddingBottom = keyboardHeight > 0 ? 8 : tabBarHeight + insets.bottom + 8;

  const content = (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={[s.header, glass, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color="#171A1C" />
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

      <ScenarioTasksPanel tasks={sceneTasks} />

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
            <ActivityIndicator color="#1789BD" />
          </View>
        ) : conv.error || !conversation ? (
          <View style={[s.emptyCard, glass]}>
            <Text style={s.emptyTitle}>{t('ai.not_found')}</Text>
            <Pressable onPress={() => router.replace('/ai/chat')} style={s.backToListBtn}>
              <LinearGradient colors={CTA} style={s.backToListGrad}>
                <Text style={s.backToListText}>{t('ai.back_to_list')}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : messages.length === 0 ? (
          <View style={[s.emptyCard, glass]}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>💬</Text>
            <Text style={s.emptyText}>{t('ai.write_first')}</Text>
          </View>
        ) : (
          messages.map((m) => <ChatMessage key={m.id} message={m} language={conversation?.target_language} />)
        )}

        {(sendMut.isPending || streamMut.isPending) && !messages.some((m) => m.id.startsWith('pending-assistant')) && (
          <View style={s.typingRow}>
            <View style={[s.typingAvatar, glass]}>
              <ActivityIndicator size="small" color="#9ca3af" />
            </View>
            <View style={[s.typingBubble, glass]}>
              <Text style={s.typingText}>AI печатает…</Text>
            </View>
          </View>
        )}

        {(sendMut.isError || streamMut.isError) && (
          <View style={s.errBubble}>
            <Text style={s.errText}>{t('ai.send_err')}</Text>
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={[s.inputBar, { paddingBottom: inputPaddingBottom }]}>
        {!canChat && (
          <View style={s.limitBar}>
            <Text style={s.limitText}>{t('ai.chat_limit_bar')}</Text>
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
        <StatusBar barStyle="dark-content" />
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
      <StatusBar barStyle="dark-content" />
      {content}
    </View>
  );
}

function ScenarioBadge({ isTutor, isRoleplay }: { isTutor: boolean; isRoleplay: boolean }) {
  const tag = isTutor ? 'Tutor' : isRoleplay ? 'Roleplay' : 'Free chat';
  const color = isTutor ? '#f59e0b' : isRoleplay ? '#f43f5e' : '#1789BD';
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
    borderBottomColor: '#C9EDFF',
  },
  backBtn: { padding: 6, borderRadius: 12 },
  headerTitle: { color: '#171A1C', fontSize: 16, fontFamily: 'Nunito_800ExtraBold' },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' },
  metaBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: '#EAF8FF',
    borderWidth: 1,
    borderColor: '#C9EDFF',
  },
  metaBadgeText: { color: '#5D686F', fontSize: 10, fontFamily: 'Nunito_800ExtraBold', textTransform: 'uppercase' },

  scrollContent: { padding: 14, paddingTop: 10, paddingBottom: 14, gap: 12 },

  emptyCard: { borderRadius: 22, padding: 40, alignItems: 'center', gap: 10 },
  emptyTitle: { color: '#171A1C', fontSize: 17, fontFamily: 'Nunito_800ExtraBold' },
  emptyText: { color: '#5D686F', fontSize: 14, fontFamily: 'Nunito_600SemiBold', textAlign: 'center' },
  backToListBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  backToListGrad: { paddingHorizontal: 20, paddingVertical: 10 },
  backToListText: { color: '#fff', fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },

  typingRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  typingAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  typingBubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9 },
  typingText: { color: '#5D686F', fontSize: 13, fontFamily: 'Nunito_600SemiBold' },

  errBubble: {
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: 'rgba(248,113,113,0.08)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)',
  },
  errText: { color: '#f87171', fontSize: 13, fontFamily: 'Nunito_600SemiBold' },

  inputBar: {
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#C9EDFF',
    backgroundColor: '#FFFFFF',
  },
  limitBar: {
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
  },
  limitText: { color: '#f59e0b', fontSize: 12, fontFamily: 'Nunito_600SemiBold' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  voiceBtn: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2FA8E6',
  },
  voiceBtnDisabled: { backgroundColor: '#EAF8FF' },
  voiceWrap: { borderRadius: 22, paddingHorizontal: 6, paddingVertical: 4 },
});
