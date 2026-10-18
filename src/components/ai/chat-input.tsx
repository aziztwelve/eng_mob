import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Mic, Send, Square } from 'lucide-react-native';
import {
  AudioQuality,
  IOSOutputFormat,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  type RecordingOptions,
} from 'expo-audio';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { glass, CTA } from '@/components/sunset';
import { useTranscribeAudio } from '@/hooks/use-ai';
import { useTranslation } from 'react-i18next';

const MAX_STT_SEC = 60;
const STT_SAMPLE_RATE = 16000;

// Google STT recognize НЕ поддерживает m4a/AAC (пресет HIGH_QUALITY), поэтому
// пишем в формат, который Google умеет декодировать на каждой платформе:
//   • Android — AMR_WB @ 16 kHz (encoder/format AMR_WB)
//   • iOS     — LINEAR16 WAV @ 16 kHz (LinearPCM)
//   • Web     — WEBM/Opus (MediaRecorder по умолчанию, 48 kHz)
const STT_RECORDING_OPTIONS: RecordingOptions = {
  isMeteringEnabled: false,
  numberOfChannels: 1,
  extension: '.wav',
  sampleRate: STT_SAMPLE_RATE,
  bitRate: 23850, // AMR-WB max mode (Android); ignored for LINEARPCM on iOS
  android: {
    extension: '.amr',
    outputFormat: 'amrwb',
    audioEncoder: 'amr_wb',
    sampleRate: STT_SAMPLE_RATE,
  },
  ios: {
    extension: '.wav',
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.HIGH,
    sampleRate: STT_SAMPLE_RATE,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

// sttFormatMeta — Google STT encoding + sample_rate + meta файла под текущую ОС.
function sttFormatMeta(): {
  encoding: string;
  sampleRate: number;
  type: string;
  name: string;
} {
  if (Platform.OS === 'ios') {
    return { encoding: 'LINEAR16', sampleRate: STT_SAMPLE_RATE, type: 'audio/wav', name: 'recording.wav' };
  }
  if (Platform.OS === 'web') {
    return { encoding: 'WEBM_OPUS', sampleRate: 48000, type: 'audio/webm', name: 'recording.webm' };
  }
  // android
  return { encoding: 'AMR_WB', sampleRate: STT_SAMPLE_RATE, type: 'audio/amr-wb', name: 'recording.amr' };
}

export function ChatInput({
  onSend,
  loading = false,
  placeholder,
  showMic = true,
  language,
  light = false,
}: {
  /** Светлое (sky) оформление для шагов урока. */
  light?: boolean;
  onSend: (content: string, wantAudio: boolean) => void | Promise<void>;
  loading?: boolean;
  placeholder?: string;
  /** Показывать кнопку голосового ввода (STT). */
  showMic?: boolean;
  /** Язык распознавания (target_language конверсации): 'en' | 'ru' | ... */
  language?: string;
}) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  // Локальный ref — блокирует повторный тап до завершения отправки
  const submittingRef = useRef(false);

  // === Голосовой ввод (STT) ===
  const [recording, setRecording] = useState(false);
  const recorder = useAudioRecorder(STT_RECORDING_OPTIONS);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcribeMut = useTranscribeAudio();
  const transcribing = transcribeMut.isPending;

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      try {
        if (recorder.isRecording) void recorder.stop().catch(() => {});
      } catch {
        /* released */
      }
    };
  }, []);

  const submit = async () => {
    if (submittingRef.current || loading) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    submittingRef.current = true;
    setText('');
    try {
      // want_audio=false — озвучка реплик идёт on-demand через Google TTS
      // (кнопка «Прослушать»), серверный OpenAI-TTS не дёргаем.
      await onSend(trimmed, false);
    } finally {
      submittingRef.current = false;
    }
  };

  const startRec = async () => {
    if (loading || transcribing) return;
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Toast.show({
          type: 'error',
          text1: t('voice.mic_denied'),
          text2: t('voice.mic_denied_desc'),
        });
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
      let elapsed = 0;
      tickRef.current = setInterval(() => {
        elapsed += 1;
        if (elapsed >= MAX_STT_SEC) stopRecAndTranscribe();
      }, 1000);
    } catch (e) {
      console.error('mic record failed', e);
      Toast.show({ type: 'error', text1: 'Не удалось начать запись' });
    }
  };

  const stopRecAndTranscribe = async () => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    setRecording(false);
    if (!recorder.isRecording) return;
    try {
      await recorder.stop();
      const uri = recorder.uri;
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
      if (!uri) return;
      const meta = sttFormatMeta();
      const out = await transcribeMut.mutateAsync({
        audio: { uri, type: meta.type, name: meta.name },
        language,
        encoding: meta.encoding,
        sample_rate: meta.sampleRate,
      });
      const recognized = out.text?.trim();
      if (!recognized) {
        Toast.show({ type: 'info', text1: t('voice.speech_unrecognized'), text2: t('voice.speak_clearer') });
        return;
      }
      setText((prev) => (prev.trim() ? `${prev.trim()} ${recognized}` : recognized));
    } catch (e) {
      console.error('transcribe failed', e);
      Toast.show({
        type: 'error',
        text1: 'Не удалось распознать',
        text2: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const canSubmit = text.trim().length > 0 && !loading;
  const micBusy = loading || transcribing;

  return (
    <View style={[s.wrap, light ? L.wrap : glass]}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={transcribing ? 'Распознаём речь…' : placeholder}
        placeholderTextColor={light ? '#8A949B' : 'rgba(255,255,255,0.35)'}
        editable={!loading && !transcribing}
        multiline
        numberOfLines={1}
        style={[s.input, light && L.input]}
      />

      {showMic && (
        <Pressable
          onPress={recording ? stopRecAndTranscribe : startRec}
          disabled={micBusy}
          style={[s.iconBtn, recording ? s.iconBtnRec : light ? L.icon : glass]}
          accessibilityLabel={recording ? 'Stop recording' : 'Voice input'}
        >
          {transcribing ? (
            <ActivityIndicator size="small" color="#FFD84A" />
          ) : recording ? (
            <Square size={15} color="#f87171" fill="#f87171" />
          ) : (
            <Mic size={17} color={light ? '#2FA8E6' : 'rgba(255,255,255,0.55)'} />
          )}
        </Pressable>
      )}

      <Pressable onPress={submit} disabled={!canSubmit || loading} style={s.sendWrap}>
        <LinearGradient
          colors={canSubmit ? (light ? ['#59C8FF', '#2FA8E6'] : CTA) : light ? ['#E3E8EC', '#E3E8EC'] : ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.12)']}
          style={s.sendBtn}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Send size={17} color={canSubmit ? '#fff' : light ? '#8A949B' : 'rgba(255,255,255,0.4)'} />
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 22,
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 6,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 10,
    paddingVertical: 9,
    maxHeight: 120,
    minHeight: 40,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: 'rgba(168,36,63,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(168,36,63,0.4)',
  },
  iconBtnRec: {
    backgroundColor: 'rgba(248,113,113,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.4)',
  },
  sendWrap: { borderRadius: 14, overflow: 'hidden' },
  sendBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
});

const L = StyleSheet.create({
  wrap: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderBottomWidth: 4, borderColor: '#DDE3E8', borderBottomColor: '#D3DAE0' },
  input: { color: '#171A1C' },
  icon: { backgroundColor: '#EAF8FF', borderWidth: 1, borderColor: '#59C8FF' },
});
