import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useIsAuthenticated } from '@/hooks/use-auth';
import { FriendsApi } from '@/lib/api-client';
import type { PendingDirection } from '@/types/api';

// === Query keys ===
export const FRIENDS_LIST_KEY = ['friends', 'list'] as const;
export const FRIENDS_PENDING_KEY = ['friends', 'pending'] as const;
export const FRIENDS_SEARCH_KEY = ['friends', 'search'] as const;
export const FRIENDS_LEADERBOARD_KEY = ['friends', 'leaderboard'] as const;

/** Список accepted-друзей (с обогащением). */
export function useFriends(opts: { limit?: number; offset?: number } = {}) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [...FRIENDS_LIST_KEY, opts.limit ?? 50, opts.offset ?? 0],
    queryFn: () => FriendsApi.list(opts),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

/** Pending запросы (incoming/outgoing/all). */
export function usePendingFriends(
  opts: {
    direction?: PendingDirection;
    limit?: number;
    offset?: number;
  } = {},
) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [
      ...FRIENDS_PENDING_KEY,
      opts.direction ?? 'all',
      opts.limit ?? 50,
      opts.offset ?? 0,
    ],
    queryFn: () => FriendsApi.listPending(opts),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

/** Поиск пользователей по username (min 2 символа). */
export function useFriendsSearch(query: string, limit = 20) {
  const { isAuthenticated } = useIsAuthenticated();
  const trimmed = query.trim();
  return useQuery({
    queryKey: [...FRIENDS_SEARCH_KEY, trimmed, limit],
    queryFn: () => FriendsApi.search(trimmed, limit),
    enabled: isAuthenticated && trimmed.length >= 2,
    staleTime: 30 * 1000,
  });
}

/** Friends leaderboard (друзья + self). */
export function useFriendsLeaderboard(limit = 50) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [...FRIENDS_LEADERBOARD_KEY, limit],
    queryFn: () => FriendsApi.leaderboard(limit),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
}

// === Mutations ===

function invalidateAllFriends(qc: ReturnType<typeof useQueryClient>) {
  // Дёргаем все friends-кэши: list / pending / search / leaderboard.
  qc.invalidateQueries({ queryKey: ['friends'] });
}

/** POST /friends/request { user_id } */
export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => FriendsApi.sendRequest(userId),
    onSuccess: () => invalidateAllFriends(qc),
  });
}

/** POST /friends/accept/:friendshipId */
export function useAcceptFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) => FriendsApi.accept(friendshipId),
    onSuccess: () => invalidateAllFriends(qc),
  });
}

/** POST /friends/reject/:friendshipId */
export function useRejectFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) => FriendsApi.reject(friendshipId),
    onSuccess: () => invalidateAllFriends(qc),
  });
}

/** DELETE /friends/:friendId */
export function useRemoveFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendId: string) => FriendsApi.remove(friendId),
    onSuccess: () => invalidateAllFriends(qc),
  });
}
