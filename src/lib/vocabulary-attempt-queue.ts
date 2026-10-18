import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryClient } from './query-client';
import { AuthService } from './auth-service';
import { VocabularyBankApi } from './api-client';
import { createVocabularyAttemptQueue } from './vocabulary-attempt-queue-core';

export const vocabularyAttemptQueue = createVocabularyAttemptQueue(AsyncStorage, async (item) => {
  const response = await VocabularyBankApi.recordAttempt(item.externalId, item.step, {
    answer: { ...item.answer, validation_version: 2, attempt_id: item.id },
    is_correct: false, time_spent_ms: item.timeSpentMs,
  });
  // An older backend must not silently acknowledge an unchecked answer.
  if (!['checked', 'practice'].includes(response.assessment_mode ?? '')) throw new Error('Vocabulary validation backend is not ready');
  void queryClient.invalidateQueries({ queryKey: ['vocabulary-bank'] });
  return response;
});

export async function vocabularyQueueUserId(): Promise<string | null> {
  return AuthService.getSessionUserID();
}
export async function drainVocabularyAttempts() {
  const userId = await vocabularyQueueUserId();
  if (!userId) return;
  await vocabularyAttemptQueue.flush(userId, async () => (await vocabularyQueueUserId()) === userId && await AuthService.isAuthenticated());
}
export const newVocabularyAttemptId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.floor(Math.random() * 16); return (c === 'x' ? r : (r & 3) | 8).toString(16); });
