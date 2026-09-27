import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { VocabularyBankApi } from '@/lib/api-client';
import { useIsAuthenticated } from '@/hooks/use-auth';

export const VOCABULARY_BANK_KEY = ['vocabulary-bank'] as const;

const PAGE_SIZE = 30;

export function useVocabularyBank(filters: { cefr_level?: string; search?: string; locale?: string; limit?: number; offset?: number }) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [...VOCABULARY_BANK_KEY, filters],
    queryFn: () => VocabularyBankApi.list(filters),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

/**
 * Alphabet feed with server pagination. The API answers `total`, so the
 * query knows when hasNextPage without extra requests.
 */
export function useVocabularyBankPages(filters: { cefr_level?: string; search?: string; locale?: string }) {
  const { isAuthenticated } = useIsAuthenticated();
  return useInfiniteQuery({
    queryKey: [...VOCABULARY_BANK_KEY, 'pages', filters],
    queryFn: ({ pageParam }) =>
      VocabularyBankApi.list({ ...filters, limit: PAGE_SIZE, offset: pageParam }),
    enabled: isAuthenticated,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + (page.entries?.length ?? 0), 0);
      return loaded < (lastPage.total ?? 0) ? loaded : undefined;
    },
    staleTime: 60 * 1000,
  });
}

export function useVocabularyBankWord(externalId: string, locale = 'ru') {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [...VOCABULARY_BANK_KEY, 'word', externalId, locale],
    queryFn: () => VocabularyBankApi.get(externalId, locale),
    enabled: isAuthenticated && !!externalId,
  });
}

export function useVocabularyBankProgress(externalId: string) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [...VOCABULARY_BANK_KEY, 'progress', externalId],
    queryFn: () => VocabularyBankApi.getProgress(externalId),
    enabled: isAuthenticated && !!externalId,
    staleTime: 15 * 1000,
  });
}

export function useVocabularyBankFeed(filters: { cefr_level?: string; locale?: string; new_limit?: number; in_progress_limit?: number }) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [...VOCABULARY_BANK_KEY, 'feed', filters],
    queryFn: () => VocabularyBankApi.feed(filters),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}
