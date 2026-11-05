import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { useSendMessageStream, useTranscribeAudio } from '@/hooks/use-ai';
import { SoundSlot } from '@/lib/audio';
import { STT_RECORDING_OPTIONS, sttFormatMeta } from '@/lib/stt-recording';
import { getChatTTSUri } from '@/lib/tts';
import { speechChunks, splitSpokenSentences } from '@/lib/free-talk';
import type { AvatarExpression } from '@/lib/avatar-expression';

export type TalkPhase = 'idle' | 'starting' | 'listening' | 'thinking' | 'speaking';

/** One explicit tap starts recording. Closing/backgrounding never submits audio. */
export function useFreeTalk(conversationId: string, language: string) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<TalkPhase>('idle');
  const [speakingText, setSpeakingText] = useState('');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [avatarEmotion, setAvatarEmotion] = useState<AvatarExpression | null>(null);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [rate, setRate] = useState(1);
  const recorder = useAudioRecorder(STT_RECORDING_OPTIONS);
  const transcribe = useTranscribeAudio();
  const stream = useSendMessageStream(conversationId);
  const alive = useRef(true);
  const foreground = useRef(true);
  const busy = useRef(false);
  const permissionPrompt = useRef(false);
  const mode = useRef<TalkPhase>('idle');
  const player = useRef(new SoundSlot());
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const rateRef = useRef(rate);
  const turn = useRef(0);
  const stopRef = useRef<() => Promise<void>>(async () => {});
  const playbackEnd = useRef<(() => void) | null>(null);
  rateRef.current = rate;

  const changePhase = useCallback((next: TalkPhase) => {
    mode.current = next;
    if (alive.current) setPhase(next);
  }, []);
  const clearTimer = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);
  const stopPlayback = useCallback(() => {
    player.current.stop();
    playbackEnd.current?.();
    playbackEnd.current = null;
  }, []);
  const reportError = useCallback((error: unknown) => {
    if (alive.current) Toast.show({ type: 'error', text1: t('common.error'), text2: error instanceof Error ? error.message : undefined });
  }, [t]);

  const send = useCallback(async (text: string) => {
    const currentTurn = ++turn.current;
    setAvatarEmotion(null);
    let buffer = '';
    let hadDelta = false;
    let audioChain: Promise<void> = Promise.resolve();
    let audioFailed = false;
    const enqueueChunk = (sentence: string) => {
      // Fetch the next sentence while the current sentence is playing.
      const audio = getChatTTSUri(sentence, language).catch(() => { audioFailed = true; return ''; });
      audioChain = audioChain.then(async () => {
        const uri = await audio;
        if (!uri || !alive.current || !foreground.current || turn.current !== currentTurn) return;
        changePhase('speaking');
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        if (!alive.current || !foreground.current || turn.current !== currentTurn) return;
        await new Promise<void>((resolve) => {
          // A missing playback completion event must not lock the microphone.
          const timeout = setTimeout(() => { audioFailed = true; player.current.stop(); finish(); }, 45_000);
          const finish = () => { clearTimeout(timeout); playbackEnd.current = null; if (alive.current) setSpeakingText(''); resolve(); };
          playbackEnd.current = finish;
          try { setSpeakingText(sentence); player.current.play({ uri }, { rate: rateRef.current, onFinish: finish, onPlaybackChange: playing => { if (alive.current) setAudioPlaying(playing); } }); }
          catch { audioFailed = true; finish(); }
        });
      }).catch(() => { audioFailed = true; });
    };
    const enqueue = (sentence: string) => speechChunks(sentence).forEach(enqueueChunk);
    try {
      const reply = await stream.mutateAsync({ content: text, freeTalkSession: true, onAvatarEmotion: emotion => {
        if (alive.current && turn.current === currentTurn && (emotion === 'neutral' || emotion === 'happy' || emotion === 'thinking')) setAvatarEmotion(emotion);
      }, onDelta: (delta) => {
        if (!alive.current || turn.current !== currentTurn) return;
        hadDelta = true;
        buffer += delta;
        const part = splitSpokenSentences(buffer, false);
        buffer = part.rest;
        part.sentences.forEach(enqueue);
      } });
      if (!alive.current || turn.current !== currentTurn) return;
      // Some compatible servers deliver a final reply without delta events.
      if (!hadDelta) buffer = reply.assistant_message?.content ?? '';
      const tail = splitSpokenSentences(buffer, true);
      tail.sentences.forEach(enqueue);
      await audioChain;
      if (audioFailed && alive.current) Toast.show({ type: 'info', text1: t('freeTalk.audio_unavailable') });
    } catch (error) {
      turn.current += 1;
      stopPlayback();
      throw error;
    } finally {
      busy.current = false;
      changePhase('idle');
    }
  }, [changePhase, language, stopPlayback, stream, t]);

  const stopAndSend = useCallback(async () => {
    if (mode.current !== 'listening') return;
    const recordingTurn = turn.current;
    clearTimer();
    changePhase('thinking');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (!alive.current || !foreground.current || turn.current !== recordingTurn) { busy.current = false; changePhase('idle'); return; }
      if (!uri) throw new Error(t('freeTalk.recording_failed'));
      const meta = sttFormatMeta();
      const result = await transcribe.mutateAsync({ audio: { uri, type: meta.type, name: meta.name }, language, encoding: meta.encoding, sample_rate: meta.sampleRate });
      if (!alive.current || !foreground.current || turn.current !== recordingTurn) { busy.current = false; changePhase('idle'); return; }
      if (!result.text?.trim()) throw new Error(t('freeTalk.no_speech'));
      await send(result.text.trim());
    } catch (error) { busy.current = false; changePhase('idle'); reportError(error); }
  }, [changePhase, clearTimer, language, recorder, reportError, send, t, transcribe]);
  stopRef.current = stopAndSend;

  const start = useCallback(async () => {
    if (busy.current) return false;
    busy.current = true;
    const recordingTurn = ++turn.current;
    changePhase('starting');
    try {
      let permission = await getRecordingPermissionsAsync();
      if (!permission.granted) {
        permissionPrompt.current = true;
        try { permission = await requestRecordingPermissionsAsync(); }
        finally { permissionPrompt.current = false; }
      }
      if (!permission.granted) throw new Error(t('voice.mic_denied'));
      if (!alive.current || !foreground.current || turn.current !== recordingTurn) { busy.current = false; changePhase('idle'); return false; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      if (!alive.current || !foreground.current || turn.current !== recordingTurn) { await recorder.stop(); busy.current = false; changePhase('idle'); return false; }
      recorder.record();
      setRecordedSeconds(0);
      changePhase('listening');
      const began = Date.now();
      timer.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - began) / 1000);
        if (alive.current) setRecordedSeconds(Math.min(seconds, 30));
        if (seconds >= 30) void stopRef.current();
      }, 250);
      return true;
    } catch (error) { busy.current = false; changePhase('idle'); reportError(error); return false; }
  }, [changePhase, recorder, reportError, t]);

  // Discard audio locally without transcribing or sending it.
  const cancelRecording = useCallback(async () => {
    if (mode.current !== 'listening') return;
    turn.current += 1;
    clearTimer();
    changePhase('starting');
    try { await recorder.stop(); }
    catch (error) { reportError(error); }
    finally {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
      busy.current = false;
      changePhase('idle');
    }
  }, [changePhase, clearTimer, recorder, reportError]);

  const stopAtSessionLimit = useCallback(async () => {
    if (mode.current === 'listening') { await cancelRecording(); return; }
    turn.current += 1;
    stopPlayback();
    busy.current = false;
    changePhase('idle');
  }, [cancelRecording, changePhase, stopPlayback]);

  const sendText = useCallback(async (text: string) => {
    if (busy.current || !text.trim()) return false;
    busy.current = true;
    changePhase('thinking');
    try { await send(text.trim()); return true; }
    catch (error) { reportError(error); return false; }
  }, [changePhase, reportError, send]);

  useEffect(() => {
    alive.current = true;
    foreground.current = AppState.currentState !== 'background';
    const sound = player.current;
    const sub = AppState.addEventListener('change', (state) => {
      foreground.current = state === 'active';
      if (foreground.current || permissionPrompt.current) return;
      turn.current += 1;
      clearTimer();
      stopPlayback();
      if (mode.current === 'listening' || mode.current === 'starting') {
        const wasListening = mode.current === 'listening';
        changePhase('idle');
        if (wasListening) {
          try { void recorder.stop().catch(() => {}).finally(() => { busy.current = false; }); }
          catch { busy.current = false; }
        }
        // A pending permission / preparation finishes in start() and clears busy.

        void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
      }
    });
    return () => {
      alive.current = false;
      turn.current += 1;
      clearTimer();
      sub.remove();
      sound.stop();
      playbackEnd.current?.();
      try { if (recorder.isRecording) void recorder.stop().catch(() => {}); } catch { /* released */ }
      void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    };
  }, [changePhase, clearTimer, recorder, stopPlayback]);

  const changeRate = (value: number) => {
    rateRef.current = value;
    setRate(value);
    player.current.setRate(value);
  };
  return { phase, speakingText, audioPlaying, avatarEmotion, recordedSeconds, rate, setRate: changeRate, start, stopAndSend, cancelRecording, stopAtSessionLimit, sendText };
}
