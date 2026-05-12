import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api-client';
import { LessonWithSteps } from '@/types/api';

export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => ApiClient.get<LessonWithSteps>(`/lessons/${lessonId}`),
    enabled: !!lessonId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
