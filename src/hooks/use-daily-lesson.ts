import { useTracks, useTrack } from './use-tracks';

/**
 * Хелпер: ищет первый publishable трек с track_type=daily и возвращает
 * его первый урок. Используется для секции «Daily Lesson» на главной.
 */
export function useDailyLesson() {
  const tracksQuery = useTracks({ track_type: 'daily', limit: 1 });
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
