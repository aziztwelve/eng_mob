/**
 * Списки языков для AI-табов.
 *
 * MVP-решение (2026-05): поддерживаем только `en` как target и `ru` как
 * native. Остальные языки оставляем видимыми в UI с пометкой «Скоро»,
 * но пиллы для них disabled — нельзя выбрать.
 *
 * Когда AI-провайдер начнёт стабильно отдавать качество на других парах,
 * просто переключим `disabled` на `false` (см. также docs/tasks/phase-5-ai.md).
 */

export interface AILangOption {
  value: string;
  /** Длинная подпись (`Español`), для chat. */
  label: string;
  /** Короткий код (`ES`), для тесных pill-наборов в writing/tutor/etc. */
  short: string;
  /** true → пилла отрисовывается серой и не реагирует на тап. */
  disabled?: boolean;
}

/** Языки, которые юзер ИЗУЧАЕТ. Сейчас активен только English. */
export const AI_TARGET_LANGS: readonly AILangOption[] = [
  { value: 'en', label: 'English', short: 'EN' },
  { value: 'es', label: 'Español', short: 'ES', disabled: true },
  { value: 'de', label: 'Deutsch', short: 'DE', disabled: true },
  { value: 'fr', label: 'Français', short: 'FR', disabled: true },
  { value: 'it', label: 'Italiano', short: 'IT', disabled: true },
];

/** Родной язык юзера. Сейчас активен только Русский. */
export const AI_NATIVE_LANGS: readonly AILangOption[] = [
  { value: 'ru', label: 'Русский', short: 'RU' },
  { value: 'en', label: 'English', short: 'EN', disabled: true },
];

/** Default target — единственный активный. */
export const DEFAULT_TARGET_LANG = 'en';
/** Default native — единственный активный. */
export const DEFAULT_NATIVE_LANG = 'ru';
