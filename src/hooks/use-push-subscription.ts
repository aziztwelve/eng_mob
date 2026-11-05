import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import * as Device from 'expo-device';

import {
  getPushPermissionStatus,
  getExpoProjectId,
  getCurrentDeviceExpoToken,
  registerForPushNotifications,
} from '@/lib/push-registration';
import { isCurrentPushDevice } from '@/lib/current-push-device';
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
 * - Только совпадение Expo token этого устройства → state='subscribed'.
 * - subscribe() запускает full flow registerForPushNotifications +
 *   инвалидирует devices.
 */
export function usePushSubscription(): UsePushSubReturn {
  const qc = useQueryClient();
  const { t } = useTranslation();
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
      const token = await getCurrentDeviceExpoToken();
      const list = await NotificationsApi.listDevices();
      const hasCurrentDevice = isCurrentPushDevice(list.devices, token);
      setState(hasCurrentDevice ? 'subscribed' : 'granted_no_token');
      setReady(true);
    } catch (err) {
      setState('granted_no_token');
      setLastError(err instanceof Error ? err.message : 'refresh failed');
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const subscribeMut = useMutation({
    retry: false,
    mutationFn: async () => {
      const result = await registerForPushNotifications();
      if (!result) {
        const status = await getPushPermissionStatus();
        if (status === 'denied') setState('denied');
        throw new Error(t(status === 'denied' ? 'profile.push_denied' : !getExpoProjectId() ? 'profile.push_missing_config' : 'profile.push_failed'));
      }
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
