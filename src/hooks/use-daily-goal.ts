import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { GamificationApi } from '@/lib/api-client';
import { useIsAuthenticated } from '@/hooks/use-auth';
import { USER_STATS_KEY } from '@/hooks/use-user-stats';

export const DAILY_GOAL_KEY = ['daily-goal'] as const;

export function useDailyGoal() {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: DAILY_GOAL_KEY,
    queryFn: () => GamificationApi.getDailyGoal(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

export function useUpdateDailyGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (target_xp: number) => GamificationApi.updateDailyGoal(target_xp),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DAILY_GOAL_KEY });
      qc.invalidateQueries({ queryKey: USER_STATS_KEY });
      Toast.show({ type: 'success', text1: 'Цель обновлена' });
    },
    onError: (e: { message?: string }) => {
      Toast.show({ type: 'error', text1: e?.message ?? 'Ошибка' });
    },
  });
}
