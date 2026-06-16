import {
  AcceptFriendRequestResponse,
  AchievementsResponse,
  ApiError,
  CompleteStepRequest,
  CompleteStepResponse,
  DailyGoal,
  GeneratePracticeRequest,
  GeneratePracticeResponse,
  GetFriendsLeaderboardResponse,
  GetLeagueHistoryResponse,
  GetMyLeaderboardResponse,
  GetMyLeagueResponse,
  GetPreferencesResponse,
  Hearts,
  LessonWithSteps,
  ListDevicesResponse,
  ListFriendsResponse,
  ListLeaguesResponse,
  ListMistakesResponse,
  ListNotificationsResponse,
  ListPendingRequestsResponse,
  ListTracksResponse,
  MarkReadResponse,
  MistakeFilter,
  NotificationsReadFilter,
  PendingDirection,
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
  SearchFriendsResponse,
  SendFriendRequestResponse,
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
import { Platform } from 'react-native';

import { AuthService } from './auth-service';

/**
 * Resolve base URL with platform-aware host rewrite.
 *
 * `.env` обычно содержит `10.0.2.2` (Android emulator alias to host loopback).
 * Этот адрес не работает ни в браузере (`web`), ни в iOS-симуляторе — там
 * нужен `localhost`. Поэтому на не-Android платформах автоматически
 * подменяем `10.0.2.2` на `localhost`.
 */
function resolveApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081/api/v1';
  if (Platform.OS !== 'android' && raw.includes('10.0.2.2')) {
    return raw.replace('10.0.2.2', 'localhost');
  }
  return raw;
}

const API_BASE_URL = resolveApiBaseUrl();

/**
 * Эндпоинты, на которых 401-redirect не делаем — иначе получим петлю
 * (`/auth/claim` без токена → redirect → `/auth/claim` без токена...).
 * `/auth/guest` сам публичный — 401 от него не приходит, но включаем
 * для надёжности.
 */
function isAuthEndpoint(endpoint: string): boolean {
  return (
    endpoint.startsWith('/auth/login') ||
    endpoint.startsWith('/auth/register') ||
    endpoint.startsWith('/auth/refresh') ||
    endpoint.startsWith('/auth/claim') ||
    endpoint.startsWith('/auth/guest')
  );
}

/** Sentinel чтобы не дёргать redirect/clear много раз подряд. */
let unauthorizedHandling: Promise<void> | null = null;

/**
 * Глобальный обработчик 401: чистит токены и редиректит на /auth/login.
 * Импорт `expo-router` лениво, чтобы api-client не тащил RN-навигацию
 * в SSR / тестах.
 *
 * Экспортируется для прямых fetch-вызовов в обход `ApiClient.request`
 * (например, multipart-загрузки в `ai-api.ts:checkPronunciation`).
 */
export async function handleUnauthorized(): Promise<void> {
  if (unauthorizedHandling) return unauthorizedHandling;
  unauthorizedHandling = (async () => {
    try {
      await AuthService.clearTokens();
      const { router } = await import('expo-router');
      router.replace('/auth/login');
    } catch (err) {
      if (__DEV__) {
        console.warn('[api-client] handleUnauthorized failed:', err);
      }
    } finally {
      // Сбрасываем sentinel через 1s — если юзер залогинится и снова
      // получит 401, повторно отработаем.
      setTimeout(() => {
        unauthorizedHandling = null;
      }, 1000);
    }
  })();
  return unauthorizedHandling;
}

/**
 * Жёсткий таймаут на каждый fetch.
 * Без него на unreachable host (например, неподнятый бэкенд) запрос
 * висит десятки секунд, blocking UI flows вроде онбординг-CTA.
 */
