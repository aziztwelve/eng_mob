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

function base64UrlDecode(input: string): string {
  let b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < b64.length;) {
    const a = chars.indexOf(b64.charAt(i++));
    const b = chars.indexOf(b64.charAt(i++));
    const c = chars.indexOf(b64.charAt(i++));
    const d = chars.indexOf(b64.charAt(i++));
    if (a < 0 || b < 0) break;
    out += String.fromCharCode((a << 2) | (b >> 4));
    if (c >= 0) out += String.fromCharCode(((b & 15) << 4) | (c >> 2));
    if (d >= 0) out += String.fromCharCode(((c & 3) << 6) | d);
  }
  return out;
}

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
  }

  // User Management
  static async setUser(user: any): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  static async getUser(): Promise<any | null> {
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  // Local queue ownership follows the current registered token.
  // This is an identifier only; the backend still authenticates the token.
  static async getSessionUserID(): Promise<string | null> {
    const token = await this.getAccessToken();
    if (!token) return null;
    try {
      const claims = JSON.parse(base64UrlDecode(token.split('.')[1] ?? ''));
      return typeof claims.user_id === 'string' ? claims.user_id : null;
    } catch { return null; }
  }

  // Auth State
  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  // Save auth response
  static async saveAuthResponse(authResponse: AuthResponse): Promise<void> {
    await this.setTokens(authResponse.access_token, authResponse.refresh_token);
    if (authResponse.user) {
      await this.setUser(authResponse.user);
    }
    // Sprint 6: identify юзера в analytics (no-op SDK пока).
    const u = authResponse.user as { id?: string | number; email?: string } | undefined;
    if (u?.id != null) {
      analytics.identify(String(u.id), {
        is_guest: false,
      });
    }
  }

  // Logout
  static async logout(): Promise<void> {
    await this.clearTokens();
    analytics.reset();
  }

  // =====================================================================
  // =====================================================================

}
