import AsyncStorage from '@react-native-async-storage/async-storage';

import { analytics } from './analytics';

import type { AgeBracket, OnboardingStateResponse, ProficiencyLevelProto, ReminderSlot } from '@/types/api';
import { cleanOnboardingPatch, retainedOnboardingStep } from './onboarding-policy';
import { onboardingMutationQueue } from './onboarding-mutation-queue';

/**
 * Локальный кэш состояния онбординга — **offline fallback only**.
 *
 * Source of truth — backend (`GET /onboarding`). Этот файл хранит
 * последнее известное состояние в AsyncStorage для двух кейсов:
 *
 *   1. Backend недоступен (нет сети, ошибка API) — `useOnboardingState`
 *      возвращает локальный snapshot вместо пустого state'а.
 *   2. Лениво созданный гость (token ещё не выпущен) — UI рисует
 *      форму на основе локального state'а до первого PATCH'а.
 *
 * `usePatchOnboardingV3` пишет ОДНОВРЕМЕННО локально (optimistic) и на
 * backend. При успехе backend-ответ через `mergeBackendState`
 * перезаписывает локальный кэш — гарантия eventual consistency.
 *
 * v1 → v3: миграция выполняется один раз (см. `migrateLegacyV1`).
 */

const ONBOARDING_KEY_V3 = '@onboarding_v3';
const ONBOARDING_KEY_V1 = '@onboarding_v1';

export type ProficiencyLevel = ProficiencyLevelProto;

export interface OnboardingState {
  // v1 (всё ещё используется):
  completed_at: string | null;
  target_language: string | null;
  native_language: string | null;
  level: ProficiencyLevel | null;
  daily_goal_xp: number | null;

  // v3 (Oki-style):
  /** Первая (главная) goal из массива motivation — для personalized copy. */
  goal: string | null;
  age_bracket: AgeBracket | null;
  reminder_slot: ReminderSlot | null;

  /** Шаг, на котором пользователь остановился (для resume). */
  current_step: string | null;
}

const DEFAULT_STATE: OnboardingState = {
  completed_at: null,
  target_language: null,
  native_language: null,
  level: null,
  daily_goal_xp: null,
  goal: null,
  age_bracket: null,
  reminder_slot: null,
  current_step: null,
};

/**
 * migrateLegacyV1 — если есть `@onboarding_v1`, копирует поля в v3 и
 * удаляет v1. Идемпотентна (повторный вызов — no-op).
 */
async function migrateLegacyV1(): Promise<void> {
  try {
    const legacy = await AsyncStorage.getItem(ONBOARDING_KEY_V1);
    if (!legacy) return;
    const v3 = await AsyncStorage.getItem(ONBOARDING_KEY_V3);
    if (!v3) {
      // Только если v3 ещё нет — копируем v1 → v3.
      const parsed = JSON.parse(legacy) as Partial<OnboardingState>;
      const merged: OnboardingState = { ...DEFAULT_STATE, ...cleanOnboardingPatch(parsed) };
      await AsyncStorage.setItem(ONBOARDING_KEY_V3, JSON.stringify(merged));
    }
    await AsyncStorage.removeItem(ONBOARDING_KEY_V1);
  } catch {
    // мигрировать не критично; продолжаем
  }
}

export async function getOnboardingState(): Promise<OnboardingState> {
  await migrateLegacyV1();
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_KEY_V3);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    const clean = cleanOnboardingPatch(parsed);
    const state = { ...DEFAULT_STATE, ...clean, current_step: retainedOnboardingStep(clean.current_step) };
    const serialized = JSON.stringify(state);
    if (serialized !== raw) await AsyncStorage.setItem(ONBOARDING_KEY_V3, serialized);
    return state;
  } catch {
    return DEFAULT_STATE;
  }
}

export async function patchOnboardingState(
  patch: Partial<OnboardingState>,
): Promise<OnboardingState> {
  const current = await getOnboardingState();
  const next = { ...current, ...cleanOnboardingPatch(patch) };
  next.current_step = retainedOnboardingStep(next.current_step);
  await AsyncStorage.setItem(ONBOARDING_KEY_V3, JSON.stringify(next));
  return next;
}

export async function markOnboardingComplete(): Promise<void> {
  const next = await patchOnboardingState({ completed_at: new Date().toISOString() });
  // Sprint 6: единая точка для analytics — независимо от того,
  // вызывает ли это done-экран, completeOnboarding-хук или skip-flow.
  analytics.track('onboarding_completed', {
    target_language: next.target_language ?? undefined,
    native_language: next.native_language ?? undefined,
    goal: next.goal ?? undefined,
    level: next.level ?? undefined,
  });
}

export async function resetOnboarding(): Promise<void> {
  await onboardingMutationQueue.clear();
  await AsyncStorage.removeItem(ONBOARDING_KEY_V3);
  await AsyncStorage.removeItem(ONBOARDING_KEY_V1);
}

export async function isOnboarded(): Promise<boolean> {
  const s = await getOnboardingState();
  return !!s.completed_at;
}

/**
 * mergeBackendState — мерджит свежий state с backend'а в локальный кэш.
 * Backend — source of truth; локальные fields'ы перезаписываются. Хелпер
 * нормализует null/undefined в null (наша storage-схема).
 */
export async function mergeBackendState(remote: OnboardingStateResponse): Promise<OnboardingState> {
  const patch: Partial<OnboardingState> = {
    target_language: remote.target_language ?? null,
    native_language: remote.native_language ?? null,
    goal: remote.motivation?.[0] ?? null,
    level: remote.proficiency_level ?? null,
    daily_goal_xp: remote.daily_goal_xp ?? null,
    age_bracket: remote.age_bracket ?? null,
    reminder_slot: remote.reminder_slot ?? null,
    completed_at: remote.onboarded_at ?? null,
  };
  return patchOnboardingState(patch);
}
