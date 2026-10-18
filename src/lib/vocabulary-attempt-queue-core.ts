export type PendingVocabularyAttempt = {
  id: string;
  externalId: string;
  step: number;
  answer: Record<string, unknown>;
  timeSpentMs: number;
};

type Store = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> };

/** One durable FIFO per account. Only an acknowledged attempt is removed. */
export function createVocabularyAttemptQueue<T>(storage: Store, send: (item: PendingVocabularyAttempt) => Promise<T>) {
  let writes: Promise<unknown> = Promise.resolve();
  const flushing = new Map<string, Promise<void>>();
  const listeners = new Set<(userId: string, item: PendingVocabularyAttempt, result: T) => void>();
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
          const item = (await exclusive(() => read(userId)))[0];
          if (!item) return;
          const result = await send(item); // A failure leaves this and later attempts durable.
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
