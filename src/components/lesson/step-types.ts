import type { Step, SubmitAnswerResponse } from '@/types/api';

/**
 * Общий контракт всех phase-2 step-компонентов на mobile.
 * Аналогичен web (eng_next2/src/components/lesson/types.ts).
 */
export interface StepComponentProps {
  step: Step;
  /** Отправить ответ — возвращает ответ бэка для feedback. */
  onSubmit: (answer: Record<string, unknown>) => Promise<SubmitAnswerResponse>;
  /** Колбэк "Дальше" — родитель переключает индекс. */
  onContinue: () => void;
  isLast?: boolean;
}

export function parseStepContent<T>(step: Step): T | null {
  try {
    return JSON.parse(step.content) as T;
  } catch {
    return null;
  }
}
