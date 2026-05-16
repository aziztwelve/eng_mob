import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useIsAuthenticated } from '@/hooks/use-auth';
import { SrsApi } from '@/lib/api-client';
import type {
  GeneratePracticeRequest,
  MistakeFilter,
  SRSItemTypeShort,
  SRSReviewRequest,
  SkillTypeShort,
} from '@/types/api';

// === Query keys ===
export const SRS_STATS_KEY = ['srs', 'stats'] as const;
export const SRS_DUE_KEY = ['srs', 'due'] as const;
export const SRS_WEAK_KEY = ['srs', 'weak'] as const;
export const MISTAKES_KEY = ['mistakes'] as const;
export const SKILLS_KEY = ['skills'] as const;
export const SKILLS_WEAK_KEY = ['skills', 'weak'] as const;

/** Глобальный stats — количество due / mastered / streak материала. */
export function useSrsStats() {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: SRS_STATS_KEY,
    queryFn: () => SrsApi.getStats(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useSrsDue(
  opts: { item_type?: SRSItemTypeShort; limit?: number } = {},
) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [...SRS_DUE_KEY, opts.item_type ?? 'all', opts.limit ?? 20],
    queryFn: () => SrsApi.getDue(opts),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

export function useSrsWeak(
  opts: { item_type?: SRSItemTypeShort; limit?: number } = {},
) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [...SRS_WEAK_KEY, opts.item_type ?? 'all', opts.limit ?? 20],
    queryFn: () => SrsApi.getWeak(opts),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

/**
 * Прямая запись ревью пользователем. step-validation-service пишет ревью
 * автоматически при /steps/:id/submit; этот хук — для случаев когда фронт
 * хочет руками выставить quality (например — после practice без шага).
 */
export function useSrsReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SRSReviewRequest) => SrsApi.review(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SRS_STATS_KEY });
      qc.invalidateQueries({ queryKey: SRS_DUE_KEY });
      qc.invalidateQueries({ queryKey: SRS_WEAK_KEY });
    },
  });
}

// === Practice ===

/**
 * Генерация одной сессии. Намеренно НЕ кэшируется в useQuery (фронт
 * фиксирует items в локальном state на время сессии — иначе refetch
 * перетасует прохождение).
 */
export function useGeneratePracticeSession() {
  return useMutation({
    mutationFn: (req: GeneratePracticeRequest = {}) =>
      SrsApi.generatePracticeSession(req),
  });
}

// === Mistakes ===

export function useMistakes(
  opts: { resolved?: MistakeFilter; limit?: number; offset?: number } = {},
) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [
      ...MISTAKES_KEY,
      opts.resolved ?? 'all',
      opts.limit ?? 20,
      opts.offset ?? 0,
    ],
    queryFn: () => SrsApi.listMistakes(opts),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

// === Skill decay ===

export function useSkillStrengths(
  opts: { skill_type?: SkillTypeShort; limit?: number; offset?: number } = {},
) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [
      ...SKILLS_KEY,
      opts.skill_type ?? 'all',
      opts.limit ?? 50,
      opts.offset ?? 0,
    ],
    queryFn: () => SrsApi.listSkills(opts),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useWeakSkills(
  opts: { skill_type?: SkillTypeShort; limit?: number } = {},
) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [...SKILLS_WEAK_KEY, opts.skill_type ?? 'all', opts.limit ?? 10],
    queryFn: () => SrsApi.getWeakSkills(opts),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}
