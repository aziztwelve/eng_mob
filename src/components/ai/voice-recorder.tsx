import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Mic, Pause, Play, RotateCcw, Square } from 'lucide-react-native';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { CTA } from '@/components/sunset';
import { SoundSlot } from '@/lib/audio';
import type { PronunciationAudioInput } from '@/lib/ai-api';
import { useTranslation } from 'react-i18next';

const MAX_DURATION_SEC = 60;
const GOLD: [string, string] = ['#FFDF5E', '#FFB338'];
const LIGHT_BLUE: [string, string] = ['#59C8FF', '#2FA8E6'];
type State = 'idle' | 'recording' | 'recorded' | 'denied';

const BAR_COUNT = 21;

// Round "3D" button: darker base + lighter gradient face shifted up (pressed edge).
function RoundButton({
  size,
  base,
  face,
  onPress,
  label,
  children,
}: {
  size: number;
  base: string;
  face: [string, string];
  onPress: () => void;
  label: string;
  children: React.ReactNode;
}) {
  const edge = 5;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ width: size, height: size }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: base,
          shadowColor: base,
          shadowOpacity: 0.35,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        }}
      >
        <LinearGradient
          colors={face}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: size - edge, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
        >
          <View style={{ position: 'absolute', top: 5, width: size * 0.34, height: size * 0.09, borderRadius: size * 0.045, backgroundColor: 'rgba(255,255,255,0.22)' }} />
          {children}
        </LinearGradient>
      </View>
    </Pressable>
  );
}

// Light (sky) idle state: big blue mic button.
function LightIdle({ onStart, hint, label }: { onStart: () => void; hint: string; label: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 14, paddingVertical: 10 }}>
      <RoundButton size={88} base="#2FA8E6" face={['#7FD6FF', '#59C8FF']} onPress={onStart} label={label}>
        <Mic size={36} color="#FFFFFF" />
      </RoundButton>
      <Text style={[s.hint, L.muted]}>{hint}</Text>
    </View>
  );
}

