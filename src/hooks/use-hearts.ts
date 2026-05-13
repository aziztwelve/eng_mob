import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { GamificationApi } from '@/lib/api-client';
import { useIsAuthenticated } from '@/hooks/use-auth';
import { USER_STATS_KEY } from '@/hooks/use-user-stats';
import type { RefillReason } from '@/types/api';

export const HEARTS_KEY = ['hearts'] as const;

export function useHearts() {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: HEARTS_KEY,
    queryFn: () => GamificationApi.getHearts(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useRefillHearts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reason, amount }: { reason?: RefillReason; amount?: number } = {}) =>
      GamificationApi.refillHearts(reason, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HEARTS_KEY });
      qc.invalidateQueries({ queryKey: USER_STATS_KEY });
      Toast.show({ type: 'success', text1: 'Жизни восстановлены' });
    },
    onError: (e: { message?: string }) => {
      Toast.show({ type: 'error', text1: e?.message ?? 'Ошибка' });
    },
  });
}
