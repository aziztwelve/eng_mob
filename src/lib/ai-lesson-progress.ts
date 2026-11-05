import AsyncStorage from '@react-native-async-storage/async-storage';
import { AI_TOPICS, type AILevel } from '@/lib/ai-topics';

type Progress = Record<string, number>;
const storageKey = (userId: string) => `ai_lesson_progress_v1:${userId}`;
export const lessonKey = (level: string, topic: string, index: number) => `${level}/${topic}/${index}`;

export async function loadLessonProgress(userId: string): Promise<Progress> {
  if (!userId) return {};
  const raw = await AsyncStorage.getItem(storageKey(userId));
  if (!raw) return {};
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid lesson progress');
  return Object.fromEntries(Object.entries(value).filter(([, time]) => typeof time === 'number' && Number.isFinite(time)));
}

export async function completeLesson(userId: string, level: AILevel, topic: string, index: number): Promise<void> {
  if (!userId) throw new Error('Account required');
  const progress = await loadLessonProgress(userId);
  progress[lessonKey(level, topic, index)] = Date.now();
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(progress));
}

export function levelProgress(level: AILevel, progress: Progress) {
  const lessons = AI_TOPICS[level].flatMap(topic => topic.lessons.map((name, index) => ({ topic, index, name, key: lessonKey(level, topic.id, index) })));
  const completed = lessons.filter(lesson => progress[lesson.key]);
  const last = completed.reduce<typeof lessons[number] | null>((result, lesson) => !result || progress[lesson.key] > progress[result.key] ? lesson : result, null);
  return { count: completed.length, total: lessons.length, last, next: lessons.find(lesson => !progress[lesson.key]) };
}
