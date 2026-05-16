import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Device from 'expo-device';

import {
  getPushPermissionStatus,
  registerForPushNotifications,
} from '@/lib/push-registration';
import { NotificationsApi } from '@/lib/api-client';
import { NOTIF_DEVICES_KEY } from './use-notifications';

export type PushSubState =
  | 'unknown'
  | 'unsupported' // simulator / web
  | 'denied' // юзер отказал
  | 'undetermined' // ещё не спрашивали
  | 'granted_no_token' // permission есть, но token не получен (проблема с projectId)
  | 'subscribed'; // permission granted + device зарегистрирован на бэке

export interface UsePushSubReturn {
  state: PushSubState;
  ready: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: (deviceId: string) => Promise<void>;
  isSubscribing: boolean;
  isUnsubscribing: boolean;
  refresh: () => Promise<void>;
  lastError: string | null;
}

/**
 * Хук состояния push-подписки на mobile.
 *
 * - На mount проверяет permission + список зарегистрированных devices.
 * - Если есть expo-device c platform=expo → state='subscribed'.
 * - subscribe() запускает full flow registerForPushNotifications +
 *   инвалидирует devices.
 */
export function usePushSubscription(): UsePushSubReturn {
  const qc = useQueryClient();
  const [state, setState] = useState<PushSubState>('unknown');
  const [ready, setReady] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLastError(null);
    if (!Device.isDevice) {
      setState('unsupported');
      setReady(true);
      return;
    }
    try {
      const status = await getPushPermissionStatus();
      if (status === 'denied') {
        setState('denied');
        setReady(true);
        return;
      }
      if (status === 'undetermined') {
        setState('undetermined');
        setReady(true);
        return;
      }
      // permission granted — проверяем наличие зарегистрированного device.
      const list = await NotificationsApi.listDevices();
      const hasExpo = list.devices?.some((d) => {
        // platform: 2 (число) или 'PLATFORM_EXPO' (строка).
        return d.platform === 2 || d.platform === 'PLATFORM_EXPO';
      });
      setState(hasExpo ? 'subscribed' : 'granted_no_token');
      setReady(true);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'refresh failed');
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const subscribeMut = useMutation({
    mutationFn: async () => {
      const result = await registerForPushNotifications();
      if (!result) throw new Error('Не удалось зарегистрировать устройство');
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIF_DEVICES_KEY });
      void refresh();
    },
    onError: (err) => {
      setLastError(err instanceof Error ? err.message : 'subscribe failed');
    },
  });

  const unsubscribeMut = useMutation({
    mutationFn: (deviceId: string) =>
      NotificationsApi.unregisterDevice(deviceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIF_DEVICES_KEY });
      void refresh();
    },
    onError: (err) => {
      setLastError(err instanceof Error ? err.message : 'unsubscribe failed');
    },
  });

  return {
    state,
    ready,
    subscribe: async () => {
      await subscribeMut.mutateAsync();
    },
    unsubscribe: async (id: string) => {
      await unsubscribeMut.mutateAsync(id);
    },
    isSubscribing: subscribeMut.isPending,
    isUnsubscribing: unsubscribeMut.isPending,
    refresh,
    lastError,
  };
}
