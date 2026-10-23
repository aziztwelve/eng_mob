import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from './use-auth';
import { ApiClient } from '@/lib/api-client';
import { readLessonPosition } from '@/lib/lesson-resume';
import type { LessonProgressResponse } from '@/types/api';

export function useLessonResume(lessonId: string) {
  const user = useCurrentUser();
  const owner = user.data?.id;
  const query = useQuery({
    queryKey: ['lessonResume', owner, lessonId],
    enabled: !!owner && !!lessonId,
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const [progress, checkpoint] = await Promise.all([
        ApiClient.get<LessonProgressResponse>(`/progress/lessons/${lessonId}`).catch(error => {
          if (error.statusCode === 404) return null;
          throw error;
        }),
        readLessonPosition(owner!, lessonId),
      ]);
      return { progress, checkpoint };
    },
  });
  return { ...query, owner, isLoading: user.isLoading || (!!owner && (query.isPending || query.isFetching)), isError: user.isError || (!user.isLoading && !owner) || query.isError };
}
