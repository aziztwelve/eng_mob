/**
 * oauth — обёртка для Google / Apple Sign-In.
 *
 * Возвращает унифицированный payload для backend `POST /auth/claim/oauth`:
 *   { provider: 'google'|'apple'|'guest_fake', id_token, email, display_name? }
 *
 * Конфигурация:
 *   - Google webClientId — `Constants.expoConfig.extra.googleWebClientId`
 *     (или env-var `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`).
 *     Если не задан — Google-кнопка возвращает null с сообщением (UI скрывает).
 *   - Apple — нужен только iOS (Android — кнопка скрывается).
 *
 * В Expo Go без EAS dev-build Google/Apple SDK не работают; компонент
 * показывает информационное сообщение и предлагает «Позже» (skip).
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  GoogleSignin,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import type { ClaimGuestOAuthRequest } from '@/types/api';

let googleConfigured = false;

function getGoogleWebClientId(): string | null {
  const fromExtra = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)
    ?.googleWebClientId;
  if (typeof fromExtra === 'string' && fromExtra.length > 0) return fromExtra;
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv;
  return null;
}

function ensureGoogleConfigured(): boolean {
  if (googleConfigured) return true;
  const webClientId = getGoogleWebClientId();
  if (!webClientId) return false;
  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
    scopes: ['email', 'profile'],
  });
  googleConfigured = true;
  return true;
}

export function isGoogleAvailable(): boolean {
  return getGoogleWebClientId() !== null;
}

export async function isAppleAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export type OAuthResult =
  | { ok: true; payload: ClaimGuestOAuthRequest }
  | { ok: false; reason: 'cancelled' | 'unavailable' | 'no_token' | 'error'; message?: string };

/**
 * signInWithGoogle — открывает native Google dialog, возвращает claim payload.
 *
 * Возможные причины отказа:
 *   - 'unavailable' — webClientId не задан или Google Play Services отсутствует.
 *   - 'cancelled'   — юзер закрыл native sheet.
 *   - 'no_token'    — Google не вернул idToken.
 *   - 'error'       — прочая ошибка SDK.
 */
export async function signInWithGoogle(): Promise<OAuthResult> {
  if (!ensureGoogleConfigured()) {
    return { ok: false, reason: 'unavailable', message: 'Google webClientId не настроен' };
  }
  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      return { ok: false, reason: 'cancelled' };
    }
    const idToken = response.data.idToken;
    if (!idToken) return { ok: false, reason: 'no_token' };
    const email = response.data.user.email ?? '';
    const display_name = response.data.user.name ?? undefined;
    return {
      ok: true,
      payload: { provider: 'google', id_token: idToken, email, display_name },
    };
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (
      code === statusCodes.SIGN_IN_CANCELLED ||
      code === statusCodes.IN_PROGRESS
    ) {
      return { ok: false, reason: 'cancelled' };
    }
    return {
      ok: false,
      reason: 'error',
      message: err instanceof Error ? err.message : 'Google sign-in error',
    };
  }
}

/**
 * signInWithApple — Apple OAuth (только iOS).
 *
 * Apple отдаёт email только при первом sign-in; при повторном — null.
 * Backend должен поддерживать lookup по `oauth_sub` (см. spec).
 */
export async function signInWithApple(): Promise<OAuthResult> {
  if (Platform.OS !== 'ios') {
    return { ok: false, reason: 'unavailable', message: 'Apple Sign-In только на iOS' };
  }
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    const idToken = credential.identityToken;
    if (!idToken) return { ok: false, reason: 'no_token' };
    const email = credential.email ?? '';
    const display_name = credential.fullName
      ? [credential.fullName.givenName, credential.fullName.familyName]
          .filter(Boolean)
          .join(' ') || undefined
      : undefined;
    return {
      ok: true,
      payload: { provider: 'apple', id_token: idToken, email, display_name },
    };
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'ERR_REQUEST_CANCELED') {
      return { ok: false, reason: 'cancelled' };
    }
    return {
      ok: false,
      reason: 'error',
      message: err instanceof Error ? err.message : 'Apple sign-in error',
    };
  }
}
