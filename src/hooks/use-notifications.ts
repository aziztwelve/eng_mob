import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useIsAuthenticated } from '@/hooks/use-auth';
import { NotificationsApi } from '@/lib/api-client';
import type {
  NotificationsReadFilter,
  UpdatePreferencesRequest,
} from '@/types/api';

// === Query keys ===
export const NOTIF_PREFS_KEY = ['notifications', 'preferences'] as const;
export const NOTIF_DEVICES_KEY = ['notifications', 'devices'] as const;
export const NOTIF_INBOX_KEY = ['notifications', 'inbox'] as const;

// === Inbox ===

export function useNotifications(
  opts: { read?: NotificationsReadFilter; limit?: number; offset?: number } = {},
) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [
      ...NOTIF_INBOX_KEY,
      opts.read ?? 'all',
      opts.limit ?? 20,
      opts.offset ?? 0,
    ],
    queryFn: () => NotificationsApi.list(opts),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => NotificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_INBOX_KEY }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => NotificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_INBOX_KEY }),
  });
}

// === Preferences ===

export function useNotificationPreferences() {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: NOTIF_PREFS_KEY,
    queryFn: () => NotificationsApi.getPreferences(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdatePreferencesRequest) =>
      NotificationsApi.updatePreferences(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_PREFS_KEY }),
  });
}

// === Devices ===

export function useNotificationDevices() {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: NOTIF_DEVICES_KEY,
    queryFn: () => NotificationsApi.listDevices(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useUnregisterDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => NotificationsApi.unregisterDevice(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_DEVICES_KEY }),
  });
}
