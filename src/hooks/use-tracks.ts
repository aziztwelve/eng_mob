import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ActiveTrackApi, TracksApi } from '@/lib/api-client';
import type { TrackFilters } from '@/types/api';

/** Список публикованных треков с фильтрами. */
export function useTracks(filters?: TrackFilters) {
  return useQuery({
    queryKey: ['tracks', filters],
    queryFn: () => TracksApi.list(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useActiveTrack() {
  return useQuery({
    queryKey: ['active-track'],
    queryFn: ActiveTrackApi.get,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useSetActiveTrack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (trackId: string) => ActiveTrackApi.set(trackId),
    onSuccess: (_data, trackId) => {
      queryClient.invalidateQueries({ queryKey: ['active-track'] });
      queryClient.invalidateQueries({ queryKey: ['track', trackId, true] });
    },
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
