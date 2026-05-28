/**
 * supported-languages — каталог target languages для онбординга v3.
 *
 * Hard-coded на клиенте (см. onboarding-v3-oki-style.md §2.3 опция A).
 * Backend принимает любой ISO 639-1 код в `target_language`; этот файл
 * синхронизируется вручную с тем, для каких языков есть seeded контент
 * (tracks/lessons) в course-service.
 *
 * Когда добавляем язык:
 *   1. Положи запись сюда в правильную секцию (`PRIMARY` / `EXTRA`).
 *   2. Создай seed-lesson в `course-service/migrations/seed_first_lessons.sql`.
 *   3. Добавь questions в `placement-questions.ts`.
 *   4. (Опционально) добавь testimonials с этим языком в `testimonials.ts`.
 */

export type LanguageCode =
  | 'en' | 'es' | 'de' | 'fr' | 'it' | 'pt'
  | 'ar' | 'ja' | 'zh' | 'ko' | 'ru' | 'kk'
  // extra (optional):
  | 'tr' | 'nl' | 'pl';

export type CefrLevel = 'a1' | 'a2' | 'b1' | 'b2' | 'c1';

export interface SupportedLanguage {
  code: LanguageCode;
  /** Native endonym, e.g. "English", "Español". */
  nameNative: string;
  /** UI-translated names, keyed by UI lang. */
  nameI18n: { ru: string; en: string; kk: string };
  /** Unicode flag emoji (region-indicators). */
  flag: string;
  /** What CEFR levels are seeded so far. */
  supportedLevels: CefrLevel[];
  /** Marketing copy — approximate active learner count (frozen for MVP). */
  activeLearners: number;
  /** RTL script — needs special layout in OptionCard. */
  rtl?: boolean;
  /** Highlighted in welcome grid (top of catalog). */
  featured?: boolean;
}

/**
 * 12 primary languages — показываются в welcome grid сразу.
 * Порядок: featured (EN/ES/DE/FR) → top-Asian (JA/ZH/KO) →
 *   romance/mediterranean (IT/PT) → cyrillic (RU/KK) → arabic (AR).
 */
export const PRIMARY_LANGUAGES: SupportedLanguage[] = [
  {
    code: 'en',
    nameNative: 'English',
    nameI18n: { ru: 'Английский', en: 'English', kk: 'Ағылшын' },
    flag: '🇬🇧',
    supportedLevels: ['a1', 'a2', 'b1', 'b2', 'c1'],
    activeLearners: 412_000,
    featured: true,
  },
  {
    code: 'es',
    nameNative: 'Español',
    nameI18n: { ru: 'Испанский', en: 'Spanish', kk: 'Испан' },
    flag: '🇪🇸',
    supportedLevels: ['a1', 'a2', 'b1', 'b2'],
    activeLearners: 184_000,
    featured: true,
  },
  {
    code: 'de',
    nameNative: 'Deutsch',
    nameI18n: { ru: 'Немецкий', en: 'German', kk: 'Неміс' },
    flag: '🇩🇪',
    supportedLevels: ['a1', 'a2', 'b1', 'b2'],
    activeLearners: 156_000,
    featured: true,
  },
  {
    code: 'fr',
    nameNative: 'Français',
    nameI18n: { ru: 'Французский', en: 'French', kk: 'Француз' },
    flag: '🇫🇷',
    supportedLevels: ['a1', 'a2', 'b1', 'b2'],
    activeLearners: 138_000,
    featured: true,
  },
  {
    code: 'ja',
    nameNative: '日本語',
    nameI18n: { ru: 'Японский', en: 'Japanese', kk: 'Жапон' },
    flag: '🇯🇵',
    supportedLevels: ['a1', 'a2', 'b1'],
    activeLearners: 92_000,
  },
  {
    code: 'zh',
    nameNative: '中文',
    nameI18n: { ru: 'Китайский', en: 'Chinese', kk: 'Қытай' },
    flag: '🇨🇳',
    supportedLevels: ['a1', 'a2', 'b1'],
    activeLearners: 87_000,
  },
  {
    code: 'ko',
    nameNative: '한국어',
    nameI18n: { ru: 'Корейский', en: 'Korean', kk: 'Кәріс' },
    flag: '🇰🇷',
    supportedLevels: ['a1', 'a2'],
    activeLearners: 64_000,
  },
  {
    code: 'it',
    nameNative: 'Italiano',
    nameI18n: { ru: 'Итальянский', en: 'Italian', kk: 'Итальян' },
    flag: '🇮🇹',
    supportedLevels: ['a1', 'a2', 'b1'],
    activeLearners: 48_000,
  },
  {
    code: 'pt',
    nameNative: 'Português',
    nameI18n: { ru: 'Португальский', en: 'Portuguese', kk: 'Португал' },
    flag: '🇵🇹',
    supportedLevels: ['a1', 'a2', 'b1'],
    activeLearners: 42_000,
  },
  {
    code: 'ru',
    nameNative: 'Русский',
    nameI18n: { ru: 'Русский', en: 'Russian', kk: 'Орыс' },
    flag: '🇷🇺',
    supportedLevels: ['a1', 'a2', 'b1', 'b2'],
    activeLearners: 38_000,
  },
  {
    code: 'kk',
    nameNative: 'Қазақ тілі',
    nameI18n: { ru: 'Казахский', en: 'Kazakh', kk: 'Қазақ' },
    flag: '🇰🇿',
    supportedLevels: ['a1', 'a2'],
    activeLearners: 21_000,
  },
  {
    code: 'ar',
    nameNative: 'العربية',
    nameI18n: { ru: 'Арабский', en: 'Arabic', kk: 'Араб' },
    flag: '🇸🇦',
    supportedLevels: ['a1', 'a2'],
    activeLearners: 33_000,
    rtl: true,
  },
];

