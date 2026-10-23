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
import { useCurrentUser } from '@/hooks/use-auth';
import { AuthService } from './auth-service';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// The unowned v1 key is intentionally not migrated: its account is unknown.
const storageKey = (userId: string) => `lesson_completed_v2:${userId}`;
const QUERY_KEY = ['completedLessons'];

/** Прочитать множество id завершённых уроков. */
export async function getCompletedLessons(userId: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr.filter((id) => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

/** Отметить урок завершённым (idempotent). */
export async function markLessonCompleted(lessonId: string, userId: string): Promise<void> {
  if (!lessonId || !userId || await AuthService.getSessionUserID() !== userId) return;
  try {
    const set = await getCompletedLessons(userId);
    if (set.has(lessonId)) return;
    set.add(lessonId);
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify([...set]));
  } catch {
    /* best-effort */
  }
}

/** Реактивный список завершённых уроков (React Query поверх AsyncStorage). */
export function useCompletedLessons() {
  const { data: user } = useCurrentUser();
  return useQuery({
    queryKey: [...QUERY_KEY, user?.id],
    queryFn: () => getCompletedLessons(user!.id),
    enabled: !!user?.id,
    staleTime: 0,
  });
}

/**
 * Хук-маркер: отметить урок завершённым + инвалидировать кэш, чтобы экран
 * трека сразу пересчитал замки.
 */
export function useMarkLessonCompleted() {
  const qc = useQueryClient();
  const { data: user } = useCurrentUser();
  return async (lessonId: string) => {
    if (!user?.id) return;
    await markLessonCompleted(lessonId, user.id);
    await qc.invalidateQueries({ queryKey: ['trackProgress'] });
    await qc.invalidateQueries({ queryKey: QUERY_KEY });
  };
}
