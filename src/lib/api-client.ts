import {
  AchievementsResponse,
  ApiError,
  CompleteStepRequest,
  CompleteStepResponse,
  DailyGoal,
  GeneratePracticeRequest,
  GeneratePracticeResponse,
  GetPreferencesResponse,
  Hearts,
  LessonWithSteps,
  ListDevicesResponse,
  ListMistakesResponse,
  ListNotificationsResponse,
  ListTracksResponse,
  MarkReadResponse,
  MistakeFilter,
  NotificationsReadFilter,
  ProtoTimestamp,
  RefillReason,
  RegisterDeviceRequest,
  RegisterDeviceResponse,
  SRSDueResponse,
  SRSItemTypeShort,
  SRSReviewRequest,
  SRSReviewResponse,
  SRSStats,
  SRSWeakResponse,
  SkillStrengthsResponse,
  SkillTypeShort,
  StepAttempt,
  Streak,
  StreakHistory,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  TTSCacheEntry,
  TrackFilters,
  TrackWithLessons,
  UpdatePreferencesRequest,
  UpdatePreferencesResponse,
  UserAchievementsResponse,
  UserStats,
  VocabularyEntry,
  VocabularyListResponse,
  WeakSkillsResponse,
  XPHistoryResponse,
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

// ============================================
// Gamification (Phase 1)
// ============================================

/**
 * Нормализация proto-timestamp ({seconds, nanos} | RFC3339 | null) в Date|null.
 */
export function tsToDate(ts: ProtoTimestamp): Date | null {
  if (ts == null) return null;
  if (typeof ts === 'string') {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof ts === 'object') {
    const sec =
      typeof ts.seconds === 'string' ? Number(ts.seconds) : ts.seconds ?? 0;
    if (!sec) return null;
    return new Date(sec * 1000);
  }
  return null;
}

export const GamificationApi = {
  // Stats
  getMyStats: () => ApiClient.get<UserStats>('/gamification/stats'),
  getUserStats: (userId: string) =>
    ApiClient.get<UserStats>(`/gamification/stats/${encodeURIComponent(userId)}`),

  // Hearts
  getHearts: () => ApiClient.get<Hearts>('/gamification/hearts'),
  refillHearts: (reason?: RefillReason, amount?: number) =>
    ApiClient.post<Hearts>('/gamification/hearts/refill', {
      reason: reason ?? 'gems',
      amount: amount ?? 0,
    }),

  // Daily goal
  getDailyGoal: () => ApiClient.get<DailyGoal>('/gamification/daily-goal'),
  updateDailyGoal: (target_xp: number) =>
    ApiClient.put<DailyGoal>('/gamification/daily-goal', { target_xp }),

  // Streak
  getStreakHistory: (days = 30) =>
    ApiClient.get<StreakHistory>(`/gamification/streak/history?days=${days}`),
  consumeStreakFreeze: () =>
    ApiClient.post<Streak>('/gamification/streak/freeze'),

  // Achievements
  listAchievements: (params?: { category?: string; include_hidden?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.category) q.append('category', params.category);
    if (params?.include_hidden) q.append('include_hidden', 'true');
    const s = q.toString();
    return ApiClient.get<AchievementsResponse>(
      `/gamification/achievements${s ? `?${s}` : ''}`
    );
  },
  getMyAchievements: () =>
    ApiClient.get<UserAchievementsResponse>('/gamification/achievements/mine'),

  // XP history
  getXPHistory: (limit = 50, offset = 0) =>
    ApiClient.get<XPHistoryResponse>(
      `/gamification/xp/history?limit=${limit}&offset=${offset}`
    ),
};

// ============================================
// PHASE 2 — Step validation / Vocabulary / TTS
// ============================================

export const StepValidationApi = {
  submit: (stepId: string, body: SubmitAnswerRequest) =>
    ApiClient.post<SubmitAnswerResponse>(
      `/steps/${encodeURIComponent(stepId)}/submit`,
      body,
    ),

  listAttempts: (
    stepId: string,
    opts: { limit?: number; offset?: number } = {},
  ) => {
    const qs = new URLSearchParams();
    if (opts.limit) qs.set('limit', String(opts.limit));
    if (opts.offset) qs.set('offset', String(opts.offset));
    const q = qs.toString();
    return ApiClient.get<{ attempts: StepAttempt[]; total: number }>(
      `/steps/${encodeURIComponent(stepId)}/attempts${q ? `?${q}` : ''}`,
    );
  },
};

export const VocabularyApi = {
  list: (filter: {
    language?: string;
    target_language?: string;
    level?: string;
    pos?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    const q = qs.toString();
    return ApiClient.get<VocabularyListResponse>(
      `/vocabulary${q ? `?${q}` : ''}`,
    );
  },
  get: (id: string) =>
    ApiClient.get<{ entry: VocabularyEntry }>(
      `/vocabulary/${encodeURIComponent(id)}`,
    ),
};

export const TTSApi = {
  getByText: (text: string, language: string, voice?: string) => {
    const qs = new URLSearchParams({ text, language });
    if (voice) qs.set('voice', voice);
    return ApiClient.get<{ entry: TTSCacheEntry }>(
      `/tts/by-text?${qs.toString()}`,
    );
  },
};

// ============================================
// PHASE 3 — SRS / Practice / Mistakes / Skills
// ============================================

function mistakeFilterToParam(f: MistakeFilter): string | null {
  if (f === 'unresolved') return 'false';
  if (f === 'resolved') return 'true';
  return null;
}

/**
 * Phase 3: srs-service через gateway. См. eng_next2/src/lib/srs-api.ts.
 *   GET  /srs/stats
 *   GET  /srs/due?item_type=&limit=
 *   GET  /srs/weak?item_type=&limit=
 *   POST /srs/review
 *   POST /practice/session
 *   GET  /mistakes?resolved=&limit=&offset=
 *   GET  /skills?skill_type=&limit=&offset=
 *   GET  /skills/weak?skill_type=&limit=
 */
export const SrsApi = {
  // === SRS ===
  getStats: () => ApiClient.get<SRSStats>('/srs/stats'),

  getDue: (opts: { item_type?: SRSItemTypeShort; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (opts.item_type) qs.set('item_type', opts.item_type);
    if (opts.limit) qs.set('limit', String(opts.limit));
    const q = qs.toString();
    return ApiClient.get<SRSDueResponse>(`/srs/due${q ? `?${q}` : ''}`);
  },

  getWeak: (opts: { item_type?: SRSItemTypeShort; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (opts.item_type) qs.set('item_type', opts.item_type);
    if (opts.limit) qs.set('limit', String(opts.limit));
    const q = qs.toString();
    return ApiClient.get<SRSWeakResponse>(`/srs/weak${q ? `?${q}` : ''}`);
  },

  review: (body: SRSReviewRequest) =>
    ApiClient.post<SRSReviewResponse>('/srs/review', body),

  // === Practice ===
  generatePracticeSession: (body: GeneratePracticeRequest = {}) =>
    ApiClient.post<GeneratePracticeResponse>('/practice/session', body),

  // === Mistakes ===
  listMistakes: (
    opts: { resolved?: MistakeFilter; limit?: number; offset?: number } = {},
  ) => {
    const qs = new URLSearchParams();
    const r = mistakeFilterToParam(opts.resolved ?? 'all');
    if (r) qs.set('resolved', r);
    if (opts.limit) qs.set('limit', String(opts.limit));
    if (opts.offset) qs.set('offset', String(opts.offset));
    const q = qs.toString();
    return ApiClient.get<ListMistakesResponse>(`/mistakes${q ? `?${q}` : ''}`);
  },

  // === Skill decay ===
  listSkills: (
    opts: { skill_type?: SkillTypeShort; limit?: number; offset?: number } = {},
  ) => {
    const qs = new URLSearchParams();
    if (opts.skill_type) qs.set('skill_type', opts.skill_type);
    if (opts.limit) qs.set('limit', String(opts.limit));
    if (opts.offset) qs.set('offset', String(opts.offset));
    const q = qs.toString();
    return ApiClient.get<SkillStrengthsResponse>(`/skills${q ? `?${q}` : ''}`);
  },

  getWeakSkills: (opts: { skill_type?: SkillTypeShort; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (opts.skill_type) qs.set('skill_type', opts.skill_type);
    if (opts.limit) qs.set('limit', String(opts.limit));
    const q = qs.toString();
    return ApiClient.get<WeakSkillsResponse>(`/skills/weak${q ? `?${q}` : ''}`);
  },
};

// ============================================
// PHASE 3 — Push notifications
// ============================================

function readFilterToParam(f: NotificationsReadFilter): string | null {
  if (f === 'unread') return 'unread';
  if (f === 'read') return 'read';
  return null;
}

/**
 * Phase 3: notifications-service через gateway. См. eng_next2/src/lib/notifications-api.ts.
 *   POST   /notifications/devices
 *   GET    /notifications/devices
 *   DELETE /notifications/devices/:id
 *   GET    /notifications/preferences
 *   PUT    /notifications/preferences
 *   GET    /notifications?read=&limit=&offset=
 *   POST   /notifications/:id/read
 *   POST   /notifications/read-all
 */
export const NotificationsApi = {
  // === Devices ===
  registerDevice: (body: RegisterDeviceRequest) =>
    ApiClient.post<RegisterDeviceResponse>('/notifications/devices', body),

  listDevices: () =>
    ApiClient.get<ListDevicesResponse>('/notifications/devices'),

  unregisterDevice: (id: string) =>
    ApiClient.delete<unknown>(
      `/notifications/devices/${encodeURIComponent(id)}`,
    ),

  // === Preferences ===
  getPreferences: () =>
    ApiClient.get<GetPreferencesResponse>('/notifications/preferences'),

  updatePreferences: (body: UpdatePreferencesRequest) =>
    ApiClient.put<UpdatePreferencesResponse>(
      '/notifications/preferences',
      body,
    ),

  // === Inbox ===
  list: (
    opts: { read?: NotificationsReadFilter; limit?: number; offset?: number } = {},
  ) => {
    const qs = new URLSearchParams();
    const r = readFilterToParam(opts.read ?? 'all');
    if (r) qs.set('read', r);
    if (opts.limit) qs.set('limit', String(opts.limit));
    if (opts.offset) qs.set('offset', String(opts.offset));
    const q = qs.toString();
    return ApiClient.get<ListNotificationsResponse>(
      `/notifications${q ? `?${q}` : ''}`,
    );
  },

  markRead: (id: string) =>
    ApiClient.post<MarkReadResponse>(
      `/notifications/${encodeURIComponent(id)}/read`,
    ),

  markAllRead: () => ApiClient.post<MarkReadResponse>('/notifications/read-all'),
};
