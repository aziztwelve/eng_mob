/**
 * sound-manifest — реестр звуковых ассетов для fx-движка.
 *
 * Метро резолвит `require()` статически, поэтому пути к sound-ассетам
 * должны быть литералами. Если ассет еще не добавлен, оставь поле
 * `null` — fx.playSound() корректно сэмулирует тишину.
 *
 * Чтобы подключить звук:
 *   1. Положи .mp3 (44.1 кГц, mono или stereo, <100 KB) в
 *      `assets/sounds/<name>.mp3`.
 *   2. Замени `null` на `require('@/../assets/sounds/<name>.mp3')`.
 *   3. Готово — fx-engine начнет воспроизводить.
 *
 * Файлы коммитим в репо: маленькие, общие для iOS/Android, статически
 * связаны с EAS-сборкой.
 */

export type FxSound =
  | 'correct'
  | 'wrong'
  | 'xp-gain'
  | 'level-up'
  | 'achievement'
  | 'daily-goal';

/**
 * Возвращает Asset-source для `Audio.Sound.createAsync()` или null, если
 * звук еще не добавлен. Тип сознательно широкий (`unknown`), так как
 * результат `require()` для медиа-ассетов — это number в RN.
 */
export const SOUND_ASSETS: Record<FxSound, unknown | null> = {
  // Пример: require('@/../assets/sounds/correct.mp3'),
  correct: null,
  wrong: null,
  'xp-gain': null,
  'level-up': null,
  achievement: null,
  'daily-goal': null,
};

export function hasSoundAsset(name: FxSound): boolean {
  return SOUND_ASSETS[name] != null;
}
