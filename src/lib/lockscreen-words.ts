import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { FlashcardsApi, VocabularyApi } from './api-client';
import type { ProficiencyLevelProto } from '@/types/api';

/**
 * Lock Screen Words — слова на экране блокировки.
 *
 * Механика: партиями планируем до MAX_SLOTS уведомлений с DATE-триггером
 * (каждое — своё слово). Слоты, попавшие в «тихие часы», сдвигаются на утро.
 * При каждом foreground приложения очередь пополняется через reschedule().
 *
 * См. docs/tasks/mob/lockscreen-words.md (elearning).
 */

const STORAGE_KEY = '@lockscreen_words/config/v1';
export const LOCKSCREEN_CHANNEL_ID = 'lockscreen-words';

/** Лимит очереди планирования (достаточно для ~24ч при интервале >=20 мин). */
export const MAX_SLOTS = 64;

export const INTERVAL_CHOICES = [10, 20, 30, 60, 120] as const;
export type LockscreenInterval = (typeof INTERVAL_CHOICES)[number];

export interface LockscreenConfig {
  enabled: boolean;
  /** Интервал в минутах. */
  intervalMin: LockscreenInterval;
  /** Тихие часы (локальное время), часы 0-23. */
  quietFrom: number;
  quietTo: number;
}

export const DEFAULT_CONFIG: LockscreenConfig = {
  enabled: false,
  intervalMin: 30,
  quietFrom: 22,
  quietTo: 8,
};

export interface WordPair {
  word: string;
  translation: string;
}

// ---------------------------------------------------------------------------
// Конфиг
// ---------------------------------------------------------------------------

