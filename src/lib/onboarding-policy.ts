/** Retired answers are discarded on read as well as write, including offline queues. */
export const RETIRED_ONBOARDING_FIELDS = [
  'daily_commit_minutes', 'pain_point', 'speaking_situation', 'past_blocker',
  'future_regret', 'emotional_reaction', 'paywall_seen_at', 'paywall_choice',
  'placement_score', 'notifications_prompted',
] as const;

export function cleanOnboardingPatch<T extends object>(value: T): T {
  const clean = { ...value };
  for (const key of RETIRED_ONBOARDING_FIELDS) delete (clean as Record<string, unknown>)[key];
  return clean;
}

export function retainedOnboardingStep(step: string | null | undefined): string | null {
  if (!step) return null;
  if (['welcome', 'goal', 'age', 'level', 'reminder_slot', 'signup', 'add_language_done'].includes(step)) return step;
  if (step === 'placement-test' || step === 'placement_test') return 'level';
  if (step === 'daily-commit' || step === 'daily_commit' || step === 'projection') return 'reminder_slot';
  return 'signup';
}
