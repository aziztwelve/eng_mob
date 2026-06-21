import { useQuery } from '@tanstack/react-query';
import { TracksApi } from '@/lib/api-client';
import type { TrackFilters } from '@/types/api';

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
