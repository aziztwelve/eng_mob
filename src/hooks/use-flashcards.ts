import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useIsAuthenticated } from '@/hooks/use-auth';
import { FlashcardsApi } from '@/lib/api-client';
import type {
  CreateFlashcardRequest,
  UpdateFlashcardRequest,
  BulkCreateFlashcardsRequest,
  ListFlashcardsRequest,
  PinForTodayRequest,
  SuggestFlashcardsRequest,
  FlashcardReviewRequest,
} from '@/types/api';

// === Query keys ===
export const FLASHCARDS_KEY = ['flashcards'] as const;
export const FLASHCARD_STATS_KEY = ['flashcards', 'stats'] as const;
export const TODAY_QUEUE_KEY = ['flashcards', 'today'] as const;
export const FLASHCARD_SUGGESTIONS_KEY = ['flashcards', 'suggestions'] as const;

/** Список flashcards с фильтрами */
export function useFlashcards(params?: ListFlashcardsRequest) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [...FLASHCARDS_KEY, 'list', params],
    queryFn: () => FlashcardsApi.list(params),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

/** Одна flashcard по ID */
export function useFlashcard(id: string, includeSrs = false) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [...FLASHCARDS_KEY, id, { includeSrs }],
    queryFn: () => FlashcardsApi.get(id, includeSrs),
    enabled: isAuthenticated && !!id,
    staleTime: 60 * 1000,
  });
}

/** Статистика flashcards (today_due, learning, mastered, total) */
export function useFlashcardStats() {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: FLASHCARD_STATS_KEY,
    queryFn: () => FlashcardsApi.stats(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
}

/** Today queue - карточки на сегодня */
export function useTodayQueue(queuedForDate?: string, includeSrs = false) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [...TODAY_QUEUE_KEY, queuedForDate ?? 'today', { includeSrs }],
    queryFn: () => FlashcardsApi.listToday(queuedForDate, includeSrs),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

/** AI suggestions для новых карточек */
export function useFlashcardSuggestions(params?: SuggestFlashcardsRequest) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [...FLASHCARD_SUGGESTIONS_KEY, params],
    queryFn: () => FlashcardsApi.suggestions(params),
    enabled: isAuthenticated && !!params,
    staleTime: 5 * 60 * 1000,
  });
}

// === Mutations ===

/** Создать новую flashcard (optimistic update) */
export function useCreateFlashcard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFlashcardRequest) => FlashcardsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLASHCARDS_KEY });
      queryClient.invalidateQueries({ queryKey: FLASHCARD_STATS_KEY });
    },
  });
}

/** Обновить flashcard */
export function useUpdateFlashcard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFlashcardRequest }) =>
      FlashcardsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...FLASHCARDS_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [...FLASHCARDS_KEY, 'list'] });
    },
  });
}

/** Архивировать flashcard (soft delete) */
export function useArchiveFlashcard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => FlashcardsApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLASHCARDS_KEY });
      queryClient.invalidateQueries({ queryKey: FLASHCARD_STATS_KEY });
    },
  });
}

/** Bulk create (для AI suggestions accept-all) */
export function useBulkCreateFlashcards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkCreateFlashcardsRequest) => FlashcardsApi.bulkCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLASHCARDS_KEY });
      queryClient.invalidateQueries({ queryKey: FLASHCARD_STATS_KEY });
    },
  });
}

/** Pin flashcard для today queue (optimistic) */
export function usePinForToday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ flashcardId, data }: { flashcardId: string; data?: PinForTodayRequest }) =>
      FlashcardsApi.pinForToday(flashcardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODAY_QUEUE_KEY });
      queryClient.invalidateQueries({ queryKey: FLASHCARD_STATS_KEY });
      queryClient.invalidateQueries({ queryKey: [...FLASHCARDS_KEY, 'list'] });
    },
  });
}

/** Unpin flashcard из today queue */
export function useUnpinFromToday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ flashcardId, queuedForDate }: { flashcardId: string; queuedForDate?: string }) =>
      FlashcardsApi.unpinFromToday(flashcardId, queuedForDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODAY_QUEUE_KEY });
      queryClient.invalidateQueries({ queryKey: FLASHCARD_STATS_KEY });
      queryClient.invalidateQueries({ queryKey: [...FLASHCARDS_KEY, 'list'] });
    },
  });
}

/**
 * Ревью карточки (помню/забыл) → SM-2 на бэке.
 *
 * Инвалидирует today-queue, stats и list, чтобы счётчики «на сегодня» и
 * strength/next_review обновились после сессии. В самой сессии повторения
 * результаты применяются оптимистично (UI не ждёт сети на каждую карту).
 */
export function useReviewFlashcard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ flashcardId, data }: { flashcardId: string; data: FlashcardReviewRequest }) =>
      FlashcardsApi.review(flashcardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODAY_QUEUE_KEY });
      queryClient.invalidateQueries({ queryKey: FLASHCARD_STATS_KEY });
      queryClient.invalidateQueries({ queryKey: [...FLASHCARDS_KEY, 'list'] });
    },
  });
}

/** Загрузить стартовый набор карточек (для пустой библиотеки). */
export function useSeedStarter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (language?: string) => FlashcardsApi.seedStarter(language),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLASHCARDS_KEY });
      queryClient.invalidateQueries({ queryKey: FLASHCARD_STATS_KEY });
      queryClient.invalidateQueries({ queryKey: TODAY_QUEUE_KEY });
    },
  });
}
