import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PatchOnboardingRequest } from '@/types/api';

/**
 * Persistent FIFO-очередь для offline-PATCH'ей онбординга.
 *
 * Зачем: если юзер прошёл шаг 5 без сети и закрыл приложение, патч
 * остаётся в локальном AsyncStorage онбординга, но в БД его нет.
 * Очередь хранит pending patch'и в отдельном ключе и при следующем
 * online-моменте дренирует их на backend.
 *
 * Дизайн:
 *   - FIFO порядок (важен для атомарности per-step событий, например
 *     paywall_seen_at до paywall_choice).
 *   - При новом enqueue стараемся **смерджить** patch с последним в
 *     очереди, если их можно безопасно объединить (см. canMergeIntoLast).
 *     Это предотвращает рост очереди до сотен записей при долгом offline.
 *   - Поля last-write-wins при мердже: новый перезаписывает старый.
 *   - Лимит размера очереди: 50 — после этого старейшие drop'аются с
 *     warning'ом (сценарий «сломанный backend на год» нас не интересует).
 *
 * Item — НЕ хранит auth-токены или PII. Только сами PATCH-поля,
 * созданные временной меткой и attempt-счётчиком. Безопасно лежать в
 * AsyncStorage без шифрования.
 */

const QUEUE_KEY = 'onboarding_patch_queue_v1';
const MAX_QUEUE_SIZE = 50;
const MAX_ATTEMPTS_BEFORE_DROP = 10;

export interface QueuedPatch {
  id: string;
  patch: PatchOnboardingRequest;
  createdAt: number;
  attempts: number;
}

function uid(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function readQueue(): Promise<QueuedPatch[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as QueuedPatch[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(items: QueuedPatch[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

/**
 * canMergeIntoLast — можно ли смерджить новый patch в последний
 * элемент очереди. Mergeable если поля не пересекаются ИЛИ пересечения
 * допустимы по last-write-wins без потери семантики.
 *
 * Сейчас разрешаем merge всегда: backend применяет patch как partial-
 * update, и если юзер дважды поменял `daily_commit_minutes` на оффлайне,
 * нам нужно отправить только финальное значение.
 *
 * Edge-case: `motivation` + `motivation_set` — оставляем последний
 * вариант целиком (не merge'им внутри массива).
 */
function mergePatches(
  base: PatchOnboardingRequest,
  next: PatchOnboardingRequest,
): PatchOnboardingRequest {
  return { ...base, ...next };
}

export const onboardingMutationQueue = {
  /**
   * Добавляет patch в очередь. Если последний элемент ещё не отправлен,
   * мерджит в него (чтобы очередь не разрасталась).
   */
  async enqueue(patch: PatchOnboardingRequest): Promise<void> {
    const items = await readQueue();

    if (items.length > 0) {
      // Merge into the most recent item (FIFO tail).
      const last = items[items.length - 1];
      if (last.attempts === 0) {
        last.patch = mergePatches(last.patch, patch);
        await writeQueue(items);
        return;
      }
    }

    items.push({
      id: uid(),
      patch,
      createdAt: Date.now(),
      attempts: 0,
    });

    // Hard cap — drop oldest.
    while (items.length > MAX_QUEUE_SIZE) {
      const dropped = items.shift();
      if (__DEV__ && dropped) {
        console.warn('[onboarding-queue] dropping oldest patch', dropped.id);
      }
    }

    await writeQueue(items);
  },

  async size(): Promise<number> {
    return (await readQueue()).length;
  },

  async getAll(): Promise<QueuedPatch[]> {
    return readQueue();
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  },

  /**
   * Дренирует очередь — последовательно вызывает processor для каждого
   * patch'а. Успешные удаляются; неуспешные остаются с инкрементом
   * `attempts`. Останавливается на первой ошибке (FIFO consistency).
   *
   * Возвращает кол-во успешно обработанных patch'ей.
   */
  async drain(
    processor: (patch: PatchOnboardingRequest) => Promise<void>,
  ): Promise<{ ok: number; remaining: number; lastError?: string }> {
    const items = await readQueue();
    let ok = 0;
    let lastError: string | undefined;

    while (items.length > 0) {
      const head = items[0];
      try {
        await processor(head.patch);
        items.shift();
        ok += 1;
      } catch (err) {
        head.attempts += 1;
        lastError = err instanceof Error ? err.message : String(err);
        if (head.attempts >= MAX_ATTEMPTS_BEFORE_DROP) {
          if (__DEV__) {
            console.warn(
              '[onboarding-queue] dropping after max attempts',
              head.id,
              lastError,
            );
          }
          items.shift();
        }
        break;
      }
    }

    await writeQueue(items);
    return { ok, remaining: items.length, lastError };
  },
};
