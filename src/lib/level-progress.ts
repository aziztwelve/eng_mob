/** v1 next_level_xp is XP remaining, not a cumulative level threshold. */
export function levelProgress(stats: { level: number; total_xp: number; next_level_xp: number }) {
  const level = Math.max(1, stats.level || 1);
  const threshold = (100 * level * (level - 1)) / 2;
  const into = Math.max(0, stats.total_xp - threshold);
  const span = Math.max(1, into + Math.max(0, stats.next_level_xp));
  return { into, span, percent: Math.min(100, Math.round((into / span) * 100)) };
}
