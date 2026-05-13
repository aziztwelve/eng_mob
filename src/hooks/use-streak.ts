import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { GamificationApi } from '@/lib/api-client';
import { useIsAuthenticated } from '@/hooks/use-auth';
import { USER_STATS_KEY } from '@/hooks/use-user-stats';

export function streakHistoryKey(days: number) {
  return ['streak-history', days] as const;
}

export function useStreakHistory(days = 30) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: streakHistoryKey(days),
    queryFn: () => GamificationApi.getStreakHistory(days),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useUseFreeze() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => GamificationApi.consumeStreakFreeze(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['streak-history'] });
      qc.invalidateQueries({ queryKey: USER_STATS_KEY });
      Toast.show({ type: 'success', text1: 'Streak freeze активирован' });
    },
    onError: (e: { message?: string }) => {
      Toast.show({ type: 'error', text1: e?.message ?? 'Ошибка' });
    },
  });
}
