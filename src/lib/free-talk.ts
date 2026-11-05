/** Do not speak the incomplete final sentence of an SSE chunk. */
export function splitSpokenSentences(buffer: string, flush: boolean): { sentences: string[]; rest: string } {
  const sentences: string[] = [];
  let rest = buffer;
  const ending = /^([\s\S]+?[.!?…]+["')\]”’]*)(\s+|$)/;
  for (;;) {
    const match = ending.exec(rest);
    if (!match || (!flush && match[2] === '')) break;
    if (match[1].trim()) sentences.push(match[1].trim());
    rest = rest.slice(match[0].length);
  }
  if (flush && rest.trim()) { sentences.push(rest.trim()); rest = ''; }
  return { sentences, rest };
}

export function talkDuration(seconds: number): string {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`;
}

/** Suggestions are drafts. Choosing one never sends a message. */
export const TALK_STARTERS = [
  'I’d like to talk about my day.',
  'Let’s talk about a place I’d love to visit.',
  'Can we talk about my hobbies?',
  'Help me practise introducing myself.',
] as const;

/** Stay below the TTS endpoint limit without dropping a long answer's tail. */
export function speechChunks(text: string, limit = 450): string[] {
  const chunks: string[] = [];
  let rest = text.trim();
  while (rest.length > limit) {
    const space = rest.lastIndexOf(' ', limit);
    const end = space > limit / 2 ? space : limit;
    chunks.push(rest.slice(0, end));
    rest = rest.slice(end).trimStart();
  }
  if (rest) chunks.push(rest);
  return chunks;
}
