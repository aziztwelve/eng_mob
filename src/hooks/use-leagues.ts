import { useQuery } from '@tanstack/react-query';

import { useIsAuthenticated } from '@/hooks/use-auth';
import { SocialApi } from '@/lib/api-client';

// === Query keys ===
export const LEAGUES_CATALOG_KEY = ['leagues', 'catalog'] as const;
export const MY_LEAGUE_KEY = ['leagues', 'mine'] as const;
export const MY_LEADERBOARD_KEY = ['leagues', 'mine', 'leaderboard'] as const;
export const LEAGUE_HISTORY_KEY = ['leagues', 'history'] as const;

/** Public каталог 10 лиг — кэш надолго (статика). */
export function useLeaguesCatalog() {
  return useQuery({
    queryKey: LEAGUES_CATALOG_KEY,
    queryFn: () => SocialApi.listLeagues(),
    staleTime: 60 * 60 * 1000, // 1h
  });
}

/** Моя текущая лига + cohort + rank. */
export function useMyLeague() {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: MY_LEAGUE_KEY,
    queryFn: () => SocialApi.getMyLeague(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

/** Топ 30 моей когорты — обновляется чаще. */
export function useMyLeaderboard() {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: MY_LEADERBOARD_KEY,
    queryFn: () => SocialApi.getMyLeaderboard(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/** История выступлений в лигах с пагинацией. */
export function useLeagueHistory(opts: { limit?: number; offset?: number } = {}) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [...LEAGUE_HISTORY_KEY, opts.limit ?? 20, opts.offset ?? 0],
    queryFn: () => SocialApi.getHistory(opts),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
