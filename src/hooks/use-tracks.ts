import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TracksApi, MyTracksApi } from '@/lib/api-client';
import { FLASHCARDS_KEY, FLASHCARD_STATS_KEY } from '@/hooks/use-flashcards';
import type { TrackFilters } from '@/types/api';

/** Персональный план треков юзера (Phase 8). Бэкенд лениво генерирует план
 *  по профилю (level + language + goal), если его ещё нет. */
export function useMyTracks() {
  return useQuery({
    queryKey: ['my-tracks'],
    queryFn: () => MyTracksApi.list(),
    staleTime: 60 * 1000,
  });
}

/** Список публикованных треков с фильтрами. */
export function useTracks(filters?: TrackFilters) {
  return useQuery({
    queryKey: ['tracks', filters],
    queryFn: () => TracksApi.list(filters),
    staleTime: 5 * 60 * 1000,
  });
}

/** Один трек по id или code. include_lessons=true возвращает уроки. */
export function useTrack(idOrCode: string, includeLessons = true) {
  return useQuery({
    queryKey: ['track', idOrCode, includeLessons],
    queryFn: () => TracksApi.get(idOrCode, includeLessons),
    enabled: !!idOrCode,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Прогресс прохождения уроков трека текущего юзера (серверный источник
 * правды для замков — кросс-девайс). Возвращает Set завершённых lesson_id.
 */
export function useTrackProgress(idOrCode: string) {
  return useQuery({
    queryKey: ['trackProgress', idOrCode],
    queryFn: () => TracksApi.progress(idOrCode),
    enabled: !!idOrCode,
    staleTime: 30 * 1000,
    select: (data) =>
      new Set(data.lessons.filter((l) => l.completed).map((l) => l.lesson_id)),
  });
}

export function useTrackDictionary(idOrCode: string, search = '') {
  return useQuery({
    queryKey: ['trackDictionary', idOrCode, search],
    queryFn: () => TracksApi.dictionary(idOrCode, search),
    enabled: !!idOrCode,
    staleTime: 60 * 1000,
  });
}

export function useAddTrackDictionaryWords(idOrCode: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vocabularyIds: string[]) => TracksApi.addDictionaryWords(idOrCode, vocabularyIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackDictionary', idOrCode] });
      queryClient.invalidateQueries({ queryKey: FLASHCARDS_KEY });
      queryClient.invalidateQueries({ queryKey: FLASHCARD_STATS_KEY });
    },
  });
}
