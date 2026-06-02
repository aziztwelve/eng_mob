import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Localization from 'expo-localization';

import { NotificationsApi } from './api-client';

/**
 * Phase 3 — регистрация устройства в notifications-service для push-уведомлений.
 *
 * Pipeline:
 *   1. Проверить permission, при необходимости спросить.
 *   2. Получить Expo push token (`Notifications.getExpoPushTokenAsync`).
 *      Требует projectId — берём из `Constants.expoConfig.extra.eas.projectId`
 *      либо из `Constants.easConfig.projectId`.
 *   3. POST /notifications/devices с platform="expo" + token.
 *
 * Важно:
 *   - На iOS-симуляторе и web push не работают — Device.isDevice == false.
 *   - При отказе пермишена возвращаем null (UI должен показать баннер).
 *   - При отсутствии projectId (dev / Expo Go без EAS) — тоже null + warn.
 */

export interface PushRegistrationResult {
  /** Возвращаемый device-id из бэка (для unregister). */
  deviceId: string;
  /** Expo push token. */
  token: string;
  /** Был ли создан новый device-record (false → существовал, обновили last_seen). */
  created: boolean;
}

/**
 * Глобальный handler — как показывать push, когда приложение открыто.
 *
 * Должен быть установлен ОДИН раз при старте app (RootLayout effect).
 */
export function setupPushHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Запрашивает permission (если ещё не).
 * Возвращает финальный статус: 'granted' | 'denied' | 'undetermined'.
 */
export async function requestPushPermission(): Promise<Notifications.PermissionStatus> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return existing.status;
  if (
    existing.status === 'denied' &&
    !existing.canAskAgain
  ) {
    // Юзер заблокировал permission навсегда — UI должен направить в настройки.
    return existing.status;
  }
  const next = await Notifications.requestPermissionsAsync();
  return next.status;
}

/**
 * Получить projectId из expo конфига. На EAS-build — из `eas.projectId`,
 * в dev / Expo Go — из `easConfig.projectId` (если задан).
 */
function getExpoProjectId(): string | null {
  const fromExtra =
    (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.eas;
  if (fromExtra && typeof fromExtra === 'object') {
    const id = (fromExtra as { projectId?: string }).projectId;
    if (id) return id;
  }
  const fromEasConfig = (Constants as unknown as {
    easConfig?: { projectId?: string };
  }).easConfig?.projectId;
  return fromEasConfig ?? null;
}

/**
 * Полный flow регистрации:
 *   - permission
 *   - getExpoPushTokenAsync
 *   - POST /notifications/devices
 *
 * Возвращает null если:
 *   - не реальное устройство (симулятор / web)
 *   - permission denied
 *   - projectId не задан
 *   - сетевая ошибка (тогда логируем и возвращаем null — UI ретраит вручную).
 */
export async function registerForPushNotifications(): Promise<PushRegistrationResult | null> {
  if (!Device.isDevice) {
    console.warn('[push] not a physical device, skipping');
    return null;
  }

  const status = await requestPushPermission();
  if (status !== 'granted') {
    console.warn('[push] permission not granted:', status);
    return null;
  }

  // Android: канал по умолчанию (без него push не показываются на 8.0+).
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#00FFA3',
    });
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    console.warn('[push] no expo projectId found — skipping token request');
    return null;
  }

  let tokenResponse: Notifications.ExpoPushToken;
  try {
    tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  } catch (err) {
    console.warn('[push] getExpoPushTokenAsync failed:', err);
    return null;
  }

  const token = tokenResponse.data;
  if (!token) {
    console.warn('[push] empty token returned');
    return null;
  }

  const locale = Localization.getLocales()[0]?.languageTag ?? 'en';
  const userAgent = `${Device.osName ?? 'unknown'} ${Device.osVersion ?? ''} (${Device.modelName ?? Platform.OS})`;

  try {
    const resp = await NotificationsApi.registerDevice({
      platform: 'expo',
      token,
      locale,
      user_agent: userAgent.trim(),
    });
    return {
      deviceId: resp.device.id,
      token,
      created: resp.created,
    };
  } catch (err) {
    console.warn('[push] register device failed:', err);
    return null;
  }
}

/**
 * Утилита для UI — был ли уже выдан permission.
 */
export async function getPushPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const r = await Notifications.getPermissionsAsync();
  return r.status;
}