const REQUEST_TIMEOUT_MS = 10_000;

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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      if (!response.ok) {
        // Global 401 handler: токен невалиден / истёк / отсутствует на
        // protected роуте. Чистим хранилище и кидаем юзера на root —
        // index.tsx сам решит, куда (welcome/login/tabs).
        // Не делаем редирект для auth-эндпоинтов (claim/login/refresh)
        // и для /auth/guest, чтобы caller сам обработал ошибку без петли.
        if (response.status === 401 && !isAuthEndpoint(endpoint)) {
          await handleUnauthorized();
        }
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
      // AbortController — таймаут или явный abort.
      if (error instanceof Error && error.name === 'AbortError') {
        throw {
          message: `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`,
          statusCode: 0,
        } as ApiError;
      }
      // Network errors or other fetch errors
      if (error instanceof TypeError) {
        throw {
          message: 'Network error. Please check your connection.',
          statusCode: 0,
        } as ApiError;
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
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

// ============================================
// PHASE 4 — Social / Leagues
// ============================================

/**
 * Phase 4: social-service через gateway. См. eng_next2/src/lib/social-api.ts.
 *
 *   GET  /leagues                        — public каталог 10 лиг
 *   GET  /leagues/mine                   — моя лига + cohort + rank (auth)
 *   GET  /leagues/mine/leaderboard       — топ 30 моей когорты (auth)
 *   GET  /leagues/history?limit=&offset= — история циклов (auth)
 */
export const SocialApi = {
  listLeagues: () => ApiClient.get<ListLeaguesResponse>('/leagues'),

  getMyLeague: () => ApiClient.get<GetMyLeagueResponse>('/leagues/mine'),

  getMyLeaderboard: () =>
    ApiClient.get<GetMyLeaderboardResponse>('/leagues/mine/leaderboard'),

  getHistory: (opts: { limit?: number; offset?: number } = {}) => {
    const qs = new URLSearchParams();
    if (opts.limit) qs.set('limit', String(opts.limit));
    if (opts.offset) qs.set('offset', String(opts.offset));
    const q = qs.toString();
    return ApiClient.get<GetLeagueHistoryResponse>(
      `/leagues/history${q ? `?${q}` : ''}`,
    );
  },
};

// ============================================
// PHASE 4.5 — Friends
// ============================================

/**
 * Phase 4.5: Friends API через gateway.
 *
 *   GET    /friends?limit=&offset=
 *   GET    /friends/pending?direction=&limit=&offset=
 *   POST   /friends/request           { user_id }
 *   POST   /friends/accept/:friendshipId
 *   POST   /friends/reject/:friendshipId
 *   DELETE /friends/:friendId
 *   GET    /friends/search?q=&limit=
 *   GET    /friends/leaderboard?limit=
 */
export const FriendsApi = {
  list: (opts: { limit?: number; offset?: number } = {}) => {
    const qs = new URLSearchParams();
    if (opts.limit) qs.set('limit', String(opts.limit));
    if (opts.offset) qs.set('offset', String(opts.offset));
    const q = qs.toString();
    return ApiClient.get<ListFriendsResponse>(`/friends${q ? `?${q}` : ''}`);
  },

  listPending: (
    opts: {
      direction?: PendingDirection;
      limit?: number;
      offset?: number;
    } = {},
  ) => {
    const qs = new URLSearchParams();
    if (opts.direction && opts.direction !== 'all') {
      qs.set('direction', opts.direction);
    }
    if (opts.limit) qs.set('limit', String(opts.limit));
    if (opts.offset) qs.set('offset', String(opts.offset));
    const q = qs.toString();
    return ApiClient.get<ListPendingRequestsResponse>(
      `/friends/pending${q ? `?${q}` : ''}`,
    );
  },

  sendRequest: (userId: string) =>
    ApiClient.post<SendFriendRequestResponse>('/friends/request', {
      user_id: userId,
    }),

  accept: (friendshipId: string) =>
    ApiClient.post<AcceptFriendRequestResponse>(
      `/friends/accept/${encodeURIComponent(friendshipId)}`,
    ),

  reject: (friendshipId: string) =>
    ApiClient.post<{ ok: boolean }>(
      `/friends/reject/${encodeURIComponent(friendshipId)}`,
    ),

  remove: (friendId: string) =>
    ApiClient.delete<{ ok: boolean }>(
      `/friends/${encodeURIComponent(friendId)}`,
    ),

  search: (query: string, limit = 20) => {
    const qs = new URLSearchParams({ q: query, limit: String(limit) });
    return ApiClient.get<SearchFriendsResponse>(`/friends/search?${qs}`);
  },

  leaderboard: (limit = 50) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    return ApiClient.get<GetFriendsLeaderboardResponse>(
      `/friends/leaderboard?${qs}`,
    );
  },
};

// =========================================================================
// Onboarding v3 (Oki-style) — guest mode + state PATCH + claim.
// Маршруты gateway:
//   POST   /auth/guest                    — bootstrap guest user
//   POST   /auth/claim                    — claim guest (email/password)
//   POST   /auth/claim/oauth              — claim guest (OAuth Google/Apple)
//   GET    /onboarding                    — read current state
//   PATCH  /onboarding                    — partial update (после каждого шага)
//   POST   /onboarding/complete           — финал онбординга
// =========================================================================

import type {
  ClaimGuestOAuthRequest,
  ClaimGuestRequest,
  ClaimGuestResponse,
  GuestSessionResponse,
  OnboardingStateResponse,
  PatchOnboardingRequest,
} from '@/types/api';

export const AuthApi = {
  /** createGuestSession — bootstrap анонимного юзера, idempotent на device_id. */
  createGuestSession: (deviceId: string) =>
    ApiClient.post<GuestSessionResponse>('/auth/guest', { device_id: deviceId }),

  /**
   * claim — claim гостя через email/password. Требует guest JWT.
   *
   * `idempotencyKey` — UUID, передаётся в заголовок `Idempotency-Key`.
   * Защищает от создания дубликата при retry / double-tap. Backend
   * может пока игнорировать заголовок (forward-compatible).
   */
  claim: (req: ClaimGuestRequest, idempotencyKey?: string) =>
    ApiClient.post<ClaimGuestResponse>('/auth/claim', req, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    }),

  /** claimOAuth — claim гостя через Google / Apple / guest_fake stub. */
  claimOAuth: (req: ClaimGuestOAuthRequest, idempotencyKey?: string) =>
    ApiClient.post<ClaimGuestResponse>('/auth/claim/oauth', req, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    }),
};

