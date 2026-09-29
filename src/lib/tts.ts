import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

import { AIApi } from './ai-api';

/**
 * On-demand TTS для флешкарт/словаря (path A — Google Cloud TTS).
 *
 * Флоу:
 *   1. Считаем стабильный ключ из (language, text).
 *   2. Если mp3 уже лежит в cacheDirectory — играем его (без сети).
 *   3. Иначе зовём POST /ai/tts, декодируем base64 → пишем файл → играем.
 *
 * Локальный кэш убирает повторные запросы к Google при многократном
 * проигрывании одного слова.
 */

const CACHE_DIR = (FileSystem.cacheDirectory ?? '') + 'tts/';

let currentSound: Audio.Sound | null = null;
const pendingAudio = new Map<string, Promise<string>>();
const remoteAudio = new Map<string, string>();

function cacheKey(text: string, language: string): string {
  return `${language}_${text}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

async function ensureDir(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  } catch {
    /* noop — попробуем писать напрямую */
  }
}

async function playUri(uri: string, rate = 1): Promise<void> {
  // Останавливаем предыдущий звук, чтобы не накладывались.
  if (currentSound) {
    await currentSound.unloadAsync().catch(() => {});
    currentSound = null;
  }
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true, volume: 1.0, rate, shouldCorrectPitch: true },
  );
  currentSound = sound;
  sound.setOnPlaybackStatusUpdate((status) => {
    if ('didJustFinish' in status && status.didJustFinish) {
      sound.unloadAsync().catch(() => {});
      if (currentSound === sound) currentSound = null;
    }
  });
}

/**
 * playWordTTS — синтезирует (или берёт из кэша) и проигрывает слово.
 * Бросает только при сетевой/IO-ошибке; вызывающий код может игнорировать.
 */
async function cachedWordTTSUri(
  text: string,
  language = 'en',
  voice?: string,
): Promise<string> {
  const t = text.trim();
  if (!t) return '';

  await ensureDir();
  const uri = `${CACHE_DIR}${cacheKey(t, language)}.mp3`;

  const cached = await FileSystem.getInfoAsync(uri).catch(() => ({ exists: false }) as { exists: boolean });
  if (cached.exists) return uri;
  const cachedRemote = remoteAudio.get(uri);
  if (cachedRemote) return cachedRemote;

  const pending = pendingAudio.get(uri);
  if (pending) return pending;

  const request = (async () => {
    const resp = await AIApi.synthesizeTTS({ text: t, language, voice });
    if (resp.audio_content) {
      await FileSystem.writeAsStringAsync(uri, resp.audio_content, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return uri;
    } else if (resp.audio_url) {
      // Path B is already a permanent public object. Keep its URL for this
      // screen session so a prefetch is shared with the subsequent tap.
      remoteAudio.set(uri, resp.audio_url);
      return resp.audio_url;
    }
    throw new Error('tts: empty audio response');
  })();
  pendingAudio.set(uri, request);
  try {
    return await request;
  } finally {
    pendingAudio.delete(uri);
  }
}

/** Start TTS while the word screen is opening, before the learner presses play. */
export async function prefetchWordTTS(text: string, language = 'en', voice?: string): Promise<void> {
  await cachedWordTTSUri(text, language, voice);
}

/** Plays a cached/preloaded word. The first request is shared with prefetch. */
export async function playWordTTS(
  text: string,
  language = 'en',
  voice?: string,
  rate = 1,
): Promise<void> {
  const uri = await cachedWordTTSUri(text, language, voice);
  if (!uri) return;

  await playUri(uri, rate);
}


// ── Чат: озвучка реплик ассистента (тоже Google Cloud TTS) ──────────────────

// Совпадает с backend maxTTSChars (services/ai-service/internal/service/tts.go).
// Длинные реплики обрезаем, чтобы не ловить InvalidArgument от gateway.
const MAX_TTS_CHARS = 500;

/** Убираем markdown → плоский текст для синтеза. */
function cleanForTTS(text: string): string {
  return text
    .replace(/[*_`#~>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Стабильный хэш (djb2) для имени файла кэша. cacheKey() режет до 80 символов
 * и не годится для длинных реплик (коллизии), поэтому для чата — хэш.
 */
function hashKey(text: string, language: string): string {
  const str = `${language}|${text}`;
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  }
  return `c${(h >>> 0).toString(36)}`;
}

/**
 * getChatTTSUri — синтезирует реплику ассистента через Google Cloud TTS
 * (POST /ai/tts, path A — inline base64), кэширует mp3 в файловой системе
 * и возвращает локальный uri для проигрывания в expo-av.
 *
 * Жёсткая привязка к Google TTS: никакого системного голоса/OpenAI —
 * только бэкендный Google-синтезатор. Markdown чистится, текст режется
 * до backend-лимита (MAX_TTS_CHARS).
 */
export async function getChatTTSUri(
  text: string,
  language = 'en',
  voice?: string,
): Promise<string> {
  let t = cleanForTTS(text);
  if (!t) throw new Error('tts: empty text');
  if (t.length > MAX_TTS_CHARS) t = t.slice(0, MAX_TTS_CHARS);

  await ensureDir();
  const uri = `${CACHE_DIR}${hashKey(t, language)}.mp3`;

  const cached = await FileSystem.getInfoAsync(uri).catch(
    () => ({ exists: false }) as { exists: boolean },
  );
  if (cached.exists) return uri;

  const resp = await AIApi.synthesizeTTS({ text: t, language, voice });
  if (resp.audio_content) {
    await FileSystem.writeAsStringAsync(uri, resp.audio_content, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return uri;
  }
  // Path B (storage URL) — играем напрямую, без локального кэша.
  if (resp.audio_url) return resp.audio_url;
  throw new Error('tts: empty audio response');
}
