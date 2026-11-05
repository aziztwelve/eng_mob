import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertCircle, Bot, ChevronDown, Languages, Play, Square, User as UserIcon } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { LinearGradient } from 'expo-linear-gradient';
import { setAudioModeAsync } from 'expo-audio';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { glass, CTA } from '@/components/sunset';
import { getChatTTSUri } from '@/lib/tts';
import { SoundSlot } from '@/lib/audio';

import type { AIMessage } from '@/types/api';

// ── TTS кнопка «Прослушать» — объявляем ДО ChatMessage (React Compiler) ─────
//
// Жёсткая привязка к Google Cloud TTS: реплика всегда синтезируется на
// бэкенде через POST /ai/tts (Google), кэшируется и проигрывается expo-audio.
// Никакого системного голоса (expo-speech) и OpenAI audio_url — только Google.

function SpeechButton({
  text,
  language,
  rate = 1,
  onPlaybackChange,
  compact = false,
}: {
  compact?: boolean;
  rate?: number;
  text: string;
  language?: string;
  onPlaybackChange?: (playing: boolean, text: string) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const soundRef = useRef(new SoundSlot());
  const alive = useRef(true);
  const playbackCallback = useRef(onPlaybackChange);
  playbackCallback.current = onPlaybackChange;

  // Cleanup при unmount
  useEffect(() => {
    alive.current = true;
    const slot = soundRef.current;
    return () => { alive.current = false; slot.stop(); };
  }, []);
  useEffect(() => { soundRef.current.setRate(rate); }, [rate]);

  const toggle = async () => {
    if (loading) return;
    // Sound уже создан → play/pause/restart.
    if (soundRef.current.isActive) {
      await toggleExisting();
      return;
    }
    // Первый запуск: синтез через Google TTS → проигрывание.
    setLoading(true);
    try {
      const uri = await getChatTTSUri(text, language ?? 'en');
      if (alive.current) await playUri(uri);
    } catch (e) {
      console.warn('[TTS] google tts failed', e);
      Toast.show({
        type: 'error',
        text1: 'Не удалось озвучить',
        text2: e instanceof Error ? e.message : undefined,
      });
    } finally {
      if (alive.current) setLoading(false);
    }
  };

  // --- expo-audio: первый запуск URI (локальный mp3 или storage URL) ---
  const playUri = async (uri: string) => {
    await setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    if (!alive.current) return;
    soundRef.current.play({ uri }, { rate, keep: true, onFinish: () => setPlaying(false), onPlaybackChange: value => playbackCallback.current?.(value, text) });
    setPlaying(true);
  };

  // --- expo-audio: повторное нажатие (pause / resume / restart) ---
  const toggleExisting = async () => {
    try {
      setPlaying(await soundRef.current.toggle());
    } catch (e) {
      console.warn('[TTS] expo-audio toggle failed', e);
    }
  };

  return (
    <Pressable onPress={toggle} disabled={loading} accessibilityRole="button" accessibilityLabel={playing ? 'Стоп' : 'Прослушать'} style={[s.audioBtn, glass, compact && s.audioCompact]}>
      {loading ? (
        <ActivityIndicator size="small" color="#1789BD" />
      ) : playing ? (
        <Square size={12} color="#1789BD" fill="#1789BD" />
      ) : (
        <Play size={13} color="#5D686F" />
      )}
      {!compact && <Text style={s.audioBtnText}>
        {loading ? 'Озвучка…' : playing ? 'Стоп' : 'Прослушать'}
      </Text>}
    </Pressable>
  );
}

// ── Corrections ──────────────────────────────────────────────────────────────

function CorrectionsList({ corrections }: { corrections: NonNullable<AIMessage['corrections']> }) {
  const { t } = useTranslation();
  return (
    <View style={s.corrections}>
      <View style={s.corrHeader}>
        <AlertCircle size={11} color="#f59e0b" />
        <Text style={s.corrLabel}>{t('ai.corrections')}</Text>
      </View>
      {corrections.map((c, i) => (
        <View key={i} style={{ gap: 2 }}>
          <View style={s.corrRow}>
            <View style={s.corrOrigWrap}>
              <Text style={s.corrOrig}>{c.original}</Text>
            </View>
            <Text style={s.corrArrow}>→</Text>
            <View style={s.corrFixWrap}>
              <Text style={s.corrFix}>{c.corrected}</Text>
            </View>
          </View>
          {c.explanation ? <Text style={s.corrExpl}>{c.explanation}</Text> : null}
        </View>
      ))}
    </View>
  );
}

// ── Translation ──────────────────────────────────────────────────────────────

function TranslationToggle({ translation }: { translation: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ width: '100%' }}>
      <Pressable onPress={() => setOpen((v) => !v)} style={s.transToggle}>
        <Languages size={11} color="#5D686F" />
        <Text style={s.transToggleText}>{open ? 'Скрыть перевод' : 'Показать перевод'}</Text>
        <ChevronDown
          size={11}
          color="#5D686F"
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>
      {open && (
        <View style={[s.transBox, glass]}>
          <Text style={s.transText}>{translation}</Text>
        </View>
      )}
    </View>
  );
}

