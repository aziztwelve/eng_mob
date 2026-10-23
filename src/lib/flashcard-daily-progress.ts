import type { FlashcardStats } from '@/types/api';

/** Legacy today_due counts the whole selection, including cards reviewed today. */
export function flashcardDailyProgress(stats?: FlashcardStats) {
  const completed = Math.max(0, stats?.today_completed ?? 0);
  const selected = Math.max(0, stats?.today_due ?? 0);
  // An older server cannot tell us the overlap. Do not invent a denominator.
  const remaining = typeof stats?.today_remaining === 'number'
    ? Math.max(0, stats.today_remaining) : null;
  return { completed, selected, remaining, goal: remaining === null ? null : completed + remaining };
}
