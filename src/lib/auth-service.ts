import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse } from '@/types/api';
import { analytics } from './analytics';
import { secureStore } from './secure-store';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

// One-shot migration flag: проверяем AsyncStorage на наличие legacy-токенов
// при первом обращении и переносим их в SecureStore. Без этого
// существующие юзеры выйдут из аккаунта после обновления.
let tokenMigrationDone = false;

async function migrateTokensFromAsyncStorageIfNeeded(): Promise<void> {
  if (tokenMigrationDone) return;
  tokenMigrationDone = true;
  try {
    const [legacyAccess, legacyRefresh] = await Promise.all([
      AsyncStorage.getItem(ACCESS_TOKEN_KEY),
      AsyncStorage.getItem(REFRESH_TOKEN_KEY),
    ]);
    if (legacyAccess) {
      await secureStore.setItem(ACCESS_TOKEN_KEY, legacyAccess);
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    }
    if (legacyRefresh) {
      await secureStore.setItem(REFRESH_TOKEN_KEY, legacyRefresh);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch {
    // best-effort миграция; не блокируем поток
  }
}

// Onboarding v3 (Oki-style) — guest mode + device_id.
// См. docs/tasks/mob/onboarding-v3-oki-style.md §3.3 (use-guest-session).
const DEVICE_ID_KEY = 'device_id';
const IS_GUEST_KEY = 'is_guest';

/**
 * uuidv4 — простая реализация без зависимостей. crypto.randomUUID
 * может отсутствовать в React Native до Hermes-новых билдов; делаем
 * безопасный fallback на Math.random.
 */
function uuidv4(): string {
  const g: { randomUUID?: () => string } | undefined =
    (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (g && typeof g.randomUUID === 'function') {
    return g.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * base64UrlDecode — декод base64url без atob/Buffer (надёжно на Hermes).
 * Возвращает Latin1-строку; для ASCII-JSON JWT-claims этого достаточно.
 */
function base64UrlDecode(input: string): string {
  let b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let str = '';
  let i = 0;
  while (i < b64.length) {
    const c1 = b64.charAt(i++);
    const c2 = b64.charAt(i++);
    const c3 = b64.charAt(i++);
    const c4 = b64.charAt(i++);
    const e1 = chars.indexOf(c1);
    const e2 = chars.indexOf(c2);
    const e3 = chars.indexOf(c3);
    const e4 = chars.indexOf(c4);
    if (e1 < 0 || e2 < 0) break;
    str += String.fromCharCode((e1 << 2) | (e2 >> 4));
    if (c3 !== '=' && e3 >= 0) str += String.fromCharCode(((e2 & 15) << 4) | (e3 >> 2));
    if (c4 !== '=' && e4 >= 0) str += String.fromCharCode(((e3 & 3) << 6) | e4);
  }
  return str;
}

/**
 * decodeIsGuestClaim — boolean `is_guest` из payload JWT.
 *   - true/false — токен декодировался (отсутствие claim'а = false, т.к.
 *     бэкенд сериализует is_guest с omitempty только для гостей);
 *   - null — токена нет или он битый (caller делает фолбэк на флаг).
 */
function decodeIsGuestClaim(token: string | null): boolean | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1])) as { is_guest?: boolean };
    return payload.is_guest === true;
  } catch {
    return null;
  }
}
export class AuthService {
  // Token Management
  //
  // Токены лежат в SecureStore (Keychain / EncryptedSharedPreferences).
  // На каждом первом обращении мы прозрачно мигрируем legacy-значения
  // из AsyncStorage, чтобы юзер не разлогинился после обновления.
  static async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await migrateTokensFromAsyncStorageIfNeeded();
    await secureStore.setItem(ACCESS_TOKEN_KEY, accessToken);
    await secureStore.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  static async getAccessToken(): Promise<string | null> {
    await migrateTokensFromAsyncStorageIfNeeded();
    return secureStore.getItem(ACCESS_TOKEN_KEY);
  }

  static async getRefreshToken(): Promise<string | null> {
    await migrateTokensFromAsyncStorageIfNeeded();
    return secureStore.getItem(REFRESH_TOKEN_KEY);
  }

