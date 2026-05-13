/**
 * fx-prefs — пользовательские настройки fx-движка.
 *
 * Храним в AsyncStorage: можно ли играть haptics и звуки. По умолчанию оба
 * включены. Значения кэшируем в памяти + публикуем подписки, чтобы UI и
 * сам fx-engine не дергали AsyncStorage на каждый эффект.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const STORAGE_KEY = '@eng:fx-prefs';

export interface FxPreferences {
  haptics: boolean;
  sounds: boolean;
}

const DEFAULT_PREFS: FxPreferences = {
  haptics: true,
  sounds: true,
};

// In-memory snapshot. Записывается из AsyncStorage при первом обращении.
let cached: FxPreferences = { ...DEFAULT_PREFS };
let hydrated = false;
let hydrating: Promise<void> | null = null;

const listeners = new Set<(prefs: FxPreferences) => void>();

function notify() {
  for (const fn of listeners) fn({ ...cached });
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (hydrating) return hydrating;
  hydrating = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FxPreferences>;
        cached = {
          haptics: typeof parsed.haptics === 'boolean' ? parsed.haptics : DEFAULT_PREFS.haptics,
          sounds: typeof parsed.sounds === 'boolean' ? parsed.sounds : DEFAULT_PREFS.sounds,
        };
      }
    } catch {
      // Игнорируем — фолбэк на defaults.
    } finally {
      hydrated = true;
      hydrating = null;
      notify();
    }
  })();
  return hydrating;
}

/**
 * Синхронный геттер. Если AsyncStorage еще не прочитан — вернет defaults и
 * запустит чтение в фоне (после чего подписчики получат уведомление).
 *
 * Используется fx-engine'ом перед каждым воспроизведением: дешево.
 */
export function getFxPreferences(): FxPreferences {
  if (!hydrated) {
    void hydrate();
  }
  return { ...cached };
}

/**
 * Установить новое значение (мерж). Пишем в AsyncStorage асинхронно, но
 * локальный кэш обновляем сразу — UI реагирует мгновенно.
 */
export async function setFxPreferences(patch: Partial<FxPreferences>): Promise<void> {
  cached = { ...cached, ...patch };
  notify();
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // Не критично: при следующем запуске вернемся к старому состоянию.
  }
}

/**
 * React-хук: подписывается на изменения и форсит ре-рендер. Удобен для
 * экрана настроек (Switch'и) и любого места, где UI зависит от prefs.
 */
export function useFxPreferences(): {
  prefs: FxPreferences;
  setPrefs: (patch: Partial<FxPreferences>) => Promise<void>;
} {
  const [prefs, setLocal] = useState<FxPreferences>(() => getFxPreferences());

  useEffect(() => {
    const listener = (p: FxPreferences) => setLocal(p);
    listeners.add(listener);
    // Триггерим гидрацию (если еще не было) — после нее придет notify().
    void hydrate();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { prefs, setPrefs: setFxPreferences };
}
