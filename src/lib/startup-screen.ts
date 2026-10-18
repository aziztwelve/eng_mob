import { useSyncExternalStore } from 'react';

let tabsReady = false;
const listeners = new Set<() => void>();

/** One-way readiness for the initial local auth check, not API data loading. */
export function markStartupTabsReady() {
  if (tabsReady) return;
  tabsReady = true;
  for (const listener of listeners) listener();
}

export function useStartupTabsReady() {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    () => tabsReady,
    () => false,
  );
}
