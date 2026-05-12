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
