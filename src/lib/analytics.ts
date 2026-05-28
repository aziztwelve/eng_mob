/**
 * analytics — лёгкая no-op обёртка для analytics-событий.
 *
 * Sprint 6: пока без реального backend'а. Все вызовы → `console.debug`,
 * сохраняются последние N событий в памяти (для smoke-теста). В будущем
 * (Phase 6+) подключим PostHog / Mixpanel / Amplitude — нужно будет
 * заменить тело `track` / `identify` и подложить нужный SDK.
 *
 * События — typed-литералы (см. `AnalyticsEvent`) чтобы не плодить
 * опечатки. Свойства — свободный JSON-словарь.
 *
 * Контракт:
 *   analytics.track('paywall_seen', { goal: 'work' });
 *   analytics.identify(userID, { is_guest: true });
 *   analytics.reset();
 */

export type AnalyticsEvent =
  // Onboarding lifecycle
  | 'onboarding_started'
  | 'onboarding_step_viewed'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'onboarding_resumed'
  // Paywall
  | 'paywall_seen'
  | 'paywall_chosen'
  | 'paywall_dismissed'
  // Auth / claim
  | 'signup_screen_viewed'
  | 'oauth_attempted'
  | 'oauth_succeeded'
  | 'oauth_failed'
  | 'claim_skipped'
  // Placement
  | 'placement_started'
  | 'placement_completed'
  // Add-language (post-MVP)
  | 'add_language_clicked';

export interface AnalyticsProps {
  [key: string]: string | number | boolean | null | undefined;
}

interface QueueEntry {
  event: AnalyticsEvent | string;
  props?: AnalyticsProps;
  at: number;
}

const MAX_QUEUE = 200;
const queue: QueueEntry[] = [];

let currentUserID: string | null = null;
let currentTraits: AnalyticsProps = {};

function enqueue(entry: QueueEntry) {
  queue.push(entry);
  if (queue.length > MAX_QUEUE) queue.shift();
}

export const analytics = {
  /** Записать событие. В dev — `console.debug`; в prod — no-op (пока). */
  track(event: AnalyticsEvent | string, props?: AnalyticsProps) {
    const enriched: AnalyticsProps = {
      ...(currentTraits ?? {}),
      ...(props ?? {}),
      user_id: currentUserID ?? undefined,
    };
    enqueue({ event, props: enriched, at: Date.now() });
    if (__DEV__) {
      console.debug('[analytics]', event, enriched);
    }
  },

  /** Назначить юзера + (опц.) свойства, прикладываемые ко всем track. */
  identify(userID: string | null, traits?: AnalyticsProps) {
    currentUserID = userID;
    currentTraits = traits ?? {};
    if (__DEV__) {
      console.debug('[analytics] identify', userID, traits);
    }
  },

  /** Очистить идентификацию (например, при logout). */
  reset() {
    currentUserID = null;
    currentTraits = {};
  },

  /** Получить очередь (только для smoke-теста / debug-overlay). */
  recent(limit = 50): QueueEntry[] {
    return queue.slice(-limit);
  },
};