// Light (sky) recording state: glowing red stop button, live bars, timer with progress.
function LightRecording({
  onStop,
  elapsed,
  max,
  progress,
  label,
  hint,
}: {
  onStop: () => void;
  elapsed: string;
  max: string;
  progress: number;
  label: string;
  hint: string;
}) {
  const pulseA = useRef(new Animated.Value(0)).current;
  const pulseB = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const bars = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.2))).current;

  useEffect(() => {
    const ringLoop = (v: Animated.Value) =>
      Animated.loop(Animated.timing(v, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    const a = ringLoop(pulseA);
    a.start();
    const delay = setTimeout(() => ringLoop(pulseB).start(), 900);
    const dot = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.25, duration: 600, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    dot.start();
    const center = (BAR_COUNT - 1) / 2;
    const loops = bars.map((v, i) => {
      const envelope = 1 - Math.abs(i - center) / (center + 2);
      const peak = 0.3 + envelope * (0.55 + (((i * 37) % 30) / 100));
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: Math.min(1, peak), duration: 240 + (i % 5) * 70, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.16 + envelope * 0.1, duration: 280 + (i % 4) * 80, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return loop;
    });
    return () => {
      a.stop();
      clearTimeout(delay);
      pulseB.stopAnimation();
      dot.stop();
      loops.forEach((l) => l.stop());
    };
  }, [pulseA, pulseB, blink, bars]);

  const ring = (v: Animated.Value) => ({
    position: 'absolute' as const,
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#E5484D',
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }) }],
  });
  const center = (BAR_COUNT - 1) / 2;

  return (
    <View style={{ alignItems: 'center', gap: 8, paddingVertical: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, height: 30, paddingHorizontal: 14, borderRadius: 15, backgroundColor: '#FFECEC', borderWidth: 1.5, borderColor: '#FFC9CC' }}>
        <Animated.View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: '#E5484D', opacity: blink }} />
        <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#B4232A' }}>{label}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 34 }}>
        {bars.map((v, i) => (
          <Animated.View
            key={i}
            style={{
              width: 4,
              height: 34,
              borderRadius: 2,
              backgroundColor: Math.abs(i - center) < 5 ? '#2FA8E6' : '#8FD8FF',
              transform: [{ scaleY: v }],
            }}
          />
        ))}
      </View>

      <View style={{ width: 84, height: 84, alignItems: 'center', justifyContent: 'center', marginVertical: 2 }}>
        <Animated.View pointerEvents="none" style={ring(pulseA)} />
        <Animated.View pointerEvents="none" style={ring(pulseB)} />
        <RoundButton size={84} base="#C23A3F" face={['#FF7B7F', '#E5484D']} onPress={onStop} label={hint}>
          <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: '#FFFFFF' }} />
        </RoundButton>
      </View>

      <Text style={{ fontFamily: 'Nunito_900Black', fontSize: 32, color: '#171A1C', fontVariant: ['tabular-nums'] }}>
        {elapsed}
        <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#5D686F' }}> / {max}</Text>
      </Text>
      <View style={{ width: 200, height: 6, borderRadius: 3, backgroundColor: '#E6F4FB', overflow: 'hidden' }}>
        <View style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%`, height: '100%', borderRadius: 3, backgroundColor: '#E5484D' }} />
      </View>
    </View>
  );
}

export function VoiceRecorder({
  loading = false,
  minDurationSec = 0,
  light = false,
  onSubmit,
}: {
  light?: boolean;
  loading?: boolean;
  minDurationSec?: number;
  onSubmit: (input: PronunciationAudioInput, durationSec: number) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [state, setState] = useState<State>('idle');
  const [seconds, setSeconds] = useState(0);
  const [audio, setAudio] = useState<PronunciationAudioInput | null>(null);
  const [playing, setPlaying] = useState(false);

  const recorder = useAudioRecorder(Platform.OS === 'android' ? RecordingPresets.LOW_QUALITY : RecordingPresets.HIGH_QUALITY);
  const soundRef = useRef(new SoundSlot());
  const stopRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    return () => {
      // expo-audio may already have released the recorder on unmount.
      try {
        if (recorder.isRecording) void recorder.stop().catch(() => {});
      } catch {
        /* released */
      }
      soundRef.current.stop();
    };
  }, []);

  // Timer driven by wall-clock time (not by counting interval ticks), so the
  // counter keeps moving even if a tick is delayed or the component re-renders.
  useEffect(() => {
    if (state !== 'recording') return;
    const startedAt = Date.now();
    const id = setInterval(() => {
      const sec = Math.min(MAX_DURATION_SEC, Math.floor((Date.now() - startedAt) / 1000));
      setSeconds(sec);
      if (sec >= MAX_DURATION_SEC) void stopRef.current();
    }, 250);
    return () => clearInterval(id);
  }, [state]);

  const start = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) { setState('denied'); return; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setSeconds(0);
      setState('recording');
    } catch (e) { console.error('mic record failed', e); setState('denied'); }
  };

  const stop = async () => {
    try {
      // Always finalize: the UI is in 'recording' even if the native flag lags behind.
      if (recorder.isRecording) await recorder.stop();
      const uri = recorder.uri;
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
      if (!uri) { setState('idle'); return; }
      const { type, name } = inferAudioMeta(uri);
      setAudio({ uri, type, name });
      setState('recorded');
    } catch (e) { console.error('mic stop failed', e); setState('idle'); }
  };
  stopRef.current = stop;

  const togglePlay = async () => {
    if (!audio) return;
    try {
      if (!soundRef.current.isActive) {
        soundRef.current.play({ uri: audio.uri }, { keep: true, onFinish: () => setPlaying(false) });
        setPlaying(true);
        return;
      }
      setPlaying(await soundRef.current.toggle());
    } catch (e) { console.warn('playback failed', e); }
  };

  const reset = async () => {
    setSeconds(0); setAudio(null); setPlaying(false);
    soundRef.current.stop();
    setState('idle');
  };

  const canSubmit = seconds >= minDurationSec;
  const submit = async () => { if (audio && canSubmit) await onSubmit(audio, seconds); };

  if (state === 'denied') {
    return (
      <View style={[s.card, light && L.card]}>
        <Text style={[s.deniedTitle, light && L.ink]}>{t('voice.mic_denied')}</Text>
        <Text style={[s.deniedText, light && L.muted]}>{t('voice.mic_denied_desc')}</Text>
        <Pressable onPress={() => setState('idle')} style={[s.retryBtn, s.ghostBtn, light && L.ghost]}>
          <Text style={[s.ghostText, light && L.blueText]}>{t('voice.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[s.card, light && L.card]}>
      {state === 'idle' && light && <LightIdle onStart={start} hint={t('voice.hint', { sec: MAX_DURATION_SEC })} label={t('voice.hint', { sec: MAX_DURATION_SEC })} />}
      {state === 'recording' && light && (
        <LightRecording
          onStop={stop}
          elapsed={formatSeconds(seconds)}
          max={formatSeconds(MAX_DURATION_SEC)}
          progress={seconds / MAX_DURATION_SEC}
          label={t('voice.recording')}
          hint={t('voice.tap_to_stop')}
        />
      )}

      {state === 'idle' && !light && (
        <View style={s.center}>
          <Pressable onPress={start} style={s.micWrap}>
            <LinearGradient colors={light ? LIGHT_BLUE : CTA} style={s.micBtn}>
              <Mic size={28} color="#fff" />
            </LinearGradient>
          </Pressable>
          <Text style={[s.hint, light && L.muted]}>{t('voice.hint', { sec: MAX_DURATION_SEC })}</Text>
        </View>
      )}

      {state === 'recording' && !light && (
        <View style={s.center}>
          <Pressable onPress={stop} style={s.stopWrap}>
            <View style={s.stopBtn}>
              <Square size={24} color="#f87171" fill="#f87171" />
            </View>
          </Pressable>
          <Text style={[s.timer, light && L.ink]}>
            {formatSeconds(seconds)}
            <Text style={[s.timerMax, light && L.muted]}> / {formatSeconds(MAX_DURATION_SEC)}</Text>
          </Text>
          <Text style={s.recLabel}>● Запись…</Text>
        </View>
      )}

      {state === 'recorded' && audio && light && (
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable
              onPress={togglePlay}
              accessibilityRole="button"
              accessibilityLabel={playing ? t('voice.pause') : t('voice.play')}
              style={{ width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#59C8FF', borderBottomWidth: 4, borderBottomColor: '#2FA8E6' }}
            >
              {playing ? <Pause size={22} color="#FFFFFF" fill="#FFFFFF" /> : <Play size={22} color="#FFFFFF" fill="#FFFFFF" />}
            </Pressable>
            <View style={{ flex: 1, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F8FB', borderWidth: 1.5, borderColor: '#DDE3E8' }}>
              <Text style={{ fontFamily: 'Nunito_900Black', fontSize: 20, color: '#171A1C' }}>{formatSeconds(seconds)}</Text>
            </View>
            <Pressable
              onPress={reset}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={t('voice.rerec')}
              style={{ width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderBottomWidth: 4, borderColor: '#DDE3E8', borderBottomColor: '#D3DAE0', opacity: loading ? 0.45 : 1 }}
            >
              <RotateCcw size={20} color="#2FA8E6" />
            </Pressable>
          </View>
          <Pressable
            onPress={submit}
            disabled={loading || !canSubmit}
            accessibilityRole="button"
            accessibilityLabel={t('voice.check_btn')}
            style={{ height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: !canSubmit ? '#E3E8EC' : '#59C8FF', borderBottomWidth: 4, borderBottomColor: !canSubmit ? '#CDD4D9' : '#2FA8E6' }}
          >
            {loading
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: !canSubmit ? '#8A949B' : '#FFFFFF' }}>{t('voice.check_btn').replace(/\s*[→>]+\s*$/, '')}</Text>}
          </Pressable>
          {!canSubmit && <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 12, color: '#B26A00', textAlign: 'center' }}>{t('voice.min_dur', { dur: formatSeconds(minDurationSec) })}</Text>}
        </View>
      )}

      {state === 'recorded' && audio && !light && (
        <View style={{ gap: 10 }}>
          <View style={s.recordedRow}>
            <Pressable
              onPress={togglePlay}
              style={({ pressed }) => [s.playBtn, light && L.ghost, pressed && s.pressed]}
              accessibilityRole="button"
              accessibilityLabel={playing ? t('voice.pause') : t('voice.play')}
            >
              {playing
                ? <Pause size={18} color={light ? '#2FA8E6' : '#FFE166'} fill={light ? '#2FA8E6' : '#FFE166'} />
                : <Play size={18} color={light ? '#2FA8E6' : '#FFE166'} fill={light ? '#2FA8E6' : '#FFE166'} />}
            </Pressable>
            <View style={[s.durationBox, light && L.duration]}>
              <Text style={[s.duration, light && L.ink]}>{formatSeconds(seconds)}</Text>
            </View>
            <Pressable
              onPress={reset}
              disabled={loading}
              style={({ pressed }) => [s.rerecBtn, light && L.ghost, pressed && s.pressed, loading && s.disabled]}
              accessibilityRole="button"
              accessibilityLabel={t('voice.rerec')}
            >
              <RotateCcw size={15} color={light ? '#2FA8E6' : '#FFE166'} />
              <Text style={[s.rerecText, light && L.blueText]}>{t('voice.rerec')}</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={submit}
            disabled={loading || !canSubmit}
            style={({ pressed }) => [s.submitWrap, pressed && s.pressed, (loading || !canSubmit) && s.disabled]}
            accessibilityRole="button"
            accessibilityLabel={t('voice.check_btn')}
          >
            <LinearGradient colors={light ? LIGHT_BLUE : GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.submitBtn}>
              {loading
                ? <ActivityIndicator size="small" color="#3D0A1A" />
                : <Text style={[s.submitText, light && { color: '#FFFFFF' }]}>{t('voice.check_btn')}</Text>}
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

// Light (sky) overrides used on the redesigned lesson steps.
const L = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderColor: '#D6EFFC', borderWidth: 1.5, borderBottomWidth: 4 },
  ink: { color: '#171A1C', fontFamily: 'Nunito_900Black' },
  muted: { color: '#5D686F', fontFamily: 'Nunito_600SemiBold' },
  blueText: { color: '#2FA8E6' },
  ghost: { backgroundColor: '#EAF8FF', borderColor: '#59C8FF' },
  duration: { backgroundColor: '#F3F8FB', borderColor: '#DDE3E8' },
});
