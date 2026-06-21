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

async function playUri(uri: string): Promise<void> {
  // Останавливаем предыдущий звук, чтобы не накладывались.
  if (currentSound) {
    await currentSound.unloadAsync().catch(() => {});
    currentSound = null;
  }
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true, volume: 1.0 },
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
export async function playWordTTS(
  text: string,
  language = 'en',
  voice?: string,
): Promise<void> {
  const t = text.trim();
  if (!t) return;

  await ensureDir();
  const uri = `${CACHE_DIR}${cacheKey(t, language)}.mp3`;

  const cached = await FileSystem.getInfoAsync(uri).catch(() => ({ exists: false }) as { exists: boolean });
  if (!cached.exists) {
    const resp = await AIApi.synthesizeTTS({ text: t, language, voice });
    if (resp.audio_content) {
      await FileSystem.writeAsStringAsync(uri, resp.audio_content, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } else if (resp.audio_url) {
      // Fallback path B (storage URL) — играем напрямую, без кэша файла.
      await playUri(resp.audio_url);
      return;
    } else {
      throw new Error('tts: empty audio response');
    }
  }

  await playUri(uri);
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
