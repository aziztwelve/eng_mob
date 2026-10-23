import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from './auth-service';
import { FlashcardsApi } from './api-client';
import { newVocabularyAttemptId } from './vocabulary-attempt-queue';
import { queryClient } from './query-client';
import type { FlashcardReviewRequest } from '@/types/api';

type Intent = { flashcardId: string; data: FlashcardReviewRequest };
let writes: Promise<unknown> = Promise.resolve();
const running = new Map<string, Promise<unknown>>();
const key = (owner: string) => `flashcard-reviews:v1:${owner}`;
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const task = writes.then(fn); writes = task.catch(() => undefined); return task;
}
async function read(owner: string): Promise<Intent[]> {
  return JSON.parse(await AsyncStorage.getItem(key(owner)) ?? '[]');
}
async function send(owner: string, intent: Intent) {
  const id = `${owner}:${intent.data.attempt_id}`;
  const existing = running.get(id);
  if (existing) return existing;
  const task = (async () => {
    if (await AuthService.getSessionUserID() !== owner) throw new Error('Account changed');
    const response = await FlashcardsApi.review(intent.flashcardId, intent.data);
    await exclusive(async () => {
      const pending = await read(owner);
      await AsyncStorage.setItem(key(owner), JSON.stringify(pending.filter(item => item.data.attempt_id !== intent.data.attempt_id)));
    });
    void queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    return response;
  })().finally(() => running.delete(id));
  running.set(id, task); return task;
}
export async function saveFlashcardReview(flashcardId: string, data: FlashcardReviewRequest) {
  const owner = await AuthService.getSessionUserID();
  if (!owner) throw new Error('Sign in to save your review');
  const intent = { flashcardId, data: { ...data, attempt_id: data.attempt_id ?? newVocabularyAttemptId() } };
  await exclusive(async () => {
    const pending = await read(owner);
    if (!pending.some(item => item.data.attempt_id === intent.data.attempt_id)) {
      await AsyncStorage.setItem(key(owner), JSON.stringify([...pending, intent]));
    }
  });
  return send(owner, intent);
}
export async function drainFlashcardReviews() {
  const owner = await AuthService.getSessionUserID();
  if (!owner) return;
  const pending = await exclusive(() => read(owner));
  for (const intent of pending) {
    if (await AuthService.getSessionUserID() !== owner) return;
    await send(owner, intent);
  }
}
