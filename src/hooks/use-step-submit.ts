import { useMutation } from '@tanstack/react-query';

import { StepValidationApi } from '@/lib/api-client';
import type { SubmitAnswerRequest, SubmitAnswerResponse } from '@/types/api';

/**
 * Phase 2: отправляет ответ на интерактивный шаг
 * (POST /api/v1/steps/:stepId/submit → step-validation-service).
 *
 * Backend сам делает gamification side-effects (AddXP / LoseHeart) +
 * MarkStepComplete. Mobile UI триггерит локальные оверлеи XPGain /
 * AchievementModal / LevelUp на основе `response.gamification`.
 */
export function useStepSubmit() {
  return useMutation<
    SubmitAnswerResponse,
    Error,
    { stepId: string; body: SubmitAnswerRequest }
  >({
    mutationFn: ({ stepId, body }) => StepValidationApi.submit(stepId, body),
  });
}
