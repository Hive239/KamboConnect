/**
 * Lightweight error-reporting seam. Always logs to the console and keeps a small
 * ring buffer in localStorage for local debugging. If `VITE_SENTRY_DSN` is set,
 * it lazy-loads @sentry/browser (optional dependency) and forwards the error —
 * no hard dependency, and a complete no-op when the DSN is absent.
 */

const RING_KEY = "kc_error_log";
const RING_MAX = 25;

let sentryPromise: Promise<any> | null = null;

function getSentry(): Promise<any> | null {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return null;
  if (!sentryPromise) {
    // Computed specifier so the bundler doesn't try to resolve this optional
    // dependency at build time; it only loads at runtime if actually installed.
    const pkg = "@sentry/" + "browser";
    sentryPromise = import(/* @vite-ignore */ pkg)
      .then((Sentry: any) => {
        Sentry.init({ dsn });
        return Sentry;
      })
      .catch(() => null);
  }
  return sentryPromise;
}

function pushRing(entry: Record<string, any>) {
  try {
    const raw = localStorage.getItem(RING_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push(entry);
    while (list.length > RING_MAX) list.shift();
    localStorage.setItem(RING_KEY, JSON.stringify(list));
  } catch { /* storage may be unavailable (private mode / quota) */ }
}

export function reportError(error: unknown, context?: Record<string, any>): void {
  const err = error instanceof Error ? error : new Error(String(error));
  // eslint-disable-next-line no-console
  console.error("[reportError]", err, context || {});
  pushRing({
    message: err.message,
    stack: err.stack?.split("\n").slice(0, 4).join("\n"),
    context,
    at: new Date().toISOString(),
  });
  const s = getSentry();
  if (s) s.then((Sentry) => Sentry?.captureException(err, { extra: context }));
}

/** Register global handlers for otherwise-uncaught errors. Call once at startup. */
export function installGlobalErrorHandlers(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("error", (e) => reportError(e.error || e.message, { type: "window.error" }));
  window.addEventListener("unhandledrejection", (e) => reportError(e.reason, { type: "unhandledrejection" }));
}
