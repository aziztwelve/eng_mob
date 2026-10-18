/** Development-only timings; never log tokens, profile data, or API payloads. */
export function markStartup(stage: string) {
  if (!__DEV__) return;
  const started = (globalThis as { __lingoiqStartupAt?: number }).__lingoiqStartupAt;
  console.info('[startup]', stage, started ? `${Date.now() - started}ms` : '');
}
