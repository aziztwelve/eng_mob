import { useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthApi } from '@/lib/api-client';
import { AuthService, ensureGuestSession } from '@/lib/auth-service';
import type { ClaimGuestOAuthRequest, ClaimGuestRequest } from '@/types/api';
import { ONBOARDING_KEY } from './use-onboarding';

const CLAIM_IDEMPOTENCY_KEY = 'claim_idempotency_key_v1';

function uuidv4(): string {
  const g: { randomUUID?: () => string } | undefined =
    (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (g && typeof g.randomUUID === 'function') return g.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * getOrCreateClaimIdempotencyKey — стабильный per-attempt UUID для
 * заголовка `Idempotency-Key`.
 *
 * Логика:
 *   - Если в AsyncStorage уже есть key (от предыдущей попытки claim'а,
 *     которая могла зафейлиться по сети) — переиспользуем его.
 *   - Иначе создаём новый и сохраняем.
 *   - После успешного claim'а удаляем key (claim — terminal событие,
 *     юзер уже не гость).
 *
 * Это защищает от:
 *   - Double-tap на кнопку signup.
 *   - Network-retry внутри одной попытки.
 *   - Retry после рестарта app (юзер закрыл приложение в момент
 *     запроса; backend всё-таки создал юзера; при следующем open
 *     повторный claim вернёт того же юзера, а не «email already exists»).
 */
async function getOrCreateClaimIdempotencyKey(): Promise<string> {
  const existing = await AsyncStorage.getItem(CLAIM_IDEMPOTENCY_KEY);
  if (existing) return existing;
  const fresh = uuidv4();
  await AsyncStorage.setItem(CLAIM_IDEMPOTENCY_KEY, fresh);
  return fresh;
}

async function clearClaimIdempotencyKey(): Promise<void> {
  await AsyncStorage.removeItem(CLAIM_IDEMPOTENCY_KEY);
}

/**
 * useClaimAccount — claim гостя в registered user.
 *
 * Поддерживает оба варианта:
 *   - email/password (web) — через AuthApi.claim
 *   - OAuth (Google / Apple / guest_fake) — через AuthApi.claimOAuth
 *
 * После успеха:
 *   1. Сохраняем свежие токены через `AuthService.saveClaimedTokens`.
 *      Это сбрасывает `is_guest` флаг.
 *   2. Чистим persisted Idempotency-Key.
 *   3. Инвалидируем onboarding-кэши (роутинг к /(tabs) делает caller).
 *
 * См. docs/tasks/mob/onboarding-v3-oki-style.md §3.9.
 */
export function useClaimAccount() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (
      input:
        | { kind: 'oauth'; payload: ClaimGuestOAuthRequest }
        | { kind: 'password'; payload: ClaimGuestRequest },
    ) => {
      // Guard: claim требует валидный guest JWT. Если юзер каким-то
      // образом попал на signup без guest-сессии (web fresh localStorage,
      // ensureGuestSession упал ранее), создаём её прямо здесь.
      // Без этого backend вернёт 401 "Missing authorization header".
      const guestToken = await ensureGuestSession();
      if (!guestToken) {
        throw new Error(
          'Не удалось создать guest-сессию. Проверь, что бэкенд (gateway :8081) запущен.',
        );
      }

      const idempotencyKey = await getOrCreateClaimIdempotencyKey();
      const resp =
        input.kind === 'oauth'
          ? await AuthApi.claimOAuth(input.payload, idempotencyKey)
          : await AuthApi.claim(input.payload, idempotencyKey);
      await AuthService.saveClaimedTokens(resp.access_token, resp.refresh_token);
      await clearClaimIdempotencyKey();
      return resp;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ONBOARDING_KEY });
    },
  });
}
