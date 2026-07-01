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
