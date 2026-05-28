/**
 * feature-flags — централизованный доступ к feature-флагам приложения.
 *
 * Источник правды: `app.json` → `extra.<flagName>` + env-vars вида
 * `EXPO_PUBLIC_<UPPER_SNAKE>` (env-vars имеют приоритет, удобно для CI).
 *
 * Sprint 6: единственный флаг — `ONBOARDING_V3_ENABLED` (kill-switch для
 * нового онбординга). При `false` — пропускаем онбординг полностью
 * (юзер сразу попадает в `/(tabs)`).
 *
 * Будущие флаги добавлять одной строкой в `FLAGS` + помеченный helper.
 */

import Constants from 'expo-constants';

interface FlagDef {
  /** Ключ в `app.json` → `extra`. */
  extraKey: string;
  /** Env-var имя, override'ит extra. */
  envName: string;
  /** Дефолт, если ни extra, ни env не заданы. */
  default: boolean;
}

const FLAGS = {
  ONBOARDING_V3_ENABLED: {
    extraKey: 'onboardingV3Enabled',
    envName: 'EXPO_PUBLIC_ONBOARDING_V3_ENABLED',
    default: true,
  },
} as const satisfies Record<string, FlagDef>;

function parseBool(v: unknown): boolean | null {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const t = v.trim().toLowerCase();
    if (t === 'true' || t === '1' || t === 'yes') return true;
    if (t === 'false' || t === '0' || t === 'no') return false;
  }
  return null;
}

function readFlag(def: FlagDef): boolean {
  // 1. env-var override
  const fromEnv = parseBool(process.env[def.envName]);
  if (fromEnv !== null) return fromEnv;
  // 2. app.json extra
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const fromExtra = parseBool(extra?.[def.extraKey]);
  if (fromExtra !== null) return fromExtra;
  return def.default;
}

export function isOnboardingV3Enabled(): boolean {
  return readFlag(FLAGS.ONBOARDING_V3_ENABLED);
}

/** Debug-snapshot всех флагов (для smoke / Profile→Settings). */
export function allFlags(): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(FLAGS).map(([k, def]) => [k, readFlag(def)]),
  );
}