export const OnboardingApi = {
  getState: () => ApiClient.get<OnboardingStateResponse>('/onboarding'),
  patchState: (patch: PatchOnboardingRequest) =>
    ApiClient.patch<OnboardingStateResponse>('/onboarding', patch),
  complete: () => ApiClient.post<OnboardingStateResponse>('/onboarding/complete', {}),
};

// =========================================================================
// Phase 7: Word Flashcards API
// =========================================================================

import type {
  Flashcard,
  FlashcardStats,
  ListFlashcardsRequest,
  ListFlashcardsResponse,
  CreateFlashcardRequest,
  UpdateFlashcardRequest,
  BulkCreateFlashcardsRequest,
  BulkCreateFlashcardsResponse,
  PinForTodayRequest,
  ListTodayQueueResponse,
  SuggestFlashcardsRequest,
  SuggestFlashcardsResponse,
  FlashcardReviewRequest,
  FlashcardReviewResponse,
} from '@/types/api';

export const FlashcardsApi = {
  list: (params?: ListFlashcardsRequest) => {
    const qs = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.set(k, String(v));
      });
    }
    const q = qs.toString();
    return ApiClient.get<ListFlashcardsResponse>(`/flashcards${q ? `?${q}` : ''}`);
  },

  get: (id: string, includeSrs = false) =>
    ApiClient.get<Flashcard>(`/flashcards/${encodeURIComponent(id)}${includeSrs ? '?include_srs=true' : ''}`),

  create: (data: CreateFlashcardRequest) =>
    ApiClient.post<Flashcard>('/flashcards', data),

  update: (id: string, data: UpdateFlashcardRequest) =>
    ApiClient.put<Flashcard>(`/flashcards/${encodeURIComponent(id)}`, data),

  archive: (id: string) =>
    ApiClient.delete(`/flashcards/${encodeURIComponent(id)}`),

  bulkCreate: (data: BulkCreateFlashcardsRequest) =>
    ApiClient.post<BulkCreateFlashcardsResponse>('/flashcards/bulk', data),

  fromVocabulary: (vocabularyId: string, source = 'lesson') =>
    ApiClient.post<Flashcard>('/flashcards/from-vocabulary', { vocabulary_id: vocabularyId, source }),

  stats: () =>
    ApiClient.get<FlashcardStats>('/flashcards/stats'),

  /** Ревью карточки: помню/забыл → SM-2 на бэке. */
  review: (id: string, data: FlashcardReviewRequest) =>
    ApiClient.post<FlashcardReviewResponse>(`/flashcards/${encodeURIComponent(id)}/review`, data),

  /** Стартовый набор из системного словаря (идемпотентно) + пин на сегодня. */
  seedStarter: (language = 'en') =>
    ApiClient.post<{ created: number; already: boolean; total?: number }>(
      `/flashcards/starter?language=${encodeURIComponent(language)}`,
    ),

  // Today queue
  listToday: (queuedForDate?: string, includeSrs = false) => {
    const qs = new URLSearchParams();
    if (queuedForDate) qs.set('queued_for_date', queuedForDate);
    if (includeSrs) qs.set('include_srs', 'true');
    const q = qs.toString();
    return ApiClient.get<ListTodayQueueResponse>(`/flashcards/today${q ? `?${q}` : ''}`);
  },

  pinForToday: (flashcardId: string, data?: PinForTodayRequest) =>
    ApiClient.post(`/flashcards/today/${encodeURIComponent(flashcardId)}`, data),

  unpinFromToday: (flashcardId: string, queuedForDate?: string) => {
    const qs = queuedForDate ? `?queued_for_date=${encodeURIComponent(queuedForDate)}` : '';
    return ApiClient.delete(`/flashcards/today/${encodeURIComponent(flashcardId)}${qs}`);
  },

  // AI suggestions
  suggestions: (params?: SuggestFlashcardsRequest) => {
    const qs = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.set(k, String(v));
      });
    }
    const q = qs.toString();
    return ApiClient.get<SuggestFlashcardsResponse>(`/ai/flashcard-suggestions${q ? `?${q}` : ''}`);
  },
};
