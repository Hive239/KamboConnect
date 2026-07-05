import { phCapture, phIdentify } from "@/lib/posthog";
import { ActivityEvent, User } from "@/entities/all";

const KEY = "kc_activity_ts";
const WINDOW_MS = 30 * 60 * 1000; // throttle: at most one event per user per 30 min

/**
 * Records a lightweight engagement event for DAU/WAU/MAU. Throttled via localStorage
 * so navigation doesn't spam the table. Best-effort — never throws.
 */
export async function logActivity(path: string): Promise<void> {
  try {
    const last = Number(localStorage.getItem(KEY) || 0);
    if (Date.now() - last < WINDOW_MS) return;
    const me = await User.me().catch(() => null);
    if (!me) return;
    localStorage.setItem(KEY, String(Date.now()));
    await ActivityEvent.create({ user_id: me.id, type: "page_view", path });
  } catch {
    /* analytics logging must never break the app */
  }
}

/**
 * Records a typed product event (search, profile view, booking started, etc.) —
 * NOT throttled (these drive conversion funnels). Best-effort; never throws.
 * Works for logged-out visitors too (user_id is left null).
 */
export async function track(
  type: string,
  opts: { path?: string; entityId?: string; meta?: Record<string, any> } = {},
): Promise<void> {
  try {
    const me = await User.me().catch(() => null);
    // Mirror into PostHog (no-op until configured) for product analytics + replay.
    if (me?.id) phIdentify(me.id, { role: me.role, email: me.email });
    phCapture(type, { path: opts.path, entity_id: opts.entityId, ...(opts.meta || {}) });
    await ActivityEvent.create({
      user_id: me?.id,
      type,
      path: opts.path ?? (typeof location !== "undefined" ? location.pathname : undefined),
      entity_id: opts.entityId,
      meta: opts.meta || {},
    } as any);
  } catch {
    /* analytics logging must never break the app */
  }
}
