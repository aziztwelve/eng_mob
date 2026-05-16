import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * MVP onboarding store — локальное состояние в AsyncStorage.
 *
 * Backend gateway пока не предоставляет публичный PUT /users/me/profile
 * (есть только admin-роут). Чтобы не блокировать запуск, храним поля
 * onboarding'а локально на устройстве, а `daily_goal_xp` сохраняем через
 * существующий gamification API.
 *
 * TODO (post-MVP): когда появится публичный profile-update endpoint —
 * синкать `target_language` / `native_language` в backend и брать
 * `onboarded_at` оттуда (per-user, а не per-device).
 */

const ONBOARDING_KEY = '@onboarding_v1';

export type ProficiencyLevel = 'beginner' | 'a1' | 'a2' | 'b1' | 'b2' | 'just_for_fun';

export interface OnboardingState {
  completed_at: string | null; // ISO timestamp
  target_language: string | null; // 'en' | 'es' | 'de' | ...
  native_language: string | null;
  level: ProficiencyLevel | null;
  daily_goal_xp: number | null;
  notifications_prompted: boolean;
}

const DEFAULT_STATE: OnboardingState = {
  completed_at: null,
  target_language: null,
  native_language: null,
  level: null,
  daily_goal_xp: null,
  notifications_prompted: false,
};

export async function getOnboardingState(): Promise<OnboardingState> {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

export async function patchOnboardingState(
  patch: Partial<OnboardingState>,
): Promise<OnboardingState> {
  const current = await getOnboardingState();
  const next = { ...current, ...patch };
  await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(next));
  return next;
}

export async function markOnboardingComplete(): Promise<void> {
  await patchOnboardingState({ completed_at: new Date().toISOString() });
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_KEY);
}

export async function isOnboarded(): Promise<boolean> {
  const s = await getOnboardingState();
  return !!s.completed_at;
}
