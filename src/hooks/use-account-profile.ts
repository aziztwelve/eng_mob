import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AccountApi } from '@/lib/api-client';
import { AuthService } from '@/lib/auth-service';
import { useCurrentUser } from '@/hooks/use-auth';
import type { AccountProfile } from '@/types/api';

export const ACCOUNT_PROFILE_KEY = ['account-profile'] as const;
export function useAccountProfile() {
  const { data: user } = useCurrentUser();
  return useQuery({
    queryKey: [...ACCOUNT_PROFILE_KEY, user?.id],
    queryFn: AccountApi.getProfile,
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}
export function useUpdateAccountProfile() {
  const { data: user } = useCurrentUser();
  const qc = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (body: Partial<AccountProfile>) => {
      if (!user?.id || await AuthService.getSessionUserID() !== user.id) throw new Error('Session changed');
      return AccountApi.updateProfile(body);
    },
    onSuccess: async (profile) => {
      if (await AuthService.getSessionUserID() !== user?.id) return;
      qc.setQueryData([...ACCOUNT_PROFILE_KEY, user?.id], profile);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['currentUser'] }),
        qc.invalidateQueries({ queryKey: ['xp-daily'] }),
        qc.invalidateQueries({ queryKey: ['streak-history'] }),
        qc.invalidateQueries({ queryKey: ['daily-goal'] }),
      ]);
    },
  });
}
