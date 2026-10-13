/**
 * fx — центральный FX-движок для геймификации.
 *
 * Объединяет:
 *   - haptics (expo-haptics) — тактильная отдача;
 *   - sounds (expo-audio) — короткие UI-звуки.
 *
 * Все методы fire-and-forget: ошибки гасятся, основной поток UI не блокируется.
 * Если пользователь выключил один из каналов в настройках (см. fx-prefs.ts),
 * соответствующая сторона эффекта пропускается.
 *
 * Дизайнерский контракт по событиям (см. SOUND_ASSETS для регистрации звуков):
 *
 *   correct      — короткий "pop" + Light/Success haptic
 *   wrong        — низкий "buzz" + Error haptic
 *   xpGain       — короткий "tap" + Selection haptic
 *   levelUp      — фанфара + Heavy + Success haptic
 *   achievement  — chime + Success haptic
 *   dailyGoal    — chime + Success haptic
 *
 * Звуковые ассеты ленивы: при первом обращении загружаются через
 * `createAudioPlayer()` и кешируются. Если ассет не зарегистрирован —
 * звук пропускается, haptic все равно играет.
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { getFxPreferences } from '@/lib/fx-prefs';
import { hasSoundAsset, SOUND_ASSETS, type FxSound } from '@/lib/sound-manifest';

// === Haptics ===
// На web `expo-haptics` no-op, поэтому не нужен явный guard. На iOS/Android
// функции возвращают Promise — мы их не await'им (fire-and-forget).

function hapticSafe(fn: () => Promise<void> | void) {
  if (!getFxPreferences().haptics) return;
  try {
    void fn();
  } catch {
    /* noop */
  }
}

function notify(type: Haptics.NotificationFeedbackType) {
  hapticSafe(() => Haptics.notificationAsync(type));
}

function impact(style: Haptics.ImpactFeedbackStyle) {
  hapticSafe(() => Haptics.impactAsync(style));
}

function selection() {
  hapticSafe(() => Haptics.selectionAsync());
}

// === Sounds ===
// Кэш загруженных AudioPlayer объектов. Не выгружаем — UI-звуки маленькие,
// между ними переключаемся часто. Если потребуется освободить память,
// можно сделать LRU + unload по таймеру.

const loadedSounds = new Map<FxSound, AudioPlayer>();
let audioModeInitialized = false;

async function ensureAudioMode() {
  if (audioModeInitialized) return;
  // На iOS по умолчанию приложение замьючено в "тихом режиме". Для UI-звуков
  // переключаем в playback-режим — звук слышен даже с включенным mute.
  // На Android и web — no-op (опции игнорируются).
  if (Platform.OS !== 'web') {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
      });
    } catch {
      /* noop */
    }
  }
  audioModeInitialized = true;
}

async function loadSound(name: FxSound): Promise<AudioPlayer | null> {
  if (loadedSounds.has(name)) return loadedSounds.get(name)!;
  const asset = SOUND_ASSETS[name];
  if (asset == null) return null;
  try {
    await ensureAudioMode();
    const player = createAudioPlayer(asset as number);
    player.volume = 0.85;
    loadedSounds.set(name, player);
    return player;
  } catch {
    return null;
  }
}

function playSound(name: FxSound) {
  if (!getFxPreferences().sounds) return;
  if (!hasSoundAsset(name)) return;
  // Fire-and-forget: ошибка загрузки/воспроизведения не должна ронять UI.
  void (async () => {
    const sound = await loadSound(name);
    if (!sound) return;
    try {
      // setPositionAsync(0) гарантирует, что быстрые повторные вызовы
      // (несколько XP-gain'ов подряд) начинаются с начала, а не наслаиваются.
      await sound.seekTo(0);
      sound.play();
    } catch {
      /* noop */
    }
  })();
}

// === Композитные события ===
// Каждое событие = один haptic + один sound. Вызывающий код просто пишет
// `fx.onCorrect()` — детали (какой именно haptic-тип, какой ассет) живут
// в одном месте и могут быть перенастроены без шторма правок UI.

export const fx = {
  /** Правильный ответ в квизе / шаге. */
  onCorrect() {
    notify(Haptics.NotificationFeedbackType.Success);
    playSound('correct');
  },

  /** Неправильный ответ — списали heart. */
  onWrong() {
    notify(Haptics.NotificationFeedbackType.Error);
    playSound('wrong');
  },

  /** Начислили XP за шаг/урок. */
  onXPGain() {
    selection();
    playSound('xp-gain');
  },

  /** Перешли на следующий уровень. */
  onLevelUp() {
    impact(Haptics.ImpactFeedbackStyle.Heavy);
    // Двойной haptic усиливает ощущение события.
    setTimeout(() => notify(Haptics.NotificationFeedbackType.Success), 120);
    playSound('level-up');
  },

  /** Разблокировано achievement. */
  onAchievement() {
    notify(Haptics.NotificationFeedbackType.Success);
    playSound('achievement');
  },

  /** Закрыли дневную цель. */
  onDailyGoal() {
    notify(Haptics.NotificationFeedbackType.Success);
    playSound('daily-goal');
  },

  /** Тап по кнопке — легкая отдача без звука. Использовать опционально. */
  tap() {
    impact(Haptics.ImpactFeedbackStyle.Light);
  },
};

export type Fx = typeof fx;
