import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { OnboardingApi } from '@/lib/api-client';
import { AuthService, ensureGuestSession } from '@/lib/auth-service';
import { onboardingMutationQueue } from '@/lib/onboarding-mutation-queue';
import {
  getOnboardingState,
  isOnboarded,
  markOnboardingComplete,
  mergeBackendState,
  patchOnboardingState,
  resetOnboarding,
  type OnboardingState,
} from '@/lib/onboarding-storage';
import type { PatchOnboardingRequest } from '@/types/api';

export const ONBOARDING_KEY = ['onboarding'] as const;
export const ONBOARDED_KEY = ['onboarded'] as const;
/**
 * @deprecated Объединено в `ONBOARDING_KEY`. Оставлено как алиас, чтобы
 * не сломать invalidate-вызовы из других файлов (например,
 * `use-claim-account.ts`). После прохода по всем файлам — удалить.
 */
export const ONBOARDING_REMOTE_KEY = ONBOARDING_KEY;

// ---------------------------------------------------------------------------
// Onboarding state hooks
//
// Source of truth — backend (`GET /onboarding`). Локальный AsyncStorage
// (`onboarding-storage.ts`) — это **offline-fallback кэш**, не SoT.
// usePatchOnboardingV3 пишет на backend; локальный кэш — оптимистичная
// проекция плюс хранилище для offline-mode (если backend недоступен).
// ---------------------------------------------------------------------------

/**
 * Загружает state онбординга. Стратегия:
 *   1. Если есть JWT — пробуем `GET /onboarding`, мерджим в локальный
 *      кэш и возвращаем merged.
 *   2. Если нет JWT (lazy guest ещё не создан) или backend недоступен —
 *      возвращаем последнее известное локальное состояние.
 */
async function loadOnboardingState(): Promise<OnboardingState> {
  const token = await AuthService.getAccessToken();
  if (token) {
    try {
      const remote = await OnboardingApi.getState();
      return await mergeBackendState(remote);
    } catch {
      // backend недоступен — продолжаем с локальным fallback
    }
  }
  return getOnboardingState();
}

export function useOnboardingState() {
  return useQuery({
    queryKey: ONBOARDING_KEY,
    queryFn: loadOnboardingState,
    staleTime: 60_000,
  });
}

export function useIsOnboarded() {
  return useQuery({
    queryKey: ONBOARDED_KEY,
    queryFn: () => isOnboarded(),
    staleTime: Infinity,
  });
}

export function usePatchOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<OnboardingState>) => patchOnboardingState(patch),
    onSuccess: (next) => {
      qc.setQueryData(ONBOARDING_KEY, next);
      qc.setQueryData(ONBOARDED_KEY, !!next.completed_at);
    },
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // 1) Локально сразу — не блокируем UX.
      await markOnboardingComplete();
      // 2) Backend (best-effort, не критично).
      try {
        await OnboardingApi.complete();
      } catch {
        // оффлайн — состояние догонит на следующем open
      }
    },
    onSuccess: async () => {
      const next = await getOnboardingState();
      qc.setQueryData(ONBOARDING_KEY, next);
      qc.setQueryData(ONBOARDED_KEY, true);
    },
  });
}

export function useResetOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => resetOnboarding(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ONBOARDING_KEY });
      qc.invalidateQueries({ queryKey: ONBOARDED_KEY });
    },
  });
}

/**
 * Лёгкий синхронный snapshot для guard-логики в layout.
 */
