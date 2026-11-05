import type { UpdatePreferencesRequest, UserPreferences } from '@/types/api';
/** Proto JSON omits false and zero; zero is a valid hour, not a missing preference. */
export function notificationPreferences(p: Partial<UserPreferences>, fallbackTimezone: string): UpdatePreferencesRequest {
 return {
  practice_reminder_enabled: !!p.practice_reminder_enabled,
  streak_risk_enabled: !!p.streak_risk_enabled,
  daily_goal_enabled: !!p.daily_goal_enabled,
  achievement_enabled: !!p.achievement_enabled,
  friend_request_enabled: !!p.friend_request_enabled,
  quiet_hours_start: p.quiet_hours_start ?? 0,
  quiet_hours_end: p.quiet_hours_end ?? 0,
  timezone: p.timezone || fallbackTimezone,
 };
}
