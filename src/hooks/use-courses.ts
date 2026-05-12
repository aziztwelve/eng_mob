import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api-client';
import {
  Course,
  CourseDetails,
  EnrollmentResponse,
  CourseFilters,
} from '@/types/api';
import Toast from 'react-native-toast-message';

// Courses API calls
const coursesApi = {
  getCourses: async (filters?: CourseFilters): Promise<Course[]> => {
    const params = new URLSearchParams();
    
    // Set default values
    params.append('page', (filters?.page || 1).toString());
    params.append('limit', (filters?.limit || 20).toString());
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.level && filters.level.length > 0) {
      filters.level.forEach((l) => params.append('level', l));
    }
    if (filters?.sort) params.append('sort', filters.sort);
    if (filters?.order) params.append('order', filters.order);

    const queryString = params.toString();
    const endpoint = `/courses?${queryString}`;
    
    const response = await ApiClient.get<{ courses: Course[]; total: number }>(endpoint);
    return response.courses || [];
  },

  getCourse: async (id: string): Promise<CourseDetails> => {
    const response = await ApiClient.get<CourseDetails>(`/courses/${id}`);
    return response;
  },

  enrollCourse: async (courseId: string): Promise<EnrollmentResponse> => {
    const response = await ApiClient.post<EnrollmentResponse>(
      `/courses/${courseId}/enroll`
    );
    return response;
  },
};

// Get all courses with filters
export const useCourses = (filters?: CourseFilters) => {
  return useQuery({
    queryKey: ['courses', filters],
    queryFn: () => coursesApi.getCourses(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single course details
export const useCourse = (id: string) => {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => coursesApi.getCourse(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Enroll in a course
export const useEnrollCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => coursesApi.enrollCourse(courseId),
    onSuccess: (data, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      Toast.show({
        type: 'success',
        text1: data.message || 'Successfully enrolled in course!',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Enrollment failed',
        text2: error?.message || 'Please try again.',
      });
    },
  });
};

// Check enrollment access
export const useCheckEnrollment = (userId: string, courseId: string) => {
  return useQuery({
    queryKey: ['enrollment', userId, courseId],
    queryFn: () => 
      ApiClient.get<{ has_access: boolean }>(`/enrollments/check?user_id=${userId}&course_id=${courseId}`),
    enabled: !!userId && !!courseId,
    staleTime: 2 * 60 * 1000,
  });
};
