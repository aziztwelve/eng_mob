import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { Mic, Pause, Play, Square, Trash2 } from 'lucide-react-native';
import { Audio } from 'expo-av';

import type { PronunciationAudioInput } from '@/lib/ai-api';

const MAX_DURATION_SEC = 60;

type State = 'idle' | 'recording' | 'recorded' | 'denied';

/**
 * VoiceRecorder — обёртка над expo-av Audio.Recording.
 *
 *  - Idle:      кнопка «Начать запись» (просит mic permission при клике).
 *  - Recording: timer + Stop.
 *  - Recorded:  replay (play/pause) + Send + Delete.
 *
 * Reset снаружи делается через `key`-prop (родитель меняет — RN
 * размонтирует и подчистит ресурсы в useEffect cleanup).
 *
 * MAX_DURATION_SEC = 60 — больше не нужно для произношения.
 */
export function VoiceRecorder({
  loading = false,
  onSubmit,
}: {
  /** API-вызов в процессе (lock UI). */
  loading?: boolean;
  /** Родитель решает, что делать с записью. */
  onSubmit: (input: PronunciationAudioInput, durationSec: number) => void | Promise<void>;
}) {
  const [state, setState] = useState<State>('idle');
  const [seconds, setSeconds] = useState(0);
  const [audio, setAudio] = useState<PronunciationAudioInput | null>(null);
  const [playing, setPlaying] = useState(false);

  const recRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup на unmount.
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      // Stop recorder если жив.
      const r = recRef.current;
      if (r) {
        r.stopAndUnloadAsync().catch(() => {});
        recRef.current = null;
      }
      const s = soundRef.current;
      if (s) {
        s.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const start = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setState('denied');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recRef.current = recording;
      setSeconds(0);
      setState('recording');

      tickRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          if (next >= MAX_DURATION_SEC) {
            // Принудительный stop. setTimeout — чтобы выйти из tick'а.
            setTimeout(() => stop(), 0);
          }
          return next;
        });
      }, 1000);
    } catch (e) {
      console.error('mic record failed', e);
      setState('denied');
    }
  };

  const stop = async () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    const rec = recRef.current;
    if (!rec) return;
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recRef.current = null;
      // Восстановим audio-mode для playback.
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      }).catch(() => {});
      if (!uri) {
        setState('idle');
        return;
      }
      const { type, name } = inferAudioMeta(uri);
      setAudio({ uri, type, name });
      setState('recorded');
    } catch (e) {
      console.error('mic stop failed', e);
      setState('idle');
    }
  };

  const togglePlay = async () => {
    if (!audio) return;
    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audio.uri },
          { shouldPlay: true },
        );
        soundRef.current = sound;
        setPlaying(true);
        sound.setOnPlaybackStatusUpdate((s) => {
          if (!s.isLoaded) return;
          if (s.didJustFinish) setPlaying(false);
        });
        return;
      }
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        setPlaying(false);
      } else {
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
      console.warn('playback failed', e);
    }
  };

  const reset = async () => {
    setSeconds(0);
    setAudio(null);
    setPlaying(false);
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {
        // noop
      }
      soundRef.current = null;
    }
    setState('idle');
  };

  const submit = async () => {
    if (!audio) return;
    await onSubmit(audio, seconds);
  };

  if (state === 'denied') {
    return (
      <View
        className="rounded-3xl p-5 gap-2"
        style={{
          borderWidth: 4,
          borderColor: 'rgba(255,75,75,0.3)',
          backgroundColor: 'rgba(255,75,75,0.05)',
        }}
      >
        <Text className="text-foreground font-black">
          Нет доступа к микрофону
        </Text>
        <Text className="text-muted-foreground font-medium text-sm">
          Разрешите доступ в настройках устройства и попробуйте снова.
        </Text>
        <Pressable
          onPress={() => setState('idle')}
          className="bg-card border-2 border-border rounded-xl px-3 py-2 self-start active:opacity-80"
        >
          <Text className="text-foreground font-bold">Попробовать снова</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="bg-card rounded-3xl border-4 border-border p-5 gap-3">
      {state === 'idle' && (
        <View className="items-center gap-3 py-4">
          <Pressable
            onPress={start}
            className="bg-primary h-20 w-20 rounded-full items-center justify-center active:opacity-80"
            style={{
              shadowColor: '#46a302',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 4,
            }}
            accessibilityLabel="Начать запись"
          >
            <Mic size={32} color="#1a1a1a" />
          </Pressable>
          <Text className="text-muted-foreground font-medium text-sm text-center">
            Нажмите и говорите. Максимум {MAX_DURATION_SEC} секунд.
          </Text>
        </View>
      )}

      {state === 'recording' && (
        <View className="items-center gap-3 py-4">
          <Pressable
            onPress={stop}
            className="bg-destructive h-20 w-20 rounded-full items-center justify-center active:opacity-80"
            accessibilityLabel="Остановить запись"
          >
            <Square size={28} color="#fff" fill="#fff" />
          </Pressable>
          <Text className="text-foreground font-black text-2xl tabular-nums">
            {formatSeconds(seconds)}
            <Text className="text-base text-muted-foreground">
              {' / '}
              {formatSeconds(MAX_DURATION_SEC)}
            </Text>
          </Text>
          <Text className="text-destructive font-bold text-xs uppercase tracking-wider">
            Запись…
          </Text>
        </View>
      )}

      {state === 'recorded' && audio && (
        <View className="gap-3">
          <View className="items-center gap-2">
            <Pressable
              onPress={togglePlay}
              className="bg-primary/15 border-4 border-primary h-16 w-16 rounded-full items-center justify-center active:opacity-80"
            >
              {playing ? (
                <Pause size={24} color="#58cc02" fill="#58cc02" />
              ) : (
                <Play size={24} color="#58cc02" fill="#58cc02" />
              )}
            </Pressable>
            <Text className="text-muted-foreground font-medium text-xs">
              Длительность: {formatSeconds(seconds)}
            </Text>
          </View>

          <View className="flex-row gap-2 justify-center">
            <Pressable
              onPress={reset}
              disabled={loading}
              className="bg-card border-2 border-border rounded-2xl px-3 py-2 flex-row items-center gap-2 active:opacity-80"
            >
              <Trash2 size={14} color="#9ca3af" />
              <Text className="text-muted-foreground font-bold text-sm">
                Перезаписать
              </Text>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={loading}
              className={`rounded-2xl px-4 py-2 flex-row items-center gap-2 ${
                loading ? 'bg-muted opacity-60' : 'bg-primary active:opacity-80'
              }`}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#1a1a1a" />
                  <Text className="text-primary-foreground font-black text-sm">
                    Проверяем…
                  </Text>
                </>
              ) : (
                <Text className="text-primary-foreground font-black text-sm">
                  Проверить произношение
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function inferAudioMeta(uri: string): { type: string; name: string } {
  // expo-av HIGH_QUALITY: iOS → .m4a, Android → .m4a (через AAC).
  const m = uri.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  const ext = (m?.[1] ?? (Platform.OS === 'ios' ? 'm4a' : 'm4a')).toLowerCase();
  const type =
    ext === 'm4a'
      ? 'audio/m4a'
      : ext === 'mp4'
        ? 'audio/mp4'
        : ext === 'aac'
          ? 'audio/aac'
          : ext === 'wav'
            ? 'audio/wav'
            : `audio/${ext}`;
  return { type, name: `recording.${ext}` };
}
