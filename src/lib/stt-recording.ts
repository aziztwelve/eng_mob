import { Platform } from 'react-native';
import { AudioQuality, IOSOutputFormat, type RecordingOptions } from 'expo-audio';

/**
 * Recording format for voice input (speech to text). It has to match the
 * speech-to-text provider on the server (`AI_STT_PROVIDER` in ai-service):
 *
 *   google (default)  Android AMR_WB, iOS LINEAR16 WAV, web WEBM/Opus.
 *                     Google STT does not decode m4a/AAC.
 *   openai            Android m4a (AAC), iOS WAV, web WEBM. OpenAI accepts
 *                     mp3/mp4/m4a/wav/webm but not AMR.
 *
 * Set `EXPO_PUBLIC_STT_PROVIDER=openai` together with `AI_STT_PROVIDER=openai`
 * on the server; switching only one side breaks voice input on Android.
 */
export const STT_PROVIDER: 'google' | 'openai' =
  process.env.EXPO_PUBLIC_STT_PROVIDER === 'openai' ? 'openai' : 'google';

export const STT_SAMPLE_RATE = 16000;

const ANDROID_RECORDING: NonNullable<RecordingOptions['android']> =
  STT_PROVIDER === 'openai'
    ? { extension: '.m4a', outputFormat: 'mpeg4', audioEncoder: 'aac', sampleRate: STT_SAMPLE_RATE }
    : { extension: '.amr', outputFormat: 'amrwb', audioEncoder: 'amr_wb', sampleRate: STT_SAMPLE_RATE };

export const STT_RECORDING_OPTIONS: RecordingOptions = {
  isMeteringEnabled: false,
  numberOfChannels: 1,
  extension: '.wav',
  sampleRate: STT_SAMPLE_RATE,
  // AMR-WB max mode for google; 48 kbps AAC is plenty for speech.
  bitRate: STT_PROVIDER === 'openai' ? 48000 : 23850,
  android: ANDROID_RECORDING,
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

export interface SttFormatMeta {
  /** Google-only hint; ignored by the OpenAI adapter. */
  encoding: string;
  sampleRate: number;
  /** Mime type of the uploaded file (OpenAI picks the extension from it). */
  type: string;
  name: string;
}

export function sttFormatMeta(): SttFormatMeta {
  if (Platform.OS === 'ios') {
    return { encoding: 'LINEAR16', sampleRate: STT_SAMPLE_RATE, type: 'audio/wav', name: 'recording.wav' };
  }
  if (Platform.OS === 'web') {
    return { encoding: 'WEBM_OPUS', sampleRate: 48000, type: 'audio/webm', name: 'recording.webm' };
  }
  if (STT_PROVIDER === 'openai') {
    return { encoding: 'AAC', sampleRate: STT_SAMPLE_RATE, type: 'audio/m4a', name: 'recording.m4a' };
  }
  return { encoding: 'AMR_WB', sampleRate: STT_SAMPLE_RATE, type: 'audio/amr-wb', name: 'recording.amr' };
}
