import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api-client';
import { StepWithVideo } from '@/types/api';

export function useStep(stepId: string, userId?: string) {
  return useQuery({
    queryKey: ['step', stepId, userId],
    queryFn: () => {
      const params = userId ? `?user_id=${userId}` : '';
      return ApiClient.get<StepWithVideo>(`/steps/${stepId}${params}`);
    },
    enabled: !!stepId,
    staleTime: 10 * 60 * 1000, // 10 minutes (video URL lives long)
  });
}
