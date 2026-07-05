import { useEffect, useState } from "react";
import { posthog, isPosthogEnabled } from "@/lib/posthog";

/**
 * Read a PostHog feature flag with a safe default. Returns `fallback` when PostHog
 * isn't configured, so gated features behave deterministically before setup.
 */
export function useFlag(key: string, fallback = false): boolean {
  const [on, setOn] = useState<boolean>(fallback);
  useEffect(() => {
    if (!isPosthogEnabled()) { setOn(fallback); return; }
    try {
      setOn(!!posthog.isFeatureEnabled(key));
      const unsub = posthog.onFeatureFlags(() => setOn(!!posthog.isFeatureEnabled(key)));
      return () => { try { unsub?.(); } catch { /* ignore */ } };
    } catch { setOn(fallback); }
  }, [key, fallback]);
  return on;
}
