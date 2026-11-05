import { useCallback, useEffect, useRef, useState } from 'react';
import { AIApi } from '@/lib/ai-api';

type Session = { allowed: boolean; unlimited: boolean; expiresAt: number; resetsAt: number };
export function useFreeTalkSession(conversationId: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [now, setNow] = useState(Date.now());
  const [starting, setStarting] = useState(false);
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);
  useEffect(() => { setSession(null); setFailed(false); }, [conversationId]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const start = useCallback(async () => {
    if (!conversationId || inFlight.current) return;
    inFlight.current = true;
    setStarting(true); setFailed(false);
    try {
      const result = await AIApi.reserveFreeTalk(conversationId);
      const localNow = Date.now();
      const serverNow = Number(result.server_now_ms);
      const remaining = Number(result.expires_at_ms) - serverNow;
      if (!Number.isFinite(serverNow) || (!result.unlimited && !Number.isFinite(remaining))) throw new Error('Invalid session response');
      setNow(localNow);
      setSession({ allowed: result.allowed, unlimited: result.unlimited, expiresAt: localNow + remaining, resetsAt: Number(result.resets_at_ms) });
    } catch { setFailed(true); }
    finally { inFlight.current = false; setStarting(false); }
  }, [conversationId]);
  const remaining = session?.unlimited ? null : Math.max(0, Math.ceil(((session?.expiresAt ?? 0) - now) / 1000));
  const active = !!session?.allowed && (session.unlimited || (remaining !== null && remaining > 0));
  return { active, remaining, started: session !== null, starting, failed, start };
}
