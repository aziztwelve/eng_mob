/**
 * lottie-manifest — реестр Lottie-анимаций для геймификации.
 *
 * Как и sound-manifest, требует литеральных `require()` для Metro. Если
 * .json еще не добавлен — оставь `null`, компоненты используют встроенный
 * Reanimated-фолбэк (без потери UX).
 *
 * Чтобы подключить:
 *   1. Положи `<name>.json` в `assets/lottie/`.
 *   2. Замени null на `require('@/../assets/lottie/<name>.json')`.
 *   3. Готово — без переключателей и фича-флагов.
 *
 * Контракт по событиям:
 *
 *   level-up    — фанфара + конфетти, 1.5-2.5 с, transparent canvas
 *   achievement — звезда/трофей burst, 1.2-2 с, transparent canvas
 */

export type LottieAnimation = 'level-up' | 'achievement' | 'flashcard-results';

export const LOTTIE_ASSETS: Record<LottieAnimation, unknown | null> = {
  'level-up': null,
  achievement: null,
  'flashcard-results': null,
};

export function hasLottieAsset(name: LottieAnimation): boolean {
  return LOTTIE_ASSETS[name] != null;
}
