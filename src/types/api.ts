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

export type StepType = 'video' | 'text' | 'quiz' | 'task' | 'brain_game' | 'ai_writing';

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