// ── ChatMessage ──────────────────────────────────────────────────────────────

// ── Role detection ─────────────────────────────────────────────────────────
//
// `message.role` может прийти в разных форматах в зависимости от пути
// сериализации на бэкенде:
//   • proto-string  — 'MESSAGE_ROLE_USER' (protojson, streaming-эндпоинт)
//   • numeric enum  — 1/2/3 (gateway GetConversation отдаёт через gin c.JSON →
//                     encoding/json, который маршалит proto-enum как int32)
//   • lowercase     — 'user'/'assistant'/'system' (внутренняя модель)
// Поэтому детектим устойчиво, иначе user-сообщения уезжают влево (isUser=false).
type RoleKind = 'user' | 'assistant' | 'system' | 'other';

function roleKind(role: unknown): RoleKind {
  if (typeof role === 'number') {
    return role === 1 ? 'user' : role === 2 ? 'assistant' : role === 3 ? 'system' : 'other';
  }
  const r = String(role ?? '').toUpperCase();
  if (r.includes('USER')) return 'user';
  if (r.includes('ASSISTANT')) return 'assistant';
  if (r.includes('SYSTEM')) return 'system';
  return 'other';
}

export function ChatMessage({ message, language, showAvatar = true, audioDisabled = false, playbackRate = 1, onPlaybackChange, compact = false }: {
  message: AIMessage; language?: string; showAvatar?: boolean; audioDisabled?: boolean; compact?: boolean; playbackRate?: number; onPlaybackChange?: (playing: boolean, text: string) => void;
}) {
  const kind = roleKind(message.role);
  const isUser = kind === 'user';
  const isSystem = kind === 'system';
  if (isSystem) return null;

  return (
    <View style={[s.row, { flexDirection: isUser ? 'row-reverse' : 'row' }]}>
      {showAvatar && (isUser ? (
        <LinearGradient colors={CTA} style={s.avatar}>
          <UserIcon size={15} color="#fff" />
        </LinearGradient>
      ) : (
        <View style={[s.avatar, glass]}>
          <Bot size={15} color="#2FA8E6" />
        </View>
      ))}

      <View style={[s.col, { alignItems: isUser ? 'flex-end' : 'flex-start' }]}>
        <View style={[s.messageLine, isUser && s.messageLineUser]}>
        {isUser ? (
          <LinearGradient colors={CTA} style={[s.bubble, s.bubbleUser, compact && s.compactBubble]}>
            <Markdown style={compact ? mdUserCompact : mdUser}>{message.content || ' '}</Markdown>
          </LinearGradient>
        ) : (
          <View style={[s.bubble, s.bubbleAI, glass, compact && s.compactBubble]}>
            <Markdown style={compact ? mdCompact : mdAI}>{message.content || ' '}</Markdown>
          </View>
        )}

        {compact && !isUser && message.content && !audioDisabled ? (
          <SpeechButton text={message.content} language={language} rate={playbackRate} onPlaybackChange={onPlaybackChange} compact={compact} />
        ) : null}
        </View>
        {!compact && !isUser && message.content && !audioDisabled ? <SpeechButton text={message.content} language={language} rate={playbackRate} onPlaybackChange={onPlaybackChange} /> : null}
        {!isUser && message.corrections && message.corrections.length > 0 && (
          <CorrectionsList corrections={message.corrections} />
        )}
        {!isUser && message.translation ? (
          <TranslationToggle translation={message.translation} />
        ) : null}
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 2 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  col: { flex: 1, gap: 6 },
  bubble: { borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9, maxWidth: '88%' },
  messageLine: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, width: '100%' },
  messageLineUser: { justifyContent: 'flex-end' },
  compactBubble: { maxWidth: '78%', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 16 },
  audioCompact: { width: 38, height: 38, justifyContent: 'center', borderRadius: 19, paddingHorizontal: 0, paddingVertical: 0 },
  bubbleUser: {},
  bubbleAI: {},
  audioBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  audioBtnText: { color: '#5D686F', fontSize: 12, fontFamily: 'Nunito_600SemiBold' },
  corrections: {
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9, gap: 6,
    backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)', width: '100%',
  },
  corrHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  corrLabel: { color: '#f59e0b', fontSize: 10, fontFamily: 'Nunito_800ExtraBold', textTransform: 'uppercase', letterSpacing: 0.6 },
  corrRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  corrOrigWrap: { backgroundColor: 'rgba(248,113,113,0.15)', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 2 },
  corrOrig: { color: '#f87171', fontSize: 12, fontFamily: 'monospace', textDecorationLine: 'line-through' },
  corrArrow: { color: '#5D686F', fontFamily: 'Nunito_700Bold' },
  corrFixWrap: { backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 2 },
  corrFix: { color: '#10b981', fontSize: 12, fontFamily: 'monospace' },
  corrExpl: { color: '#5D686F', fontSize: 11, fontFamily: 'Nunito_600SemiBold' },
  transToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4, paddingVertical: 4 },
  transToggleText: { color: '#5D686F', fontSize: 12, fontFamily: 'Nunito_600SemiBold' },
  transBox: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginTop: 2 },
  transText: { color: '#5D686F', fontSize: 13, fontFamily: 'Nunito_600SemiBold', fontStyle: 'italic' },
});

