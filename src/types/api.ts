// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user?: User;
  expires_at?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile extends User {
  bio?: string;
  level?: string;
  xp?: number;
  streak?: number;
}

// Course Types
export interface Course {
  id: string;
  title: string;
  description: string;
  instructor?: string;
  instructorAvatar?: string;
  rating?: number;
  reviews?: number;
  students?: number;
  price: number;
  level: string;
  image?: string;
  lastUpdated?: string;
  instructor_id?: string;
  language?: string;
  thumbnail_url?: string;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CourseDetails extends Course {
  whatYouWillLearn?: string[];
  modules?: CourseModule[];
}

export interface CourseModule {
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  title: string;
  status: 'completed' | 'current' | 'locked';
}

export interface EnrollmentRequest {
  courseId: string;
}

export interface EnrollmentResponse {
  success: boolean;
  message: string;
  enrollment: {
    id: string;
    courseId: string;
    userId: string;
    enrolledAt: string;
  };
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter Types
export interface CourseFilters extends PaginationParams {
  level?: string[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

// ============================================
// STEP TYPES
// ============================================

export type StepType =
  // Legacy
  | 'video'
  | 'text'
  | 'quiz'
  | 'task'
  | 'brain_game'
  | 'ai_writing'
  // Phase 2 interactive
  | 'translate'
  | 'match_pairs'
  | 'listening'
  | 'fill_blank'
  | 'tap_words'
  | 'story';

/** Все phase-2 интерактивные типы, проходящие через step-validation-service. */
export const INTERACTIVE_STEP_TYPES: StepType[] = [
  'quiz', 'translate', 'match_pairs', 'listening', 'fill_blank', 'tap_words', 'story',
];

export function isInteractiveStep(t: StepType): boolean {
  return INTERACTIVE_STEP_TYPES.includes(t);
}

export interface Step {
  id: string;
  lesson_id: string;
  type: StepType;
  title: string;
  content: string; // JSON string - requires parsing
  order_index: number;
}

// ============================================
// CONTENT SCHEMAS (after JSON.parse)
// ============================================

export interface VideoContent {
  video_id: string;
  duration_seconds: number;
  subtitles: string[];
}

export interface TextContent {
  body: string; // Markdown or HTML
  reading_time_minutes: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number; // index of correct answer
  explanation: string;
}

export interface QuizContent {
  questions: QuizQuestion[];
}

export interface TaskContent {
  instructions: string;
  template: string;
  correct_answers: string[];
  hints: string[];
}

export interface BrainGameContent {
  game_type: 'matching' | 'memory' | 'flashcards';
  pairs: Array<{ word: string; translation: string }>;
}

export interface AIWritingContent {
  prompt: string;
  min_words: number;
  evaluation_criteria: string[];
}

// ============================================
// PHASE 2 — Step content schemas
// ============================================

export interface TranslateContent {
  instruction?: string;
  source_text: string;
  source_language?: string;
  target_language?: string;
  correct_translation: string;
  word_bank: string[];
  alternative_answers?: string[];
  hints?: string[];
  explanation?: string;
}

export interface MatchPairsPair {
  left: string;
  right: string;
  audio?: string;
}

export interface MatchPairsContent {
  instruction?: string;
  pairs: MatchPairsPair[];
  explanation?: string;
}

export interface ListeningContent {
  instruction?: string;
  audio_text: string;
  language?: string;
  audio_url?: string;
  translation_hint?: string;
  alternative_answers?: string[];
  explanation?: string;
}

export interface FillBlankContent {
  instruction?: string;
  sentence_template: string;
  options?: string[];
  correct_answer: string;
  translation_hint?: string;
  alternatives?: string[];
  explanation?: string;
}

export interface TapWordsContent {
  instruction?: string;
  audio_url?: string;
  audio_text?: string;
  word_bank: string[];
  correct_words: string[];
  explanation?: string;
}

export interface StoryScene {
  image_url?: string;
  character?: string;
  text?: string;
  translation?: string;
  type?: 'narrative' | 'choice';
  question?: string;
  options?: Array<{ text: string; is_correct: boolean }>;
}

export interface StoryContent {
  title?: string;
  scenes: StoryScene[];
  explanation?: string;
}

// ============================================
// PHASE 2 — Vocabulary / TTS
// ============================================

export interface VocabularyEntry {
  id: string;
  language: string;
  word: string;
  translation: string;
  target_language: string;
  audio_url?: string;
  image_url?: string;
  level?: string;
  pos?: string;
  created_at?: ProtoTimestamp | string;
  updated_at?: ProtoTimestamp | string;
}

export interface VocabularyListResponse {
  entries: VocabularyEntry[];
  total: number;
}

export interface TTSCacheEntry {
  id: string;
  text: string;
  language: string;
  voice: string;
  audio_url: string;
  duration_ms?: number;
  created_at?: ProtoTimestamp | string;
}

// ============================================
// PHASE 2 — Step submit (step-validation-service)
// ============================================

export interface StepAttempt {
  id: string;
  user_id: string;
  step_id: string;
  lesson_id?: string;
  step_type: StepType;
  answer: Record<string, unknown>;
  is_correct: boolean;
  score: number;
  time_spent_ms?: number;
  created_at?: ProtoTimestamp | string;
}

export interface SubmitAnswerRequest {
  answer: Record<string, unknown>;
  time_spent_ms?: number;
  source_type?: 'course' | 'track' | 'standalone';
  source_id?: string;
}

export interface SubmitAnswerResponse {
  is_correct: boolean;
  score: number;
  correct_answer?: Record<string, unknown>;
  explanation?: string;
  attempt?: StepAttempt;
  gamification?: AddXPResponse;
  hearts?: Hearts;
}

// ============================================
// LESSON TYPES
// ============================================

export interface LessonDetails {
  id: string;
  module_id: string; // "" => standalone
  title: string;
  description: string;
  order_index: number;
  is_standalone?: boolean; // присутствует у /lessons/:id
}

export interface LessonWithSteps {
  lesson: LessonDetails;
  steps: Step[];
}

// ============================================
// LEARNING TRACKS (Phase 0)
// ============================================

export type TrackType = 'thematic' | 'daily' | 'stories' | 'podcast';

export interface Track {
  id: string;
  code: string;
  title: string;
  description: string;
  icon_url: string;
  language: string;
  level: string;
  track_type: TrackType | string;
  is_published: boolean;
  sort_order: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TrackWithLessons extends Track {
  lessons?: LessonDetails[];
}

export interface ListTracksResponse {
  tracks: Track[];
  total: number;
}

export interface TrackFilters {
  language?: string;
  level?: string;
  track_type?: TrackType | string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface StepWithVideo {
  step: Step;
  video_url?: string; // Only for type=video
}

// ============================================
// PROGRESS TYPES
// ============================================

export interface StepProgress {
  id: string;
  user_id: string;
  step_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  time_spent_seconds: number;
  attempts: number;
  score: number | null;
  created_at: string;
  updated_at: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  total_steps: number;
  completed_steps: number;
  progress_percentage: number;
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
}

export interface CourseProgressData {
  lesson_progresses: LessonProgress[];
  total_lessons: number;
  completed_lessons: number;
  overall_progress_percentage: number;
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

export interface CompleteStepRequest {
  time_spent_seconds: number;
  attempts?: number;
  score?: number;
}

export interface CompleteStepResponse {
  step_progress: StepProgress;
  lesson_progress: LessonProgress;
  /**
   * Опциональный gamification-payload (см. AddXPResponse). Заполняется
   * когда course-service настроен на gamification-service. Если поле
   * отсутствует — useLessonGamificationFx фолбэкнется на diff из кэша.
   */
  gamification?: AddXPResponse;
}

export interface StepProgressResponse {
  progress: StepProgress;
  exists: boolean;
}

export interface LessonProgressResponse {
  progress: LessonProgress;
  step_progresses: StepProgress[];
}

export interface EnrollmentCheck {
  has_access: boolean;
}

// ============================================
// GAMIFICATION TYPES (proto: gamification/v1)
// ============================================

/**
 * Gateway сериализует google.protobuf.Timestamp как объект {seconds, nanos}
 * (стандартный encoding/json от proto-gen Go), либо иногда как RFC3339 строку
 * у некоторых обработчиков. Принимаем оба варианта — клиент нормализует
 * через `tsToDate()` из `lib/gamification-api`.
 */
export type ProtoTimestamp =
  | { seconds?: number | string; nanos?: number }
  | string
  | null
  | undefined;

export interface UserStats {
  user_id: string;
  level: number;
  total_xp: number;
  weekly_xp: number;
  next_level_xp: number;
  current_streak: number;
  max_streak: number;
  last_lesson_at?: ProtoTimestamp;
  hearts: number;
  max_hearts: number;
  next_heart_at?: ProtoTimestamp;
  gems: number;
  streak_freezes: number;
  created_at?: ProtoTimestamp;
  updated_at?: ProtoTimestamp;
}

export interface Hearts {
  user_id: string;
  hearts: number;
  max_hearts: number;
  next_heart_at?: ProtoTimestamp;
  unlimited?: boolean;
}

export interface DailyGoalProgress {
  user_id: string;
  date: string; // YYYY-MM-DD
  xp_earned: number;
  goal: number;
  completed: boolean;
  completed_at?: ProtoTimestamp;
}

export interface DailyGoal {
  user_id: string;
  target_xp: number;
  updated_at?: ProtoTimestamp;
  today?: DailyGoalProgress;
}

export interface Streak {
  user_id: string;
  current_streak: number;
  max_streak: number;
  last_lesson_at?: ProtoTimestamp;
  streak_freezes: number;
}

export interface StreakDay {
  date: string; // YYYY-MM-DD
  completed: boolean;
  used_freeze: boolean;
}

export interface StreakHistory {
  user_id: string;
  days: StreakDay[];
}

export type XPReason =
  | 'XP_REASON_UNSPECIFIED'
  | 'XP_REASON_STEP_COMPLETED'
  | 'XP_REASON_LESSON_COMPLETED'
  | 'XP_REASON_DAILY_GOAL'
  | 'XP_REASON_ACHIEVEMENT'
  | 'XP_REASON_STREAK_BONUS'
  | 'XP_REASON_PRACTICE'
  | number; // gateway отдает enum как число

export interface XPTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: XPReason;
  source_id: string;
  created_at?: ProtoTimestamp;
}

export interface XPHistoryResponse {
  transactions: XPTransaction[];
  total: number;
}

export type AchievementCategory = 'learning' | 'streak' | 'xp' | 'special' | string;

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon_url: string;
  category: AchievementCategory;
  tier: number; // 1 bronze | 2 silver | 3 gold
  xp_reward: number;
  gems_reward: number;
  criteria_json: string;
  is_hidden: boolean;
  created_at?: ProtoTimestamp;
}

export interface UserAchievement {
  user_id: string;
  achievement: Achievement;
  progress: number;
  unlocked_at?: ProtoTimestamp;
}

export interface AchievementsResponse {
  achievements: Achievement[];
}

export interface UserAchievementsResponse {
  achievements: UserAchievement[];
}

export interface AddXPResponse {
  transaction?: XPTransaction;
  stats?: UserStats;
  leveled_up: boolean;
  new_level: number;
  unlocked_achievements: UserAchievement[];
  daily_goal_progress?: DailyGoalProgress;
}

export type RefillReason = 'practice' | 'gems' | 'premium';

// ============================================================================
// Phase 3 — SRS / Practice / Mistakes / Skill decay
// ============================================================================

/**
 * proto enum.ItemType сериализуется как строка ("ITEM_TYPE_STEP") или число.
 * Принимаем оба варианта — везде есть string-shortcut helper.
 */
export type SRSItemTypeProto =
  | 'ITEM_TYPE_UNSPECIFIED'
  | 'ITEM_TYPE_VOCABULARY'
  | 'ITEM_TYPE_STEP'
  | 'ITEM_TYPE_PHRASE'
  | number;

/** Удобный shortcut для UI — соответствует query-param ?item_type=. */
export type SRSItemTypeShort = 'vocabulary' | 'step' | 'phrase';

export interface SRSItem {
  id: string;
  user_id: string;
  item_type: SRSItemTypeProto;
  item_id: string;
  easiness_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at?: ProtoTimestamp;
  last_reviewed_at?: ProtoTimestamp;
  total_reviews: number;
  correct_reviews: number;
  incorrect_reviews: number;
  avg_response_time_ms: number;
  strength: number;
  created_at?: ProtoTimestamp;
  updated_at?: ProtoTimestamp;
}

export interface SRSReviewHistory {
  id: string;
  srs_item_id: string;
  user_id: string;
  quality: number;
  response_time_ms: number;
  used_hint: boolean;
  reviewed_at?: ProtoTimestamp;
  new_interval_days: number;
  new_easiness_factor: number;
  new_repetitions: number;
}

export interface SRSStats {
  total_items: number;
  due_now: number;
  mastered: number;
  learning: number;
  fresh: number;
  reviewed_today: number;
}

export interface SRSDueResponse {
  items: SRSItem[];
  total: number;
}

export interface SRSWeakResponse {
  items: SRSItem[];
}

export interface SRSReviewRequest {
  item_type: SRSItemTypeShort;
  item_id: string;
  quality: number;
  response_time_ms?: number;
  used_hint?: boolean;
}

export interface SRSReviewResponse {
  item: SRSItem;
  history: SRSReviewHistory;
}

// --- Mistakes ---

export interface Mistake {
  id: string;
  user_id: string;
  step_id: string;
  incorrect_answer?: Record<string, unknown>;
  times_made: number;
  last_made_at?: ProtoTimestamp;
  is_resolved: boolean;
  resolved_at?: ProtoTimestamp;
  created_at?: ProtoTimestamp;
}

export interface ListMistakesResponse {
  mistakes: Mistake[];
  total: number;
}

export type MistakeFilter = 'all' | 'unresolved' | 'resolved';

// --- Practice ---

export type PracticeSourceProto =
  | 'PRACTICE_SOURCE_UNSPECIFIED'
  | 'PRACTICE_SOURCE_OVERDUE'
  | 'PRACTICE_SOURCE_MISTAKE'
  | 'PRACTICE_SOURCE_WEAK'
  | number;

export interface PracticeItem {
  source: PracticeSourceProto;
  srs_item?: SRSItem;
  mistake?: Mistake;
  step_id: string;
}

export interface GeneratePracticeRequest {
  size?: number;
  ratio_overdue?: number;
  ratio_mistake?: number;
  ratio_weak?: number;
}

export interface GeneratePracticeResponse {
  items: PracticeItem[];
  overdue_count: number;
  mistake_count: number;
  weak_count: number;
}

// --- Skill decay ---

export type SkillTypeProto =
  | 'SKILL_TYPE_UNSPECIFIED'
  | 'SKILL_TYPE_MODULE'
  | 'SKILL_TYPE_LESSON'
  | number;

export type SkillTypeShort = 'module' | 'lesson';

export interface SkillDecay {
  user_id: string;
  skill_id: string;
  skill_type: SkillTypeProto;
  initial_strength: number;
  current_strength: number;
  decay_rate: number;
  last_practiced_at?: ProtoTimestamp;
  created_at?: ProtoTimestamp;
  updated_at?: ProtoTimestamp;
}

export interface SkillStrengthsResponse {
  skills: SkillDecay[];
  total: number;
}

export interface WeakSkillsResponse {
  skills: SkillDecay[];
}

// --- Helpers ---

export function itemTypeShort(t: SRSItemTypeProto): SRSItemTypeShort | null {
  if (typeof t === 'number') {
    if (t === 1) return 'vocabulary';
    if (t === 2) return 'step';
    if (t === 3) return 'phrase';
    return null;
  }
  switch (t) {
    case 'ITEM_TYPE_VOCABULARY':
      return 'vocabulary';
    case 'ITEM_TYPE_STEP':
      return 'step';
    case 'ITEM_TYPE_PHRASE':
      return 'phrase';
    default:
      return null;
  }
}

export function skillTypeShort(t: SkillTypeProto): SkillTypeShort | null {
  if (typeof t === 'number') {
    if (t === 1) return 'module';
    if (t === 2) return 'lesson';
    return null;
  }
  switch (t) {
    case 'SKILL_TYPE_MODULE':
      return 'module';
    case 'SKILL_TYPE_LESSON':
      return 'lesson';
    default:
      return null;
  }
}

export function practiceSourceLabel(
  s: PracticeSourceProto,
): 'overdue' | 'mistake' | 'weak' | null {
  if (typeof s === 'number') {
    if (s === 1) return 'overdue';
    if (s === 2) return 'mistake';
    if (s === 3) return 'weak';
    return null;
  }
  switch (s) {
    case 'PRACTICE_SOURCE_OVERDUE':
      return 'overdue';
    case 'PRACTICE_SOURCE_MISTAKE':
      return 'mistake';
    case 'PRACTICE_SOURCE_WEAK':
      return 'weak';
    default:
      return null;
  }
}

// ============================================================================
// Phase 3 — Push notifications (notifications-service via gateway).
// ============================================================================

export type NotificationChannelShort =
  | 'practice_reminder'
  | 'streak_risk'
  | 'daily_goal'
  | 'achievement'
  | 'friend_request';

export type NotificationChannelProto =
  | 'CHANNEL_UNSPECIFIED'
  | 'CHANNEL_PRACTICE_REMINDER'
  | 'CHANNEL_STREAK_RISK'
  | 'CHANNEL_DAILY_GOAL'
  | 'CHANNEL_ACHIEVEMENT'
  | 'CHANNEL_FRIEND_REQUEST'
  | number;

export type DevicePlatformShort = 'web' | 'expo' | 'ios' | 'android';
export type DevicePlatformProto =
  | 'PLATFORM_UNSPECIFIED'
  | 'PLATFORM_WEB'
  | 'PLATFORM_EXPO'
  | 'PLATFORM_IOS'
  | 'PLATFORM_ANDROID'
  | number;

export type SendStatusShort = 'queued' | 'sent' | 'failed' | 'skipped';
export type SendStatusProto =
  | 'SEND_STATUS_UNSPECIFIED'
  | 'SEND_STATUS_QUEUED'
  | 'SEND_STATUS_SENT'
  | 'SEND_STATUS_FAILED'
  | 'SEND_STATUS_SKIPPED'
  | number;

export interface DeviceToken {
  id: string;
  user_id: string;
  platform: DevicePlatformProto;
  token: string;
  endpoint?: string;
  p256dh?: string;
  auth?: string;
  user_agent?: string;
  locale?: string;
  created_at?: string;
  last_seen_at?: string;
  revoked_at?: string | null;
}

export interface RegisterDeviceRequest {
  platform: DevicePlatformShort;
  token: string;
  endpoint?: string;
  p256dh?: string;
  auth?: string;
  user_agent?: string;
  locale?: string;
}

export interface RegisterDeviceResponse {
  device: DeviceToken;
  created: boolean;
}

export interface ListDevicesResponse {
  devices: DeviceToken[];
}

export interface UserPreferences {
  user_id: string;
  practice_reminder_enabled: boolean;
  streak_risk_enabled: boolean;
  daily_goal_enabled: boolean;
  achievement_enabled: boolean;
  friend_request_enabled: boolean;
  quiet_hours_start: number;
  quiet_hours_end: number;
  timezone?: string;
}

export interface GetPreferencesResponse {
  prefs: UserPreferences;
  defaults_used?: boolean;
}

export type UpdatePreferencesRequest = Omit<UserPreferences, 'user_id'>;

export interface UpdatePreferencesResponse {
  prefs: UserPreferences;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  channel: NotificationChannelProto;
  kind: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  dedup_key?: string;
  status: SendStatusProto;
  read_at?: string | null;
  created_at?: string;
  sent_at?: string | null;
  devices_succeeded?: number;
}

export type NotificationsReadFilter = 'all' | 'read' | 'unread';

export interface ListNotificationsResponse {
  notifications: NotificationLog[];
  total: number;
  unread: number;
}

export interface MarkReadResponse {
  marked: number;
}

export function platformToShort(
  p: DevicePlatformProto,
): DevicePlatformShort | null {
  if (typeof p === 'number') {
    if (p === 1) return 'web';
    if (p === 2) return 'expo';
    if (p === 3) return 'ios';
    if (p === 4) return 'android';
    return null;
  }
  switch (p) {
    case 'PLATFORM_WEB':
      return 'web';
    case 'PLATFORM_EXPO':
      return 'expo';
    case 'PLATFORM_IOS':
      return 'ios';
    case 'PLATFORM_ANDROID':
      return 'android';
    default:
      return null;
  }
}

export function channelToShort(
  c: NotificationChannelProto,
): NotificationChannelShort | null {
  if (typeof c === 'number') {
    if (c === 1) return 'practice_reminder';
    if (c === 2) return 'streak_risk';
    if (c === 3) return 'daily_goal';
    if (c === 4) return 'achievement';
    if (c === 5) return 'friend_request';
    return null;
  }
  switch (c) {
    case 'CHANNEL_PRACTICE_REMINDER':
      return 'practice_reminder';
    case 'CHANNEL_STREAK_RISK':
      return 'streak_risk';
    case 'CHANNEL_DAILY_GOAL':
      return 'daily_goal';
    case 'CHANNEL_ACHIEVEMENT':
      return 'achievement';
    case 'CHANNEL_FRIEND_REQUEST':
      return 'friend_request';
    default:
      return null;
  }
}

// ==========================================================================
// Phase 4: Social / Leagues
// ==========================================================================
//
// Бэкенд: social-service (:50061) через gateway:
//   GET  /api/v1/leagues                       — public каталог 10 лиг
//   GET  /api/v1/leagues/mine                  — моя лига + cohort + rank
//   GET  /api/v1/leagues/mine/leaderboard      — топ 30 моей когорты
//   GET  /api/v1/leagues/history?limit=&offset=
//
// Шейпы — JSON-проекция socialv1 protobuf'а (protojson: snake_case + ISO time).

export interface League {
  id: number;
  code: string;
  name: string;
  icon_url: string;
  color: string;
  tier: number;
}

export interface UserLeague {
  user_id: string;
  league: League;
  cohort_id: string;
  weekly_xp: number;
  rank_in_cohort: number;
  joined_at?: string;
  last_updated_at?: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  weekly_xp: number;
  full_name: string;
  avatar_url: string;
  is_me: boolean;
}

export interface LeagueHistoryEntry {
  id: string;
  user_id: string;
  league_id: number;
  cohort_id: string;
  cycle_start_at: string;
  cycle_end_at: string;
  final_xp: number;
  final_rank: number;
  promoted: boolean;
  demoted: boolean;
  gems_earned: number;
  created_at?: string;
}

export interface ListLeaguesResponse {
  leagues: League[];
}

export interface GetMyLeagueResponse {
  user_league: UserLeague;
  cycle_end_at: string;
}

export interface GetMyLeaderboardResponse {
  league: League;
  cohort_id: string;
  cycle_end_at: string;
  my_rank: number;
  my_weekly_xp: number;
  entries: LeaderboardEntry[];
  promotion_count: number;
  demotion_count: number;
}

export interface GetLeagueHistoryResponse {
  entries: LeagueHistoryEntry[];
  total: number;
}

// ==========================================================================
// Phase 4.5: Friends (social-service via gateway)
// ==========================================================================
//
// Gateway routes (auth required):
//   GET    /api/v1/friends                      — список accepted друзей
//   GET    /api/v1/friends/pending?direction=   — pending (incoming|outgoing|all)
//   POST   /api/v1/friends/request              { user_id }
//   POST   /api/v1/friends/accept/:friendshipId
//   POST   /api/v1/friends/reject/:friendshipId
//   DELETE /api/v1/friends/:friendId
//   GET    /api/v1/friends/search?q=&limit=     — поиск по username
//   GET    /api/v1/friends/leaderboard?limit=   — sort по weekly_xp DESC

/** FriendshipStatus — proto enum в JSON-проекции (string или number). */
export type FriendshipStatusProto =
  | 'FRIENDSHIP_STATUS_UNSPECIFIED'
  | 'FRIENDSHIP_STATUS_PENDING'
  | 'FRIENDSHIP_STATUS_ACCEPTED'
  | 'FRIENDSHIP_STATUS_BLOCKED'
  | number;

export type FriendshipStatusShort = 'pending' | 'accepted' | 'blocked';

export function friendshipStatusToShort(
  s: FriendshipStatusProto,
): FriendshipStatusShort | null {
  if (typeof s === 'number') {
    if (s === 1) return 'pending';
    if (s === 2) return 'accepted';
    if (s === 3) return 'blocked';
    return null;
  }
  switch (s) {
    case 'FRIENDSHIP_STATUS_PENDING':
      return 'pending';
    case 'FRIENDSHIP_STATUS_ACCEPTED':
      return 'accepted';
    case 'FRIENDSHIP_STATUS_BLOCKED':
      return 'blocked';
    default:
      return null;
  }
}

export interface Friendship {
  id: string;
  user_id_1: string;
  user_id_2: string;
  status: FriendshipStatusProto;
  requested_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface FriendInfo {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  weekly_xp: number;
  total_xp?: number;
  friendship_status: FriendshipStatusProto;
  /** Если pending: true → caller получатель, false → caller отправитель. */
  is_incoming: boolean;
  friendship_id: string;
}

export interface LeaderboardFriendEntry {
  rank: number;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  weekly_xp: number;
  is_me: boolean;
}

export type PendingDirection = 'all' | 'incoming' | 'outgoing';

// --- Requests / Responses ---

export interface ListFriendsResponse {
  friends: FriendInfo[];
  total: number;
}

export interface ListPendingRequestsResponse {
  requests: FriendInfo[];
  total: number;
}

export interface SendFriendRequestRequest {
  user_id: string;
}

export interface SendFriendRequestResponse {
  friendship: Friendship;
  auto_accepted: boolean;
}

export interface AcceptFriendRequestResponse {
  friendship: Friendship;
}

export interface SearchFriendsResponse {
  users: FriendInfo[];
}

export interface GetFriendsLeaderboardResponse {
  entries: LeaderboardFriendEntry[];
}

// ==========================================================================
// Phase 5: AI Integration
// ==========================================================================
//
// Бэкенд: ai-service (:50063) через gateway (auth required):
//   # Conversations / Roleplay / Tutor (persistent)
//   POST   /api/v1/ai/conversations               { scenario, target_language?, user_level?, title? }
//   GET    /api/v1/ai/conversations?limit=&offset=
//   GET    /api/v1/ai/conversations/:id
//   DELETE /api/v1/ai/conversations/:id
//   POST   /api/v1/ai/conversations/:id/messages  { content, want_audio? }
//   GET    /api/v1/ai/scenarios?language=&user_level=
//   # Single-shot
//   POST   /api/v1/ai/explain                     { step_id, incorrect_answer, correct_answer?, ... }
//   POST   /api/v1/ai/writing/assess              { prompt, user_text, target_language?, user_level? }
//   POST   /api/v1/ai/pronunciation/check         multipart: audio + target_text + language
//   POST   /api/v1/ai/tutor                       { question, target_language?, native_language? }
//   GET    /api/v1/ai/quota
//
// Все шейпы — JSON-проекция aiv1 protobuf (snake_case + ISO timestamps).

/** Роль автора сообщения. proto enum MessageRole. */
export type AIMessageRole =
  | 'MESSAGE_ROLE_USER'
  | 'MESSAGE_ROLE_ASSISTANT'
  | 'MESSAGE_ROLE_SYSTEM';

/** Поправка грамматики, рассчитанная провайдером для предыдущего user-сообщения. */
export interface AICorrection {
  original: string;
  corrected: string;
  explanation: string;
}

/** Одно сообщение в conversation. */
export interface AIMessage {
  id: string;
  conversation_id: string;
  role: AIMessageRole;
  content: string;
  audio_url?: string;
  corrections?: AICorrection[];
  /** Перевод reply на native-язык (для assistant). Для user — пусто. */
  translation?: string;
  tokens_used?: number;
  cost_usd?: number;
  created_at?: string;
}

/** AI-сессия (free chat / roleplay / tutor). */
export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  /** free_chat | roleplay_<id> | tutor_qa | ... */
  scenario: string;
  target_language: string;
  user_level: string;
  model: string;
  message_count: number;
  total_tokens: number;
  cost_usd: number;
  started_at?: string;
  last_message_at?: string;
  ended_at?: string;
}

/** Roleplay-сценарий. Статика бэкенда. */
export interface AIScenario {
  id: string;
  title: string;
  description: string;
  user_level: string;
  language: string;
  ai_role: string;
  context: string;
  initial_message: string;
  vocabulary_focus?: string[];
  success_criteria?: string[];
}

// --- Conversation RPC shapes ---

export interface StartConversationRequest {
  scenario: string;
  target_language?: string;
  user_level?: string;
  title?: string;
}

export interface StartConversationResponse {
  conversation: AIConversation;
  initial_message?: AIMessage;
}

export interface SendMessageRequest {
  content: string;
  want_audio?: boolean;
}

export interface SendMessageResponse {
  user_message: AIMessage;
  assistant_message: AIMessage;
}

export interface ListConversationsResponse {
  conversations: AIConversation[];
  total: number;
}

export interface GetConversationResponse {
  conversation: AIConversation;
  messages: AIMessage[];
}

export interface ListScenariosResponse {
  scenarios: AIScenario[];
}

// --- Explain ---

export interface ExplainMistakeRequest {
  step_id?: string;
  incorrect_answer: string;
  correct_answer?: string;
  question?: string;
  target_language?: string;
  native_language?: string;
}

export interface ExplainMistakeResponse {
  explanation: string;
  cached: boolean;
}

// --- Writing assessment ---

export interface AssessWritingRequest {
  prompt?: string;
  user_text: string;
  target_language?: string;
  user_level?: string;
}

/** Категории фидбэка writing assessment. */
export type WritingFeedbackCategory =
  | 'grammar'
  | 'vocabulary'
  | 'coherence'
  | 'style'
  | string;

export interface AIWritingFeedback {
  category: WritingFeedbackCategory;
  issue: string;
  suggestion: string;
}

export interface AssessWritingResponse {
  assessment_id: string;
  /** 0..100 */
  overall_score: number;
  grammar_score: number;
  vocabulary_score: number;
  coherence_score: number;
  style_score: number;
  corrected_text: string;
  feedback: AIWritingFeedback[];
}

// --- Pronunciation ---

export interface AIWordScore {
  word: string;
  /** 0.0..1.0 */
  score: number;
  feedback?: string;
}

export interface CheckPronunciationResponse {
  attempt_id: string;
  transcribed_text: string;
  /** 0.0..1.0 */
  accuracy_score: number;
  word_scores: AIWordScore[];
  feedback: string;
  audio_url?: string;
}

// --- Tutor ---

export interface AskTutorRequest {
  question: string;
  target_language?: string;
  native_language?: string;
}

export interface AskTutorResponse {
  answer: string;
  tokens_used?: number;
  cost_usd?: number;
}

// --- Quota ---

/** GetQuotaStatusResponse — `*_limit = -1` означает unlimited (premium). */
export interface AIQuotaStatus {
  chat_used: number;
  chat_limit: number;
  voice_minutes_used: number;
  voice_minutes_limit: number;
  writing_used: number;
  writing_limit: number;
  /** "free" | "premium" */
  plan: string;
  resets_at?: string;
}

// =========================================================================
// Onboarding v3 (Oki-style)
// См. docs/tasks/mob/onboarding-v3-oki-style.md.
// Mirror'ит proto.user.v1.OnboardingState + Patch. Все v3-поля nullable.
// =========================================================================

export type ProficiencyLevelProto =
  | 'beginner' | 'a1' | 'a2' | 'b1' | 'b2' | 'just_for_fun';

export type AgeBracket =
  | '7-12' | '13-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55+';

export type DailyCommitMinutes = 5 | 10 | 15 | 25;

export type PainPoint =
  | 'fear_speaking' | 'lack_vocab' | 'listening' | 'grammar' | 'consistency';

export type SpeakingSituation =
  | 'freeze' | 'translate_in_head' | 'too_short' | 'avoid';

export type PastBlocker =
  | 'boring' | 'too_hard' | 'no_progress' | 'no_fit' | 'no_support';

export type FutureRegret =
  | 'stay_same' | 'limit_self' | 'pressure' | 'postpone';

export type EmotionalReaction =
  | 'lose_confidence' | 'upset' | 'burnout' | 'lost';

export type ReminderSlot = 'morning' | 'day' | 'evening' | 'flex';

export type PaywallChoice =
  | 'annual' | 'monthly' | 'dismissed' | 'special_offer';

/**
 * OnboardingStateResponse — DTO ответа gateway (плоский JSON, без wrappers).
 * Бэк возвращает только заполненные поля (null/undefined для пустых).
 */
export interface OnboardingStateResponse {
  user_id: string;
  native_language?: string | null;
  target_language?: string | null;
  proficiency_level?: ProficiencyLevelProto | null;
  daily_goal_xp?: number | null;
  motivation: string[];
  signup_source?: string | null;
  placement_score?: number | null;
  date_of_birth?: string | null; // ISO YYYY-MM-DD
  onboarded_at?: string | null;  // ISO timestamp
  completed: boolean;

  // v3:
  age_bracket?: AgeBracket | null;
  daily_commit_minutes?: DailyCommitMinutes | null;
  pain_point?: PainPoint | null;
  speaking_situation?: SpeakingSituation | null;
  past_blocker?: PastBlocker | null;
  future_regret?: FutureRegret | null;
  emotional_reaction?: EmotionalReaction | null;
  reminder_slot?: ReminderSlot | null;
  paywall_seen_at?: string | null;
  paywall_choice?: PaywallChoice | null;
}

/**
 * PatchOnboardingRequest — partial update. Любое не-undefined поле
 * перезаписывает текущее значение.
 *
 * Motivation: используйте helper `motivationPatch()` из
 * `@/lib/onboarding-patches`. Прямое использование `motivation` /
 * `motivation_set` в product-коде нежелательно — sentinel-флаг
 * `motivation_set` нужен только для отличия "не передавали" от
 * "очистили в []" в protocol-слое.
 */
export interface PatchOnboardingRequest {
  native_language?: string;
  target_language?: string;
  proficiency_level?: ProficiencyLevelProto;
  daily_goal_xp?: number;
  /** Используйте `motivationPatch()` из `lib/onboarding-patches`. */
  motivation?: string[];
  /** Используйте `motivationPatch()` из `lib/onboarding-patches`. */
  motivation_set?: boolean;
  signup_source?: string;
  placement_score?: number;
  date_of_birth?: string;

  // v3:
  age_bracket?: AgeBracket;
  daily_commit_minutes?: DailyCommitMinutes;
  pain_point?: PainPoint;
  speaking_situation?: SpeakingSituation;
  past_blocker?: PastBlocker;
  future_regret?: FutureRegret;
  emotional_reaction?: EmotionalReaction;
  reminder_slot?: ReminderSlot;
  paywall_seen_at?: string; // ISO timestamp
  paywall_choice?: PaywallChoice;
}

/**
 * GuestSessionRequest — bootstrap анонимного юзера.
 * device_id — UUID v4, генерируется клиентом и хранится локально.
 */
export interface GuestSessionRequest {
  device_id: string;
}

export interface GuestSessionResponse {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  /** true если был создан новый user; false если переиспользован (idempotent). */
  created: boolean;
}

/**
 * ClaimGuestRequest — email/password claim для онбординга v2 (web).
 * В mobile v3 используем OAuth (см. ниже).
 */
export interface ClaimGuestRequest {
  email: string;
  password: string;
  username: string;
}

export interface ClaimGuestResponse {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

/**
 * ClaimGuestOAuthRequest — OAuth claim (Google / Apple / guest_fake stub).
 * См. spec §2.4.
 */
export interface ClaimGuestOAuthRequest {
  provider: 'google' | 'apple' | 'guest_fake';
  id_token: string;
  email: string;
  display_name?: string;
}

// ============================================================================
// Phase 7: Word Flashcards
// ============================================================================

export interface Flashcard {
  id: string;
  user_id: string;
  source: 'manual' | 'lesson' | 'mistake' | 'ai_suggestion';
  vocabulary_id?: string;
  word: string;
  translation: string;
  language: string;
  target_language: string;
  definition?: string;
  example_sentence?: string;
  transcription?: string;
  audio_url?: string;
  image_url?: string;
  created_at: string;
  pinned_today?: boolean;
  // SRS projection (optional)
  strength?: number;
  repetitions?: number;
  next_review_at?: string;
}

export interface FlashcardStats {
  today_due: number;
  today_completed: number;
  learning_count: number;
  mastered_count: number;
  total_count: number;
}

export interface ListFlashcardsRequest {
  source?: string;
  pinned_today?: boolean;
  search?: string;
  include_archived?: boolean;
  include_srs?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListFlashcardsResponse {
  items: Flashcard[];
  total: number;
}

export interface CreateFlashcardRequest {
  word: string;
  translation: string;
  language: string;
  target_language: string;
  definition?: string;
  example_sentence?: string;
  transcription?: string;
  audio_url?: string;
  image_url?: string;
}

export interface UpdateFlashcardRequest {
  word?: string;
  translation?: string;
  definition?: string;
  example_sentence?: string;
  transcription?: string;
  audio_url?: string;
  image_url?: string;
}

/** Запрос ревью карточки: бинарная самооценка «помню/забыл». */
export interface FlashcardReviewRequest {
  remembered: boolean;
  response_time_ms?: number;
}

/** Ответ ревью — обновлённый SRS-snapshot (см. SRSReviewResponse). */
export interface FlashcardReviewResponse {
  item: SRSItem;
  history: SRSReviewHistory;
}

export interface BulkCreateFlashcardsRequest {
  items: Array<{
    word: string;
    translation: string;
    language: string;
    target_language: string;
    definition?: string;
    example_sentence?: string;
    source?: string;
    vocabulary_id?: string;
  }>;
}

export interface BulkCreateFlashcardsResponse {
  created: number;
  skipped: number;
  items: Flashcard[];
}

export interface PinForTodayRequest {
  queued_for_date?: string; // YYYY-MM-DD
}

export interface ListTodayQueueResponse {
  items: Flashcard[];
  queued_for_date: string;
}

export interface FlashcardSuggestion {
  word: string;
  translation: string;
  definition?: string;
  example_sentence?: string;
  reason?: string;
  vocabulary_id?: string;
}

export interface SuggestFlashcardsRequest {
  level?: string;
  goal?: string;
  pain_point?: string;
  target_language?: string;
  native_language?: string;
  count?: number;
  exclude_words?: string[];
}

export interface SuggestFlashcardsResponse {
  items: FlashcardSuggestion[];
  exhausted: boolean;
}
