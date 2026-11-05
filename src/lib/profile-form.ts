import type { AccountProfile } from '@/types/api';
export type ProfileDraft = { name: string; gender: string; birthday: string; timezone: string };
export function profileDraft(profile: AccountProfile, fallbackName: string): ProfileDraft {
  return { name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || fallbackName,
    gender: profile.gender ?? '', birthday: profile.date_of_birth ?? '', timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' };
}
export function validateProfileDraft(draft: ProfileDraft, now = new Date()): 'name' | 'birthday' | 'timezone' | null {
  if (!draft.name.trim() || Array.from(draft.name.trim()).length > 100) return 'name';
  if (draft.birthday) {
    const date = new Date(`${draft.birthday}T00:00:00Z`);
    const min = new Date(now); min.setUTCFullYear(min.getUTCFullYear() - 120);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.birthday) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== draft.birthday || date > now || date < min) return 'birthday';
  }
  try { if (!draft.timezone.trim()) return 'timezone'; new Intl.DateTimeFormat('en', { timeZone: draft.timezone.trim() }).format(now); }
  catch { return 'timezone'; }
  return null;
}
export function profilePayload(draft: ProfileDraft): Partial<AccountProfile> {
  return { first_name: draft.name.trim(), last_name: '', gender: draft.gender as AccountProfile['gender'], date_of_birth: draft.birthday, timezone: draft.timezone.trim() };
}
