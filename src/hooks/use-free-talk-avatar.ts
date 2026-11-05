import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/use-auth';
import { AuthService } from '@/lib/auth-service';

import { AVATAR_COUNT, DEFAULT_AVATAR, avatarStorageKey, parseAvatarId } from '@/lib/free-talk-avatar';

const queryKey = ['free-talk-avatar'] as const;

/** Avatar choice is per account on this device. */
export function useFreeTalkAvatar() {
  const { data: user } = useCurrentUser();
  const userId = user?.id;
  const qc = useQueryClient();
  const selection = useQuery({
    queryKey: [...queryKey, userId],
    queryFn: async () => parseAvatarId(await AsyncStorage.getItem(avatarStorageKey(userId!))),
    enabled: !!userId,
    staleTime: Infinity,
  });
  const save = useMutation({
    retry: false,
    mutationFn: async (id: number) => {
      if (!userId || await AuthService.getSessionUserID() !== userId) throw new Error('Session changed');
      if (!Number.isInteger(id) || id < 1 || id > AVATAR_COUNT) throw new Error('Invalid avatar');
      await AsyncStorage.setItem(avatarStorageKey(userId!), String(id));
      return id;
    },
    onSuccess: async (id) => {
      if (await AuthService.getSessionUserID() === userId) qc.setQueryData([...queryKey, userId], id);
    },
  });
  return { avatarId: selection.data ?? DEFAULT_AVATAR, isLoading: !userId || selection.isPending, loadError: selection.isError, retry: selection.refetch, saveAvatar: save.mutateAsync, isSaving: save.isPending };
}
