import {
  ApiError,
  CompleteStepRequest,
  CompleteStepResponse,
  LessonWithSteps,
  ListTracksResponse,
  TrackFilters,
  TrackWithLessons,
} from '@/types/api';
import { AuthService } from './auth-service';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081/api/v1';

export class ApiClient {
  private static baseURL = API_BASE_URL;

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add Authorization header if token exists
    const token = await AuthService.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      if (!response.ok) {
        if (isJson) {
          const errorData = await response.json();
          throw {
            message: errorData.message || 'An error occurred',
            statusCode: response.status,
            errors: errorData.errors,
          } as ApiError;
        } else {
          throw {
            message: `HTTP ${response.status}: ${response.statusText}`,
            statusCode: response.status,
          } as ApiError;
        }
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      if (isJson) {
        return await response.json();
      }

      return {} as T;
    } catch (error) {
      // Network errors or other fetch errors
      if (error instanceof TypeError) {
        throw {
          message: 'Network error. Please check your connection.',
          statusCode: 0,
        } as ApiError;
      }
      throw error;
    }
  }

  static async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  static async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async patch<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// ============================================
// Phase 0: typed Tracks/Lessons helpers
// ============================================

const buildTracksQuery = (filters?: TrackFilters) => {
  const params = new URLSearchParams();
  if (filters?.language) params.append('language', filters.language);
  if (filters?.level) params.append('level', filters.level);
  if (filters?.track_type) params.append('track_type', String(filters.track_type));
  if (filters?.search) params.append('search', filters.search);
  if (filters?.limit !== undefined) params.append('limit', String(filters.limit));
  if (filters?.offset !== undefined) params.append('offset', String(filters.offset));
  const q = params.toString();
  return q ? `?${q}` : '';
};

/**
 * Публичные эндпоинты Phase 0:
 *   GET /tracks
 *   GET /tracks/:idOrCode?include_lessons=true
 */
export const TracksApi = {
  list: (filters?: TrackFilters) =>
    ApiClient.get<ListTracksResponse>(`/tracks${buildTracksQuery(filters)}`),

  get: (idOrCode: string, includeLessons = true) =>
    ApiClient.get<TrackWithLessons>(
      `/tracks/${idOrCode}${includeLessons ? '?include_lessons=true' : ''}`
    ),
};

/**
 * Универсальный публичный доступ к уроку (course-bound или standalone).
 *   GET  /lessons/:id
 *   POST /progress/steps/:stepId/complete
 */
export const LessonsApi = {
  get: (lessonId: string) =>
    ApiClient.get<LessonWithSteps>(`/lessons/${lessonId}`),

  completeStep: (stepId: string, data: CompleteStepRequest) =>
    ApiClient.post<CompleteStepResponse>(
      `/progress/steps/${stepId}/complete`,
      data
    ),
};
