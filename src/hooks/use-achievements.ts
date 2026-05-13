import { useQuery } from '@tanstack/react-query';
import { GamificationApi } from '@/lib/api-client';
import { useIsAuthenticated } from '@/hooks/use-auth';

export interface AchievementsFilter {
  category?: string;
  include_hidden?: boolean;
}

export function useAchievements(filter?: AchievementsFilter) {
  return useQuery({
    queryKey: ['achievements', filter ?? {}],
    queryFn: () => GamificationApi.listAchievements(filter),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMyAchievements() {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: ['my-achievements'],
    queryFn: () => GamificationApi.getMyAchievements(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}
