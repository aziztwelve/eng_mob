/** A completed lesson stays replayable; only the first unfinished lesson unlocks. */
export function buildHomePath<T extends { id: string; order_index: number }>(lessons: T[], completed: ReadonlySet<string>, trackLocked = false) {
  const ordered = [...lessons].sort((a, b) => a.order_index - b.order_index);
  const current = ordered.findIndex(lesson => !completed.has(lesson.id));
  return ordered.map((lesson, index) => ({
    ...lesson,
    state: completed.has(lesson.id) ? 'done' as const : !trackLocked && index === current ? 'current' as const : 'locked' as const,
  }));
}
