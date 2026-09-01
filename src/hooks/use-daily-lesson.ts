import { useTracks, useTrack } from './use-tracks';

/**
 * Хелпер: возвращает первый publishable track без классификации по типу.
 */
export function useDailyLesson() {
  const tracksQuery = useTracks({ limit: 1 });
  const firstTrack = tracksQuery.data?.tracks?.[0];

  const trackQuery = useTrack(firstTrack?.code ?? firstTrack?.id ?? '', true);

  const lesson = trackQuery.data?.lessons?.[0];

  return {
    track: trackQuery.data ?? firstTrack,
    lesson,
    isLoading: tracksQuery.isLoading || (!!firstTrack && trackQuery.isLoading),
    error: tracksQuery.error || trackQuery.error,
  };
}
