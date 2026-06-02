import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertCircle, Bot, ChevronDown, Languages, Pause, Play, User as UserIcon } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { Audio } from 'expo-av';

import type { AIMessage } from '@/types/api';

/**
 * ChatMessage — bubble одного сообщения чата (mirror web).
 *
 *  - user-сообщения справа (primary background).
 *  - assistant-сообщения слева (card background) +
 *      corrections (для предыдущего user-сообщения) + translation (раскрывается).
 *  - audio_url проигрывается через expo-av Audio.Sound.
 *  - Markdown рендерим через react-native-markdown-display.
 *  - Системные сообщения скрываем — это служебный prompt-контекст.
 */
export function ChatMessage({ message }: { message: AIMessage }) {
  const isUser = message.role === 'MESSAGE_ROLE_USER';
  const isSystem = message.role === 'MESSAGE_ROLE_SYSTEM';

  if (isSystem) return null;

  return (
    <View
      className="flex-row gap-2 px-1"
      style={{ flexDirection: isUser ? 'row-reverse' : 'row' }}
    >
      <View
        className={`w-9 h-9 rounded-2xl items-center justify-center shrink-0 ${
          isUser
            ? 'bg-primary'
            : 'bg-card border-2 border-border'
        }`}
      >
        {isUser ? (
          <UserIcon size={16} color="#1a1a1a" />
        ) : (
          <Bot size={16} color="#fff" />
        )}
      </View>

      <View
        className="flex-1 gap-1.5"
        style={{ alignItems: isUser ? 'flex-end' : 'flex-start' }}
      >
        <View
          className={`rounded-2xl px-3 py-2 border-2 max-w-[88%] ${
            isUser
              ? 'bg-primary border-primary'
              : 'bg-card border-border'
          }`}
        >
          <Markdown
            style={isUser ? mdStylesUser : mdStylesAssistant}
          >
            {message.content || ' '}
          </Markdown>
        </View>

        {message.audio_url && !isUser && <MessageAudio uri={message.audio_url} />}

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

// ----------------------------------------------------------------------------
// Audio playback
// ----------------------------------------------------------------------------

function MessageAudio({ uri }: { uri: string }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      // Cleanup при unmount
      soundRef.current
        ?.unloadAsync()
        .catch(() => {})
        .finally(() => {
          soundRef.current = null;
        });
    };
  }, []);

  const toggle = async () => {
    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
        );
        soundRef.current = sound;
        setPlaying(true);
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            setPlaying(false);
          }
        });
        return;
      }
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        setPlaying(false);
      } else {
        // Replay from start если уже доиграл
        if (
          status.positionMillis &&
          status.durationMillis &&
          status.positionMillis >= status.durationMillis
        ) {
          await soundRef.current.setPositionAsync(0);
        }
        await soundRef.current.playAsync();
        setPlaying(true);
      }
    } catch (e) {
      console.warn('audio play failed', e);
    }
  };

  return (
    <Pressable
      onPress={toggle}
      className="flex-row items-center gap-2 bg-card border-2 border-border rounded-xl px-3 py-1.5 active:opacity-80"
    >
      {playing ? (
        <Pause size={14} color="#9ca3af" />
      ) : (
        <Play size={14} color="#9ca3af" />
      )}
      <Text className="text-muted-foreground font-bold text-xs">
        {playing ? 'Пауза' : 'Прослушать'}
      </Text>
    </Pressable>
  );
}

// ----------------------------------------------------------------------------
// Corrections
// ----------------------------------------------------------------------------

function CorrectionsList({
  corrections,
}: {
  corrections: NonNullable<AIMessage['corrections']>;
}) {
  return (
    <View
      className="rounded-2xl px-3 py-2 gap-2 w-full"
      style={{
        borderWidth: 2,
        borderColor: 'rgba(245,158,11,0.3)',
        backgroundColor: 'rgba(245,158,11,0.05)',
      }}
    >
      <View className="flex-row items-center gap-1.5">
        <AlertCircle size={12} color="#f59e0b" />
        <Text className="text-amber-500 font-black text-[10px] uppercase tracking-wider">
          Поправки
        </Text>
      </View>
      {corrections.map((c, i) => (
        <View key={i} className="gap-0.5">
          <View className="flex-row flex-wrap items-center gap-1">
            <View className="rounded-lg px-2 py-0.5 bg-destructive/15">
              <Text
                className="text-destructive font-mono text-xs"
                style={{ textDecorationLine: 'line-through' }}
              >
                {c.original}
              </Text>
            </View>
            <Text className="text-muted-foreground font-bold">→</Text>
            <View className="rounded-lg px-2 py-0.5 bg-emerald-500/15">
              <Text className="text-emerald-500 font-mono text-xs">
                {c.corrected}
              </Text>
            </View>
          </View>
          {c.explanation && (
            <Text className="text-muted-foreground font-medium text-xs">
              {c.explanation}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

// ----------------------------------------------------------------------------
// Translation toggle
// ----------------------------------------------------------------------------

function TranslationToggle({ translation }: { translation: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View className="w-full">
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center gap-1 px-1 active:opacity-60"
      >
        <Languages size={12} color="#9ca3af" />
        <Text className="text-muted-foreground font-bold text-xs">
          {open ? 'Скрыть перевод' : 'Показать перевод'}
        </Text>
        <ChevronDown
          size={12}
          color="#9ca3af"
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>
      {open && (
        <View className="rounded-xl bg-muted/40 border border-border px-3 py-2 mt-1">
          <Text
            className="text-muted-foreground font-medium text-sm"
            style={{ fontStyle: 'italic' }}
          >
            {translation}
          </Text>
        </View>
      )}
    </View>
  );
}

// ----------------------------------------------------------------------------
// Markdown styles (react-native-markdown-display use StyleSheet objects)
// ----------------------------------------------------------------------------

const mdBase = {
  body: { color: '#fff', fontSize: 15, fontWeight: '500' as const },
  paragraph: { marginTop: 0, marginBottom: 0 },
  link: { color: '#00FFA3', textDecorationLine: 'underline' as const },
  code_inline: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    borderRadius: 4,
    paddingHorizontal: 4,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  fence: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#fff',
    borderRadius: 8,
    padding: 8,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  list_item: { marginBottom: 2 },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
};

const mdStylesAssistant = StyleSheet.create({
  ...mdBase,
});

const mdStylesUser = StyleSheet.create({
  ...mdBase,
  body: { color: '#1a1a1a', fontSize: 15, fontWeight: '500' as const },
  link: { color: '#1a1a1a', textDecorationLine: 'underline' as const },
  code_inline: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    color: '#1a1a1a',
    borderRadius: 4,
    paddingHorizontal: 4,
    fontFamily: 'monospace',
    fontSize: 13,
  },
});
