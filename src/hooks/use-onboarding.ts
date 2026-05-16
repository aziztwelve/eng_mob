import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getOnboardingState,
  isOnboarded,
  markOnboardingComplete,
  patchOnboardingState,
  resetOnboarding,
  type OnboardingState,
} from '@/lib/onboarding-storage';

export const ONBOARDING_KEY = ['onboarding'] as const;
export const ONBOARDED_KEY = ['onboarded'] as const;

export function useOnboardingState() {
  return useQuery({
    queryKey: ONBOARDING_KEY,
    queryFn: () => getOnboardingState(),
    staleTime: Infinity, // изменяется только через явный mutate
  });
}

export function useIsOnboarded() {
  return useQuery({
    queryKey: ONBOARDED_KEY,
    queryFn: () => isOnboarded(),
    staleTime: Infinity,
  });
}

export function usePatchOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<OnboardingState>) => patchOnboardingState(patch),
    onSuccess: (next) => {
      qc.setQueryData(ONBOARDING_KEY, next);
      qc.setQueryData(ONBOARDED_KEY, !!next.completed_at);
    },
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markOnboardingComplete(),
    onSuccess: async () => {
      const next = await getOnboardingState();
      qc.setQueryData(ONBOARDING_KEY, next);
      qc.setQueryData(ONBOARDED_KEY, true);
    },
  });
}

export function useResetOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => resetOnboarding(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ONBOARDING_KEY });
      qc.invalidateQueries({ queryKey: ONBOARDED_KEY });
    },
  });
}

/**
 * Лёгкий синхронный snapshot для guard-логики в layout.
 * Используется в `app/_layout.tsx` чтобы решать redirect синхронно после mount.
 */
export function useOnboardingFlag(): { onboarded: boolean | null; ready: boolean } {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    void isOnboarded().then((v) => {
      if (!cancelled) setOnboarded(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return { onboarded, ready: onboarded !== null };
}
