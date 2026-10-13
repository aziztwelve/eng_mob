import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Mic, Pause, Play, RotateCcw, Square } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { CTA } from '@/components/sunset';
import type { PronunciationAudioInput } from '@/lib/ai-api';
import { useTranslation } from 'react-i18next';

const MAX_DURATION_SEC = 60;
const GOLD: [string, string] = ['#FFDF5E', '#FFB338'];
type State = 'idle' | 'recording' | 'recorded' | 'denied';

export function VoiceRecorder({
  loading = false,
  minDurationSec = 0,
  onSubmit,
}: {
  loading?: boolean;
  minDurationSec?: number;
  onSubmit: (input: PronunciationAudioInput, durationSec: number) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [state, setState] = useState<State>('idle');
  const [seconds, setSeconds] = useState(0);
  const [audio, setAudio] = useState<PronunciationAudioInput | null>(null);
  const [playing, setPlaying] = useState(false);

  const recRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      recRef.current?.stopAndUnloadAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const start = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) { setState('denied'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const options = Platform.OS === 'android'
        ? Audio.RecordingOptionsPresets.LOW_QUALITY
        : Audio.RecordingOptionsPresets.HIGH_QUALITY;
      const { recording } = await Audio.Recording.createAsync(options);
      recRef.current = recording;
      setSeconds(0);
      setState('recording');
      tickRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          if (next >= MAX_DURATION_SEC) setTimeout(() => stop(), 0);
          return next;
        });
      }, 1000);
    } catch (e) { console.error('mic record failed', e); setState('denied'); }
  };

  const stop = async () => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    const rec = recRef.current;
    if (!rec) return;
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recRef.current = null;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true }).catch(() => {});
      if (!uri) { setState('idle'); return; }
      const { type, name } = inferAudioMeta(uri);
      setAudio({ uri, type, name });
      setState('recorded');
    } catch (e) { console.error('mic stop failed', e); setState('idle'); }
  };

  const togglePlay = async () => {
    if (!audio) return;
    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync({ uri: audio.uri }, { shouldPlay: true });
        soundRef.current = sound;
        setPlaying(true);
        sound.setOnPlaybackStatusUpdate((s) => { if (s.isLoaded && s.didJustFinish) setPlaying(false); });
        return;
      }
      const st = await soundRef.current.getStatusAsync();
      if (!st.isLoaded) return;
      if (st.isPlaying) { await soundRef.current.pauseAsync(); setPlaying(false); }
      else {
        if (st.positionMillis && st.durationMillis && st.positionMillis >= st.durationMillis)
          await soundRef.current.setPositionAsync(0);
        await soundRef.current.playAsync(); setPlaying(true);
      }
    } catch (e) { console.warn('playback failed', e); }
  };

  const reset = async () => {
    setSeconds(0); setAudio(null); setPlaying(false);
    try { await soundRef.current?.unloadAsync(); } catch {}
    soundRef.current = null;
    setState('idle');
  };

  const canSubmit = seconds >= minDurationSec;
  const submit = async () => { if (audio && canSubmit) await onSubmit(audio, seconds); };

  if (state === 'denied') {
    return (
      <View style={s.card}>
        <Text style={s.deniedTitle}>{t('voice.mic_denied')}</Text>
        <Text style={s.deniedText}>{t('voice.mic_denied_desc')}</Text>
        <Pressable onPress={() => setState('idle')} style={[s.retryBtn, s.ghostBtn]}>
          <Text style={s.ghostText}>{t('voice.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.card}>
      {state === 'idle' && (
        <View style={s.center}>
          <Pressable onPress={start} style={s.micWrap}>
            <LinearGradient colors={CTA} style={s.micBtn}>
              <Mic size={28} color="#fff" />
            </LinearGradient>
          </Pressable>
          <Text style={s.hint}>{t('voice.hint', { sec: MAX_DURATION_SEC })}</Text>
        </View>
      )}

      {state === 'recording' && (
        <View style={s.center}>
          <Pressable onPress={stop} style={s.stopWrap}>
            <View style={s.stopBtn}>
              <Square size={24} color="#f87171" fill="#f87171" />
            </View>
          </Pressable>
          <Text style={s.timer}>
            {formatSeconds(seconds)}
            <Text style={s.timerMax}> / {formatSeconds(MAX_DURATION_SEC)}</Text>
          </Text>
          <Text style={s.recLabel}>● Запись…</Text>
        </View>
      )}

      {state === 'recorded' && audio && (
        <View style={{ gap: 10 }}>
          <View style={s.recordedRow}>
            <Pressable
              onPress={togglePlay}
              style={({ pressed }) => [s.playBtn, pressed && s.pressed]}
              accessibilityRole="button"
              accessibilityLabel={playing ? t('voice.pause') : t('voice.play')}
            >
              {playing
                ? <Pause size={18} color="#FFE166" fill="#FFE166" />
                : <Play size={18} color="#FFE166" fill="#FFE166" />}
            </Pressable>
            <View style={s.durationBox}>
              <Text style={s.duration}>{formatSeconds(seconds)}</Text>
            </View>
            <Pressable
              onPress={reset}
              disabled={loading}
              style={({ pressed }) => [s.rerecBtn, pressed && s.pressed, loading && s.disabled]}
              accessibilityRole="button"
              accessibilityLabel={t('voice.rerec')}
            >
              <RotateCcw size={15} color="#FFE166" />
              <Text style={s.rerecText}>{t('voice.rerec')}</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={submit}
            disabled={loading || !canSubmit}
            style={({ pressed }) => [s.submitWrap, pressed && s.pressed, (loading || !canSubmit) && s.disabled]}
            accessibilityRole="button"
            accessibilityLabel={t('voice.check_btn')}
          >
            <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.submitBtn}>
              {loading
                ? <ActivityIndicator size="small" color="#3D0A1A" />
                : <Text style={s.submitText}>{t('voice.check_btn')}</Text>}
            </LinearGradient>
          </Pressable>
          {!canSubmit && <Text style={s.minDuration}>{t('voice.min_dur', { dur: formatSeconds(minDurationSec) })}</Text>}
        </View>
      )}
    </View>
  );
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function inferAudioMeta(uri: string): { type: string; name: string } {
  const m = uri.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  const ext = (m?.[1] ?? 'm4a').toLowerCase();
  const type = ext === '3gp' || ext === '3gpp' ? 'audio/3gpp' : ext === 'm4a' ? 'audio/m4a' : ext === 'mp4' ? 'audio/mp4' : ext === 'aac' ? 'audio/aac' : ext === 'wav' ? 'audio/wav' : `audio/${ext}`;
  return { type, name: `recording.${ext}` };
}

const s = StyleSheet.create({
  // Deep plum glass + gold hairline — the inner-panel surface of the bank player
  card: {
    borderRadius: 18, padding: 16, gap: 8,
    backgroundColor: 'rgba(42, 13, 66, 0.55)',
    borderWidth: 1, borderColor: 'rgba(255, 224, 104, 0.22)',
  },
  center: { alignItems: 'center', gap: 12, paddingVertical: 6 },

  micWrap: { borderRadius: 40, overflow: 'hidden' },
  micBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  hint: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '500', textAlign: 'center' },

  stopWrap: {},
  stopBtn: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderWidth: 2, borderColor: 'rgba(248,113,113,0.35)',
  },
  timer: { color: '#fff', fontSize: 26, fontWeight: '900' },
  timerMax: { color: 'rgba(255,255,255,0.45)', fontSize: 16, fontWeight: '600' },
  recLabel: { color: '#f87171', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

  pressed: { opacity: 0.86 },
  disabled: { opacity: 0.45 },

  // Recorded: compact row [play | duration | rerec] + full-width gold check
  recordedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playBtn: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,224,95,0.14)', borderWidth: 1, borderColor: 'rgba(255,224,95,0.36)',
  },
  durationBox: {
    flex: 1, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(65, 11, 71, 0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  duration: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.4 },
  minDuration: { color: '#f59e0b', fontSize: 12, fontWeight: '600', textAlign: 'center' },

  ghostBtn: {
    backgroundColor: 'rgba(255,224,95,0.10)', borderWidth: 1, borderColor: 'rgba(255,224,95,0.34)',
  },
  ghostText: { color: '#FFE166', fontWeight: '900', fontSize: 13 },

  rerecBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    minHeight: 44, borderRadius: 14, paddingHorizontal: 13,
    backgroundColor: 'rgba(255,224,95,0.10)', borderWidth: 1, borderColor: 'rgba(255,224,95,0.34)',
  },
  rerecText: { color: '#FFE166', fontSize: 12.5, fontWeight: '800' },

  submitWrap: {
    borderRadius: 15, overflow: 'hidden',
    shadowColor: '#FFB338', shadowOpacity: 0.42, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  submitBtn: { paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#3D0A1A', fontSize: 14.5, fontWeight: '900' },

  deniedTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  deniedText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500' },
  retryBtn: { borderRadius: 13, paddingHorizontal: 14, paddingVertical: 9, alignSelf: 'flex-start', marginTop: 4 },
});
