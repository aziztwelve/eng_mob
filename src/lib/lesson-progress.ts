/**
 * Локальный трекинг завершённых уроков (on-device).
 *
 * Используется для последовательной разблокировки уроков в треке (lock-иконка
 * + пошаговое открытие). Завершение урока фиксируется при прохождении
 * последнего шага в плеере (`src/app/learn/[lessonId].tsx`).
 *
 * Прогресс отдельных шагов всё равно пишется на backend (gamification /
 * analytics); этот стор — быстрый персистентный источник для UI-замков,
 * чтобы не делать N запросов `/progress/lessons/:id` на экране трека.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const STORAGE_KEY = 'lesson_completed_v1';
const QUERY_KEY = ['completedLessons'];

/** Прочитать множество id завершённых уроков. */
export async function getCompletedLessons(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

/** Отметить урок завершённым (idempotent). */
export async function markLessonCompleted(lessonId: string): Promise<void> {
  if (!lessonId) return;
  try {
    const set = await getCompletedLessons();
    if (set.has(lessonId)) return;
    set.add(lessonId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* best-effort */
  }
}

/** Реактивный список завершённых уроков (React Query поверх AsyncStorage). */
export function useCompletedLessons() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getCompletedLessons,
    staleTime: 0,
  });
}

/**
 * Хук-маркер: отметить урок завершённым + инвалидировать кэш, чтобы экран
 * трека сразу пересчитал замки.
 */
export function useMarkLessonCompleted() {
  const qc = useQueryClient();
  return async (lessonId: string) => {
    await markLessonCompleted(lessonId);
    await qc.invalidateQueries({ queryKey: QUERY_KEY });
  };
}
