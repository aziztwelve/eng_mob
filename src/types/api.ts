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