export function useOnboardingFlag(): { onboarded: boolean | null; ready: boolean } {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    void isOnboarded().then((v) => {
      if (!cancelled) setOnboarded(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return { onboarded, ready: onboarded !== null };
}

// ---------------------------------------------------------------------------
// Onboarding v3 (Oki-style) — backend-aware hooks.
// См. docs/tasks/mob/onboarding-v3-oki-style.md §3.3.
//
// Раньше тут было два дублирующих hook'а:
//   - `useGuestSession` (создание гостя при mount) — заменён на lazy
//     `ensureGuestSession()` (см. `lib/auth-service.ts`).
//   - `useRemoteOnboardingState` (отдельный read с backend'а) — слит с
//     `useOnboardingState`, который теперь сам читает backend и
//     fallback'ит на локальный AsyncStorage. Single source of truth.
// ---------------------------------------------------------------------------

/**
 * drainOnboardingQueue — отправляет накопленные offline-patch'и на backend.
 *
 * Безопасно вызывать многократно — внутри FIFO-очередь, на первой ошибке
 * остановится и оставит остаток на следующий вызов. Также мерджит
 * результирующее состояние в локальный кэш через `mergeBackendState`.
 *
 * Вызывается из:
 *   - app boot (см. `_layout.tsx`)
 *   - NetInfo listener (online → drain)
 *   - после успешного `usePatchOnboardingV3.mutateAsync` (на случай
 *     ранее накопленных patch'ей)
 */
export async function drainOnboardingQueue(): Promise<{
  ok: number;
  remaining: number;
}> {
  // Если нет токена — гостя не создаём (это не задача drain'а; lazy
  // creation должно произойти на user-action уровне). Ждём следующего
  // вызова с уже существующим токеном.
  const token = await AuthService.getAccessToken();
  if (!token) {
    const size = await onboardingMutationQueue.size();
    return { ok: 0, remaining: size };
  }

  const result = await onboardingMutationQueue.drain(async (patch) => {
    const remote = await OnboardingApi.patchState(patch);
    try {
      await mergeBackendState(remote);
    } catch {
      // не критично — следующий getState догонит
    }
  });
  return { ok: result.ok, remaining: result.remaining };
}

/**
 * usePatchOnboardingV3 — основная mutation для шагов онбординга v3.
 *
 * Стратегия:
 *   1. Локальный optimistic-апдейт (мгновенный UX).
 *   2. Сначала пробуем дренировать **накопленные** offline-patch'и
 *      (важен FIFO: если юзер прошёл step 5 в оффлайне, потом step 6
 *      в онлайне — step 5 должен примениться раньше).
 *   3. PATCH на backend.
 *   4. Если backend упал — patch ставим в persistent queue,
 *      Toast 'Синкнем при подключении'. Локальный кэш остаётся
 *      (онбординг продолжается).
 *
 * `localExtra` позволяет передать дополнительные локальные поля
 * (current_step, notifications_prompted), которых нет в backend-схеме.
 */
export function usePatchOnboardingV3() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      patch: PatchOnboardingRequest;
      localExtra?: Partial<OnboardingState>;
    }) => {
      // 1. Local optimistic update.
      const localPatch = mapBackendPatchToLocal(input.patch);
      const merged = { ...localPatch, ...(input.localExtra ?? {}) };
      await patchOnboardingState(merged);

      // 1.5. Lazy guest creation: при первом patch'е создаём гостя
      //      (если ещё нет токена). Если backend недоступен — продолжаем
      //      в local-only режиме, patch уйдёт в очередь.
      await ensureGuestSession();

      // 2. Сначала дренируем накопленные patch'и, чтобы FIFO-порядок
      //    сохранился. Если очередь не пуста и она снова падает —
      //    enqueue текущий patch и выходим.
      const queueSizeBefore = await onboardingMutationQueue.size();
      if (queueSizeBefore > 0) {
        const drainResult = await drainOnboardingQueue();
        if (drainResult.remaining > 0) {
          await onboardingMutationQueue.enqueue(input.patch);
          Toast.show({
            type: 'info',
            text1: 'Сохранили локально',
            text2: `Синкнем ${drainResult.remaining + 1} обновл. при подключении`,
            visibilityTime: 2500,
          });
          return { ok: false as const, error: 'queued', queued: true };
        }
      }

      // 3. Push current patch.
      try {
        const remote = await OnboardingApi.patchState(input.patch);
        await mergeBackendState(remote);
        return { ok: true as const, remote };
      } catch (err) {
        const message = (err as { message?: string })?.message ?? 'Сетевая ошибка';
        await onboardingMutationQueue.enqueue(input.patch);
        Toast.show({
          type: 'info',
          text1: 'Сохранили локально',
          text2: 'Синхронизируем при подключении',
          visibilityTime: 2500,
        });
        return { ok: false as const, error: message, queued: true };
      }
    },
    onSuccess: async () => {
      const next = await getOnboardingState();
      qc.setQueryData(ONBOARDING_KEY, next);
      qc.setQueryData(ONBOARDED_KEY, !!next.completed_at);
    },
  });
}

/**
 * mapBackendPatchToLocal — конвертирует backend-DTO в локальный schema.
 * Большинство ключей совпадают; различия:
 *   - proficiency_level → level
 *   - paywall_seen_at: ISO string (нет изменений)
 */
function mapBackendPatchToLocal(p: PatchOnboardingRequest): Partial<OnboardingState> {
  const out: Partial<OnboardingState> = {};
  if (p.native_language !== undefined) out.native_language = p.native_language;
  if (p.target_language !== undefined) out.target_language = p.target_language;
  if (p.proficiency_level !== undefined) out.level = p.proficiency_level;
  if (p.motivation !== undefined) out.goal = p.motivation[0] ?? null;
  if (p.daily_goal_xp !== undefined) out.daily_goal_xp = p.daily_goal_xp;
  if (p.age_bracket !== undefined) out.age_bracket = p.age_bracket;
  if (p.daily_commit_minutes !== undefined) out.daily_commit_minutes = p.daily_commit_minutes;
  if (p.pain_point !== undefined) out.pain_point = p.pain_point;
  if (p.speaking_situation !== undefined) out.speaking_situation = p.speaking_situation;
  if (p.past_blocker !== undefined) out.past_blocker = p.past_blocker;
  if (p.future_regret !== undefined) out.future_regret = p.future_regret;
  if (p.emotional_reaction !== undefined) out.emotional_reaction = p.emotional_reaction;
  if (p.reminder_slot !== undefined) out.reminder_slot = p.reminder_slot;
  if (p.paywall_seen_at !== undefined) out.paywall_seen_at = p.paywall_seen_at;
  if (p.paywall_choice !== undefined) out.paywall_choice = p.paywall_choice;
  return out;
}
