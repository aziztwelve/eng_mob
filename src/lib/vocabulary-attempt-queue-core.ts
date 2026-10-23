export type PendingVocabularyAttempt = {
  id: string;
  externalId: string;
  step: number;
  answer: Record<string, unknown>;
  timeSpentMs: number;
  failure?: { statusCode: number; message: string };
};

type Store = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> };

/** One durable FIFO per account. Only an acknowledged attempt is removed. */
export function createVocabularyAttemptQueue<T>(storage: Store, send: (item: PendingVocabularyAttempt) => Promise<T>) {
  let writes: Promise<unknown> = Promise.resolve();
  const flushing = new Map<string, Promise<void>>();
  const listeners = new Set<(userId: string, item: PendingVocabularyAttempt, result: T) => void>();
  const failures = new Set<(userId: string, item: PendingVocabularyAttempt) => void>();
  const key = (userId: string) => `vocabulary-attempts:v2:${userId}`;
  const read = async (userId: string): Promise<PendingVocabularyAttempt[]> => JSON.parse(await storage.getItem(key(userId)) ?? '[]');
  function exclusive<R>(action: () => Promise<R>): Promise<R> {
    const result = writes.then(action);
    writes = result.catch(() => undefined);
    return result;
  }
  return {
    subscribe(listener: (userId: string, item: PendingVocabularyAttempt, result: T) => void) {
      listeners.add(listener); return () => { listeners.delete(listener); };
    },
    subscribeFailures(listener: (userId: string, item: PendingVocabularyAttempt) => void) {
      failures.add(listener); return () => { failures.delete(listener); };
    },
    discardWord(userId: string, externalId: string) {
      return exclusive(async () => {
        const items = await read(userId);
        await storage.setItem(key(userId), JSON.stringify(items.filter(item => item.externalId !== externalId)));
      });
    },
    pending(userId: string) { return exclusive(() => read(userId)); },
    enqueue(userId: string, item: PendingVocabularyAttempt) {
      return exclusive(async () => {
        const items = await read(userId);
        if (!items.some((entry) => entry.id === item.id)) {
          await storage.setItem(key(userId), JSON.stringify([...items, { ...item, answer: { ...item.answer, session_user_id: userId } }]));
        }
      });
    },
    flush(userId: string, isCurrentUser: () => Promise<boolean>) {
      const active = flushing.get(userId);
      if (active) return active;
      const run = (async () => {
        while (await isCurrentUser()) {
          const items = await exclusive(() => read(userId));
          const blocked = new Set(items.filter(item => item.failure).map(item => item.externalId));
          const item = items.find(item => !blocked.has(item.externalId));
          if (!item) return;
          let result: T;
          try { result = await send(item); }
          catch (error) {
            const api = error as { statusCode?: number; message?: string };
            if (![400, 404, 409, 422].includes(api.statusCode ?? 0)) {
              for (const listener of failures) listener(userId, item);
              throw error;
            }
            const failed = { ...item, failure: { statusCode: api.statusCode!, message: api.message ?? 'Answer rejected' } };
            await exclusive(async () => {
              const current = await read(userId);
              await storage.setItem(key(userId), JSON.stringify(current.map(value => value.id === item.id ? failed : value)));
            });
            for (const listener of failures) listener(userId, failed);
            continue; // Other words must still synchronize; keep the rejected answer for recovery.
          }
          await exclusive(async () => {
            const items = await read(userId);
            await storage.setItem(key(userId), JSON.stringify(items.filter((entry) => entry.id !== item.id)));
          });
          for (const listener of listeners) listener(userId, item, result);
        }
      })().finally(() => { flushing.delete(userId); });
      flushing.set(userId, run); return run;
    },
  };
}