/**
 * Extra languages — пока без seeded контента, не показываем в welcome
 * grid, но оставляем для будущего unhide.
 */
export const EXTRA_LANGUAGES: SupportedLanguage[] = [
  {
    code: 'tr',
    nameNative: 'Türkçe',
    nameI18n: { ru: 'Турецкий', en: 'Turkish', kk: 'Түрік' },
    flag: '🇹🇷',
    supportedLevels: ['a1'],
    activeLearners: 12_000,
  },
  {
    code: 'nl',
    nameNative: 'Nederlands',
    nameI18n: { ru: 'Нидерландский', en: 'Dutch', kk: 'Голланд' },
    flag: '🇳🇱',
    supportedLevels: ['a1'],
    activeLearners: 8_000,
  },
  {
    code: 'pl',
    nameNative: 'Polski',
    nameI18n: { ru: 'Польский', en: 'Polish', kk: 'Поляк' },
    flag: '🇵🇱',
    supportedLevels: ['a1'],
    activeLearners: 7_500,
  },
];

export const ALL_LANGUAGES: SupportedLanguage[] = [...PRIMARY_LANGUAGES, ...EXTRA_LANGUAGES];

const BY_CODE: Record<string, SupportedLanguage> = Object.fromEntries(
  ALL_LANGUAGES.map((l) => [l.code, l]),
);

export function getLanguage(code: string): SupportedLanguage | null {
  return BY_CODE[code] ?? null;
}

export function isSupportedLanguage(code: string): code is LanguageCode {
  return code in BY_CODE;
}

/** UI-locale (3 поддерживаемых для интерфейса). */
export type UiLanguage = 'ru' | 'en' | 'kk';

export const UI_LANGUAGES: { code: UiLanguage; nameNative: string; flag: string }[] = [
  { code: 'ru', nameNative: 'Русский', flag: '🇷🇺' },
  { code: 'en', nameNative: 'English', flag: '🇬🇧' },
  { code: 'kk', nameNative: 'Қазақша', flag: '🇰🇿' },
];

export function languageNameForUi(code: string, ui: UiLanguage): string {
  const lang = getLanguage(code);
  if (!lang) return code.toUpperCase();
  return lang.nameI18n[ui];
}
