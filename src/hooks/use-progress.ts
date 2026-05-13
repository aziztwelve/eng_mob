import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api-client';
import {
  StepProgressResponse,
  LessonProgressResponse,
  CourseProgressData,
  CompleteStepRequest,
  CompleteStepResponse,
} from '@/types/api';
import Toast from 'react-native-toast-message';

// Get step progress
export function useStepProgress(stepId: string) {
  return useQuery({
    queryKey: ['stepProgress', stepId],
    queryFn: () => ApiClient.get<StepProgressResponse>(`/progress/steps/${stepId}`),
    enabled: !!stepId,
  });
}

// Get lesson progress
export function useLessonProgress(lessonId: string) {
  return useQuery({
    queryKey: ['lessonProgress', lessonId],
    queryFn: () => ApiClient.get<LessonProgressResponse>(`/progress/lessons/${lessonId}`),
    enabled: !!lessonId,
  });
}

// Get course progress
export function useCourseProgress(courseId: string) {
  return useQuery({
    queryKey: ['courseProgress', courseId],
    queryFn: () => ApiClient.get<CourseProgressData>(`/progress/courses/${courseId}`),
    enabled: !!courseId,
  });
}

// Mark step as completed
export function useCompleteStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stepId, data }: { stepId: string; data: CompleteStepRequest }) =>
      ApiClient.post<CompleteStepResponse>(`/progress/steps/${stepId}/complete`, data),
    onSuccess: (response, { stepId }) => {
      // Invalidate progress cache
      queryClient.invalidateQueries({ queryKey: ['stepProgress', stepId] });
      queryClient.invalidateQueries({ 
        queryKey: ['lessonProgress', response.lesson_progress.lesson_id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['courseProgress', response.lesson_progress.course_id] 
      });
      // Не показываем "Step completed!" — за UX отвечает useLessonGamificationFx
      // (+XP анимация, level-up, achievement modal, daily-goal toast).
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to save progress',
        text2: error?.message,
      });
    },
  });
}