const mdBase = {
  body: { color: '#171A1C', fontSize: 14, fontFamily: 'Nunito_600SemiBold' as const, lineHeight: 20 },
  paragraph: { marginTop: 0, marginBottom: 0 },
  link: { color: '#1789BD', textDecorationLine: 'underline' as const },
  code_inline: { backgroundColor: '#EAF8FF', color: '#171A1C', borderRadius: 4, paddingHorizontal: 4, fontFamily: 'monospace', fontSize: 12 },
  fence: { backgroundColor: '#EAF8FF', color: '#171A1C', borderRadius: 8, padding: 8, fontFamily: 'monospace', fontSize: 12 },
  list_item: { marginBottom: 2 },
  bullet_list: { marginVertical: 2 },
  ordered_list: { marginVertical: 2 },
};

const mdAI = StyleSheet.create({ ...mdBase });
const mdUser = StyleSheet.create({ ...mdBase, body: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Nunito_600SemiBold' as const, lineHeight: 20 } });

const mdCompact = StyleSheet.create({ ...mdBase, body: { ...mdBase.body, fontSize: 13, lineHeight: 19 } });
const mdUserCompact = StyleSheet.create({ ...mdBase, body: { ...mdBase.body, color: '#FFFFFF', fontSize: 13, lineHeight: 19 } });