  static async clearTokens(): Promise<void> {
    await secureStore.removeItem(ACCESS_TOKEN_KEY);
    await secureStore.removeItem(REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.removeItem(IS_GUEST_KEY);
    // device_id НЕ очищаем — он сохраняется навсегда per-install для
    // идемпотентности re-bootstrap'а.
  }

  // User Management
  static async setUser(user: any): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  static async getUser(): Promise<any | null> {
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  // Auth State
  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  // Save auth response
  static async saveAuthResponse(authResponse: AuthResponse): Promise<void> {
    await this.setTokens(authResponse.access_token, authResponse.refresh_token);
    // Логин/регистрация = registered-сессия. Сбрасываем guest-флаг, иначе
    // auth-gate в (tabs) примет залогиненного юзера за гостя (если на
    // устройстве остался stale is_guest='true' от прежней guest-сессии)
    // и зациклит на /onboarding/signup.
    await this.setGuestFlag(false);
    if (authResponse.user) {
      await this.setUser(authResponse.user);
    }
    // Sprint 6: identify юзера в analytics (no-op SDK пока).
    const u = authResponse.user as { id?: string | number; email?: string } | undefined;
    if (u?.id != null) {
      analytics.identify(String(u.id), {
        is_guest: await this.isGuest(),
      });
    }
  }

  // Logout
  static async logout(): Promise<void> {
    await this.clearTokens();
    analytics.reset();
  }

  // =====================================================================
  // Guest mode (onboarding v3, see spec §3.3).
  // =====================================================================

  /**
   * getDeviceID — возвращает stable per-install UUID для idempotent guest
   * bootstrap'а. Создаётся при первом вызове.
   */
  static async getDeviceID(): Promise<string> {
    let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = uuidv4();
      await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  }

  /** isGuest — true для гостевой JWT-сессии (бэкенд кладёт is_guest в claims). */
  static async isGuest(): Promise<boolean> {
    const v = await AsyncStorage.getItem(IS_GUEST_KEY);
    return v === 'true';
  }

  /**
   * isGuestSession — авторитетная проверка «гость ли это»: читает claim
   * `is_guest` прямо из access-JWT (источник истины бэкенда). Для
   * registered-юзеров claim отсутствует (omitempty) → false.
   *
   * Используется auth-gate'ом в (tabs). Не зависит от того, корректно ли
   * все auth-пути поддерживают локальный IS_GUEST флаг. Фолбэк на флаг —
   * только если токена нет или он не декодируется.
   */
  static async isGuestSession(): Promise<boolean> {
    const token = await this.getAccessToken();
    const claim = decodeIsGuestClaim(token);
    if (claim !== null) return claim;
    return this.isGuest();
  }

  static async setGuestFlag(isGuest: boolean): Promise<void> {
    await AsyncStorage.setItem(IS_GUEST_KEY, isGuest ? 'true' : 'false');
  }

  /**
   * saveGuestTokens — сохраняет токены гостя и маркирует сессию как guest.
   * Отличается от `saveAuthResponse` только флагом is_guest.
   */
  static async saveGuestTokens(accessToken: string, refreshToken: string): Promise<void> {
    await this.setTokens(accessToken, refreshToken);
    await this.setGuestFlag(true);
  }

  /**
   * saveClaimedTokens — вызывается после claim (email/password или OAuth).
   * Сбрасывает guest-флаг — теперь юзер registered.
   */
  static async saveClaimedTokens(accessToken: string, refreshToken: string): Promise<void> {
    await this.setTokens(accessToken, refreshToken);
    await this.setGuestFlag(false);
  }
}

/**
 * ensureGuestSession — лениво создаёт guest-сессию **только если** токена
 * ещё нет. Возвращает access-token (новый или существующий) или null
 * при сетевой ошибке.
 *
 * Зачем lazy:
 *   Раньше гость создавался при каждом первом open приложения. Это
 *   значило, что юзеры, открывшие app и сразу закрывшие, оставляли
 *   garbage-row в `users` навсегда. На масштабе — десятки тысяч orphan
 *   аккаунтов.
 *
 * Теперь:
 *   - На app boot — НЕ создаём.
 *   - При первом действии, требующем backend (тап «Начать учиться» →
 *     `usePatchOnboardingV3`) — создаём здесь.
 *
 * Защита от race:
 *   Используем in-memory promise-cache (`pendingBootstrap`), чтобы
 *   несколько одновременных вызовов делали один POST /auth/guest.
 *
 * Импорт `AuthApi` лениво (через require) для избежания circular
 * dependency: api-client → auth-service → api-client.
 */
let pendingBootstrap: Promise<string | null> | null = null;

export async function ensureGuestSession(): Promise<string | null> {
  const existing = await AuthService.getAccessToken();
  if (existing) return existing;

  if (pendingBootstrap) return pendingBootstrap;

  pendingBootstrap = (async () => {
    try {
      // Lazy require — circular dep workaround.
      const { AuthApi } = await import('./api-client');
      const deviceId = await AuthService.getDeviceID();
      const resp = await AuthApi.createGuestSession(deviceId);
      await AuthService.saveGuestTokens(resp.access_token, resp.refresh_token);
      return resp.access_token;
    } catch (err) {
      if (__DEV__) {
        console.warn('[auth] ensureGuestSession failed:', err);
      }
      return null;
    } finally {
      pendingBootstrap = null;
    }
  })();

  return pendingBootstrap;
}
