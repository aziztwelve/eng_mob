import type { TalkPhase } from '@/hooks/use-free-talk';

export type AvatarExpression = 'neutral' | 'happy' | 'thinking';

/** Simple local cues, not a model-provided emotion classification. */
export function avatarExpression(text: string, phase: TalkPhase): AvatarExpression {
  if (phase === 'thinking') return 'thinking';
  if (/\b(great|wonderful|excellent|well done|good job|congratulations|fantastic|amazing)\b/i.test(text)) return 'happy';
  if (text.includes('?')) return 'thinking';
  return 'neutral';
}
