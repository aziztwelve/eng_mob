import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';

import { analytics } from '@/lib/analytics';
import { usePatchOnboardingV3, useOnboardingState } from './use-onboarding';
import type { OnboardingState } from '@/lib/onboarding-storage';
import type { PatchOnboardingRequest } from '@/types/api';

/**
 * Тип `Href` для expo-router — переиспользуем сигнатуру `router.push`,
 * чтобы поддерживать и строковые маршруты ('/onboarding/level'), и
 * объектные с params ({pathname, params: {...}}).
 */
type Href = Parameters<typeof router.push>[0];

interface UseOnboardingStepOptions<T> {
  /** Идентификатор шага (для analytics + `current_step`). */
  step: string;
  /**
   * Куда переходить после успеха. Может быть строкой, объектом или
   * функцией от value (нужно для шагов, прокидывающих value в reaction).
   */
  next: Href | ((value: T) => Href);
  /** Преобразование выбранного значения в backend-patch. */
  buildPatch: (value: T) => PatchOnboardingRequest;
  /** Опциональный начальный value (по умолчанию null). */
  initialValue?: T | null;
  /**
   * Если true (по умолчанию), `handleContinue` требует value !== null.
   * Установить false, если шаг не имеет value-выбора (placeholder).
   */
  requireValue?: boolean;
  /**
   * Селектор для hydration value из глобального onboarding state.
   *
   * Когда юзер возвращается назад gesture-back'ом или после рестарта
   * приложения — селектор подсасывает ранее сохранённое значение
   * (см. `useOnboardingState` — backend как SoT). Hydration происходит
   * единожды при первом success'е query'а; пользовательский ввод после
   * этого не перетирается.
   */
  loadValue?: (state: OnboardingState) => T | null | undefined;
}

interface UseOnboardingStepResult<T> {
  value: T | null;
  setValue: (v: T | null) => void;
  submitting: boolean;
  /** `!submitting && (value !== null || !requireValue)` */
  canContinue: boolean;
  /** Validate → patch → analytics → router.push(next). */
  handleContinue: () => Promise<void>;
}

/**
 * useOnboardingStep — единый хук для типового шага онбординга.
 *
 * Раньше каждый из 10+ экранов (age, goal, daily-commit, level,
 * pain-points, ...) копипастил один и тот же boilerplate:
 *
 *   const [value, setValue] = useState(null);
 *   const [submitting, setSubmitting] = useState(false);
 *   const patch = usePatchOnboardingV3();
 *   async function handleContinue() {
 *     if (!value || submitting) return;
 *     setSubmitting(true);
 *     try {
 *       await patch.mutateAsync({...});
 *       router.push(...);
 *     } finally { setSubmitting(false); }
 *   }
 *
 * Теперь:
 *
 *   const { value, setValue, submitting, canContinue, handleContinue } =
 *     useOnboardingStep<AgeBracket>({
 *       step: 'age',
 *       next: '/onboarding/level',
 *       buildPatch: (v) => ({ age_bracket: v }),
 *     });
 *
 * Бонусом — единообразный analytics-event `onboarding_step_completed`
 * (раньше его не было на части шагов).
 *
 * Шаги с нестандартным flow (placement-test, paywall, signup,
 * notifications) хук НЕ используют — у них собственная логика.
 */
export function useOnboardingStep<T>({
  step,
  next,
  buildPatch,
  initialValue = null,
  requireValue = true,
  loadValue,
}: UseOnboardingStepOptions<T>): UseOnboardingStepResult<T> {
  const [value, setValue] = useState<T | null>(initialValue);
  const [submitting, setSubmitting] = useState(false);
  const patch = usePatchOnboardingV3();

  // Hydration из глобального state — для случая gesture-back или
  // рестарта app: подсасываем ранее сохранённое значение.
  // useOnboardingState вызываем безусловно (rules-of-hooks), но
  // используем результат только если caller дал loadValue.
  const { data: stateData } = useOnboardingState();
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    if (!loadValue || !stateData) return;
    const fromState = loadValue(stateData);
    hydratedRef.current = true;
    if (fromState != null && value == null) {
      setValue(fromState as T);
    }
  }, [stateData, loadValue, value]);

  const handleContinue = useCallback(async () => {
    if (submitting) return;
    if (requireValue && value == null) return;

    setSubmitting(true);
    try {
      await patch.mutateAsync({
        patch: buildPatch(value as T),
        localExtra: { current_step: step },
      });
      analytics.track('onboarding_step_completed', { step_key: step });
      const target = typeof next === 'function' ? next(value as T) : next;
      router.push(target);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, value, requireValue, patch, buildPatch, step, next]);

  const canContinue = !submitting && (!requireValue || value != null);

  return { value, setValue, submitting, canContinue, handleContinue };
}
