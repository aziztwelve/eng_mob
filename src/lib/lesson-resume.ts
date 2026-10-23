import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from './auth-service';
import type { LessonProgressResponse } from '@/types/api';

const key = (owner: string, lessonId: string) => `lesson-position:v1:${owner}:${lessonId}`;

export async function readLessonPosition(owner: string, lessonId: string): Promise<string | null> {
  try { return await AsyncStorage.getItem(key(owner, lessonId)); }
  catch { return null; }
}

export async function saveLessonPosition(owner: string, lessonId: string, stepId: string | null) {
  if (!owner || await AuthService.getSessionUserID() !== owner) return;
  if (stepId) await AsyncStorage.setItem(key(owner, lessonId), stepId);
  else await AsyncStorage.removeItem(key(owner, lessonId));
}

/** Resume by stable step IDs; reordered/new content must never skip an incomplete step. */
export function resolveLessonPosition(
  steps: { id: string }[], progress: LessonProgressResponse | null, checkpoint: string | null, restart = false,
): number {
  if (restart || !steps.length) return 0;
  const completed = new Set((progress?.step_progresses ?? []).filter(p => p.completed).map(p => p.step_id));
  const firstIncomplete = steps.findIndex(step => !completed.has(step.id));
  // A completed lesson opens as a new replay, not on its final feedback screen.
  if (firstIncomplete === -1) return 0;
  const savedIndex = steps.findIndex(step => step.id === checkpoint);
  return savedIndex >= 0 && savedIndex <= firstIncomplete ? savedIndex : firstIncomplete;
}
