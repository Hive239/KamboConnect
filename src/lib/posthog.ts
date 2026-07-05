// PostHog product analytics + session replay + feature flags.
// No-op until VITE_POSTHOG_KEY is set, so nothing breaks before it's configured.
import posthog from "posthog-js";

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string) || "https://us.i.posthog.com";

let ready = false;

export function isPosthogEnabled(): boolean {
  return Boolean(KEY);
}

/** Initialize once (called from main.tsx). Safe to call when unconfigured. */
export function initPosthog(): void {
  if (ready || !KEY) return;
  try {
    posthog.init(KEY, {
      api_host: HOST,
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      session_recording: { maskAllInputs: true }, // privacy: never record typed input
      persistence: "localStorage+cookie",
    });
    ready = true;
  } catch { /* analytics must never break the app */ }
}

/** Mirror a taxonomy event into PostHog. */
export function phCapture(event: string, props?: Record<string, any>): void {
  if (!ready) return;
  try { posthog.capture(event, props); } catch { /* ignore */ }
}

/** Associate events with the signed-in user. */
export function phIdentify(id: string, props?: Record<string, any>): void {
  if (!ready || !id) return;
  try { posthog.identify(id, props); } catch { /* ignore */ }
}

export function phReset(): void {
  if (!ready) return;
  try { posthog.reset(); } catch { /* ignore */ }
}

export { posthog };
