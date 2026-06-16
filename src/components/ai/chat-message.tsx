import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertCircle, Bot, ChevronDown, Languages, Pause, Play, Square, User as UserIcon, Volume2 } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { glass, CTA } from '@/components/sunset';

import type { AIMessage } from '@/types/api';

// ── TTS кнопка — объявляем ДО ChatMessage (React Compiler) ──────────────────
//
// Логика:
//  1. Если message.audio_url задан и не фейковый (example.com) → expo-av
//  2. Иначе → expo-speech (системный TTS как fallback)

const FAKE_HOST_RE = /example\.com/i;

function isFakeUrl(url?: string | null): boolean {
  return !url || FAKE_HOST_RE.test(url);
}

function SpeechButton({ text, audioUrl }: { text: string; audioUrl?: string | null }) {
  const [playing, setSpeaking] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const useAV = !isFakeUrl(audioUrl);

  // Cleanup при unmount
  useEffect(() => {
    return () => {
      if (useAV) {
        soundRef.current?.unloadAsync().catch(() => {});
      } else {
        Speech.stop().catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async () => {
    if (useAV) {
      await toggleAV();
    } else {
      await toggleSpeech();
    }
  };

  // --- expo-av (реальный MP3 с MinIO/OpenAI TTS) ---
  const toggleAV = async () => {
    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl! },
          { shouldPlay: true },
        );
        soundRef.current = sound;
        setSpeaking(true);
        sound.setOnPlaybackStatusUpdate((st) => {
          if (st.isLoaded && (st.didJustFinish || !st.isPlaying)) {
            setSpeaking(false);
          }
        });
        return;
      }
      const st = await soundRef.current.getStatusAsync();
      if (!st.isLoaded) return;
      if (st.isPlaying) {
        await soundRef.current.pauseAsync();
        setSpeaking(false);
      } else {
        if (st.positionMillis && st.durationMillis && st.positionMillis >= st.durationMillis) {
          await soundRef.current.setPositionAsync(0);
        }
        await soundRef.current.playAsync();
        setSpeaking(true);
      }
    } catch (e) {
      console.warn('[TTS] expo-av failed, fallback to speech', e);
      // Fallback на системный TTS
      await toggleSpeech();
    }
  };

  // --- expo-speech (системный TTS, fallback) ---
  const toggleSpeech = async () => {
    if (playing) {
      await Speech.stop();
      setSpeaking(false);
      return;
    }
    const clean = text
      .replace(/[*_`#~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();
    if (!clean) return;
    setSpeaking(true);
    Speech.speak(clean, {
      rate: 0.92,
      pitch: 1.0,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  return (
    <Pressable onPress={toggle} style={[s.audioBtn, glass]}>
      {playing
        ? <Square size={12} color="#FFD84A" fill="#FFD84A" />
        : useAV
          ? <Play size={13} color="rgba(255,255,255,0.7)" />
          : <Volume2 size={13} color="rgba(255,255,255,0.7)" />}
      <Text style={s.audioBtnText}>{playing ? 'Стоп' : 'Прослушать'}</Text>
    </Pressable>
  );
}

// ── Corrections ──────────────────────────────────────────────────────────────

function CorrectionsList({ corrections }: { corrections: NonNullable<AIMessage['corrections']> }) {
  return (
    <View style={s.corrections}>
      <View style={s.corrHeader}>
        <AlertCircle size={11} color="#f59e0b" />
        <Text style={s.corrLabel}>Поправки</Text>
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
        <Languages size={11} color="rgba(255,255,255,0.5)" />
        <Text style={s.transToggleText}>{open ? 'Скрыть перевод' : 'Показать перевод'}</Text>
        <ChevronDown
          size={11}
          color="rgba(255,255,255,0.5)"
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

export function ChatMessage({ message }: { message: AIMessage }) {
  const kind = roleKind(message.role);
  const isUser = kind === 'user';
  const isSystem = kind === 'system';
  if (isSystem) return null;

  return (
    <View style={[s.row, { flexDirection: isUser ? 'row-reverse' : 'row' }]}>
      {isUser ? (
        <LinearGradient colors={CTA} style={s.avatar}>
          <UserIcon size={15} color="#fff" />
        </LinearGradient>
      ) : (
        <View style={[s.avatar, glass]}>
          <Bot size={15} color="#fff" />
        </View>
      )}

      <View style={[s.col, { alignItems: isUser ? 'flex-end' : 'flex-start' }]}>
        {isUser ? (
          <LinearGradient colors={CTA} style={[s.bubble, s.bubbleUser]}>
            <Markdown style={mdUser}>{message.content || ' '}</Markdown>
          </LinearGradient>
        ) : (
          <View style={[s.bubble, s.bubbleAI, glass]}>
            <Markdown style={mdAI}>{message.content || ' '}</Markdown>
          </View>
        )}

        {!isUser && message.content ? (
          <SpeechButton text={message.content} audioUrl={message.audio_url} />
        ) : null}
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
  bubbleUser: {},
  bubbleAI: {},
  audioBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  audioBtnText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  corrections: {
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9, gap: 6,
    backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)', width: '100%',
  },
  corrHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  corrLabel: { color: '#f59e0b', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  corrRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  corrOrigWrap: { backgroundColor: 'rgba(248,113,113,0.15)', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 2 },
  corrOrig: { color: '#f87171', fontSize: 12, fontFamily: 'monospace', textDecorationLine: 'line-through' },
  corrArrow: { color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
  corrFixWrap: { backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 2 },
  corrFix: { color: '#10b981', fontSize: 12, fontFamily: 'monospace' },
  corrExpl: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '500' },
  transToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4, paddingVertical: 4 },
  transToggleText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },
  transBox: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginTop: 2 },
  transText: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500', fontStyle: 'italic' },
});

const mdBase = {
  body: { color: '#fff', fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  paragraph: { marginTop: 0, marginBottom: 0 },
  link: { color: '#FFD84A', textDecorationLine: 'underline' as const },
  code_inline: { backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 4, paddingHorizontal: 4, fontFamily: 'monospace', fontSize: 12 },
  fence: { backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: 8, padding: 8, fontFamily: 'monospace', fontSize: 12 },
  list_item: { marginBottom: 2 },
  bullet_list: { marginVertical: 2 },
  ordered_list: { marginVertical: 2 },
};

const mdAI = StyleSheet.create({ ...mdBase });
const mdUser = StyleSheet.create({ ...mdBase, body: { color: '#fff', fontSize: 14, fontWeight: '500' as const, lineHeight: 20 } });
