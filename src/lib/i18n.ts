/**
 * i18n bootstrap.
 *
 * Languages: ru / en / kk. Default = ru. Persisted in AsyncStorage
 * (`ui_lang_v1`), falls back to expo-localization device locale on first
 * launch.
 *
 * Initialization is async: call `initI18n()` once at app start before
 * rendering user-facing screens (см. `app/_layout.tsx`).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n, { changeLanguage, use as i18nUse } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en';
import kk from '@/locales/kk';
import ru from '@/locales/ru';

export type UiLang = 'ru' | 'en' | 'kk';

const SUPPORTED: UiLang[] = ['ru', 'en', 'kk'];
const STORAGE_KEY = 'ui_lang_v1';
const DEFAULT_LANG: UiLang = 'ru';

function isSupported(code: string | null | undefined): code is UiLang {
  return !!code && (SUPPORTED as string[]).includes(code);
}

function detectDeviceLang(): UiLang {
  try {
    const locales = Localization.getLocales();
    for (const loc of locales) {
      const code = (loc.languageCode ?? '').toLowerCase();
      if (isSupported(code)) return code;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_LANG;
}

// Synchronous init с дефолтным языком — реальный язык подменим в initI18n().
void i18nUse(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    en: { translation: en },
    kk: { translation: kk },
  },
  lng: DEFAULT_LANG,
  fallbackLng: DEFAULT_LANG,
  defaultNS: 'translation',
  interpolation: { escapeValue: false },
  returnNull: false,
  compatibilityJSON: 'v4',
});

/**
 * Load persisted UI lang (or detect device lang) and apply to i18n.
 * Idempotent; safe to call multiple times.
 */
export async function initI18n(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const lang: UiLang = isSupported(stored) ? stored : detectDeviceLang();
    if (i18n.language !== lang) {
      await changeLanguage(lang);
    }
  } catch {
    // best-effort — оставляем DEFAULT_LANG
  }
}

/**
 * Switch UI language at runtime and persist.
 * Все экраны через useTranslation() re-render'нутся автоматически.
 */
export async function setUiLang(lang: UiLang): Promise<void> {
  if (!isSupported(lang)) return;
  await changeLanguage(lang);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore — следующая попытка перепишет */
  }
}

export function getCurrentLang(): UiLang {
  const cur = (i18n.language ?? DEFAULT_LANG).slice(0, 2).toLowerCase();
  return isSupported(cur) ? cur : DEFAULT_LANG;
}

export default i18n;