export async function loadConfig(): Promise<LockscreenConfig> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw) as Partial<LockscreenConfig>;
    return {
      enabled: !!parsed.enabled,
      intervalMin: (INTERVAL_CHOICES as readonly number[]).includes(parsed.intervalMin ?? -1)
        ? (parsed.intervalMin as LockscreenInterval)
        : DEFAULT_CONFIG.intervalMin,
      quietFrom: clampHour(parsed.quietFrom ?? DEFAULT_CONFIG.quietFrom),
      quietTo: clampHour(parsed.quietTo ?? DEFAULT_CONFIG.quietTo),
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(config: LockscreenConfig): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function clampHour(h: number): number {
  if (!Number.isFinite(h)) return 0;
  return ((Math.round(h) % 24) + 24) % 24;
}

// ---------------------------------------------------------------------------
// Пул слов: flashcards юзера + добор словами его уровня из общего словаря
// ---------------------------------------------------------------------------

/** Уровень онбординга → уровень словаря в БД ('A1'..'B2'...). */
function vocabLevelFor(level?: ProficiencyLevelProto | null): string {
  switch (level) {
    case 'b1':
      return 'b1';
    case 'b2':
      return 'b2';
    case 'a2':
      return 'a2';
    // beginner / just_for_fun / не пройден — стартуем с A1.
    default:
      return 'a1';
  }
}

export async function getWordPool(level?: ProficiencyLevelProto | null): Promise<WordPair[]> {
  const pool: WordPair[] = [];
  const seen = new Set<string>();

  // 1. Личная библиотека flashcards (то, что юзер реально учит).
  try {
    const cards = await FlashcardsApi.list({ limit: 200 });
    for (const c of cards.items ?? []) {
      const key = c.word.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      pool.push({ word: c.word.trim(), translation: (c.translation ?? '').trim() });
    }
  } catch {
    // Оффлайн / нет токена — пул доберётся из словаря ниже.
  }

  // 2. Добор словами уровня юзера из общего словаря (если flashcards мало).
  if (pool.length < 40) {
    try {
      const vocab = await VocabularyApi.list({ level: vocabLevelFor(level), limit: 200 });
      for (const e of vocab.entries ?? []) {
        const key = e.word.trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        pool.push({ word: e.word.trim(), translation: (e.translation ?? '').trim() });
      }
    } catch {
      // Оба источника недоступны — reschedule() отложится до следующего foreground.
    }
  }

  return pool.filter((p) => p.word && p.translation);
}

function shuffle<T>(items: T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Тихие часы
// ---------------------------------------------------------------------------

/** Попадает ли момент в тихие часы (поддерживает окно через полночь). */
export function isInQuietHours(d: Date, fromH: number, toH: number): boolean {
  const h = d.getHours();
  return fromH > toH ? h >= fromH || h < toH : h >= fromH && h < toH;
}

/** Сдвиг момента на утро — конец тихих часов. */
export function shiftOutOfQuiet(d: Date, fromH: number, toH: number): Date {
  if (!isInQuietHours(d, fromH, toH)) return d;
  const out = new Date(d);
  // Вечерняя часть окна (после fromH) → завтра; ночная (до toH) → сегодня.
  if (out.getHours() >= fromH && fromH > toH) {
    out.setDate(out.getDate() + 1);
  }
  out.setHours(toH, 0, 0, 0);
  return out;
}

/** Слоты планирования: каждые intervalMin, тихие часы пропускаются. */
export function buildSlots(
  count: number,
  intervalMin: number,
  quietFrom: number,
  quietTo: number,
  now = new Date(),
): Date[] {
  const slots: Date[] = [];
  let t = now.getTime();
  const intervalMs = intervalMin * 60 * 1000;
  for (let i = 0; i < count; i++) {
    t += intervalMs;
    const shifted = shiftOutOfQuiet(new Date(t), quietFrom, quietTo);
    t = shifted.getTime();
    slots.push(new Date(t));
  }
  return slots;
}

// ---------------------------------------------------------------------------
// Планирование
// ---------------------------------------------------------------------------

let channelReady = false;

async function ensureChannel(): Promise<void> {
  if (channelReady || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(LOCKSCREEN_CHANNEL_ID, {
    name: 'Слова на экране блокировки',
    description: 'Периодические слова с переводом для пассивного повторения',
    importance: Notifications.AndroidImportance.LOW, // без звука, только визуально
    sound: null,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC, // текст виден на lock screen
    bypassDnd: false,
  });
  channelReady = true;
}

/** Отменяет все запланированные lockscreen-уведомления (по data.kind). */
export async function cancelScheduledWords(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  let cancelled = 0;
  for (const req of scheduled) {
    const data = req.content?.data as { kind?: string } | undefined;
    if (data?.kind === 'lockscreen_word') {
      await Notifications.cancelScheduledNotificationAsync(req.identifier);
      cancelled++;
    }
  }
  return cancelled;
}

/**
 * Перепланировать очередь по текущему конфигу и пулу слов.
 * Вызывается: включение/смена настроек, каждый foreground (см. _layout.tsx).
 * Ошибки не бросает — логируется, ретрай на следующем foreground.
 */
export async function reschedule(level?: ProficiencyLevelProto | null): Promise<void> {
  const config = await loadConfig();
  await cancelScheduledWords();
  if (!config.enabled) return;

  const pool = shuffle(await getWordPool(level));
  if (pool.length === 0) {
    console.warn('[lockscreen-words] empty word pool — nothing to schedule');
    return;
  }

  await ensureChannel();
  const slots = buildSlots(MAX_SLOTS, config.intervalMin, config.quietFrom, config.quietTo);

  for (let i = 0; i < slots.length; i++) {
    const pair = pool[i % pool.length];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: pair.word,
        body: pair.translation,
        data: { kind: 'lockscreen_word', word: pair.word },
        ...(Platform.OS === 'android' ? { sticky: false } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: slots[i],
        channelId: LOCKSCREEN_CHANNEL_ID,
      },
    });
  }
}

/** Мгновенное тестовое уведомление (кнопка на экране настроек). */
export async function sendTestNotification(pair: WordPair): Promise<void> {
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: pair.word,
      body: pair.translation,
      data: { kind: 'lockscreen_word', word: pair.word },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(Date.now() + 1500),
      channelId: LOCKSCREEN_CHANNEL_ID,
    },
  });
}

/** Сколько lockscreen-уведомлений сейчас в очереди (для UI-статуса). */
export async function scheduledWordsCount(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter((req) => {
    const data = req.content?.data as { kind?: string } | undefined;
    return data?.kind === 'lockscreen_word';
  }).length;
}
