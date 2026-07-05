/**
 * A practitioner subscription counts as active only when its status is 'active'
 * AND its paid period hasn't ended. Without the date check, an expired sub (no
 * renewal charge exists) would count as active forever — inflating MRR and
 * letting the practitioner keep a premium listing tier indefinitely.
 */
export function isActiveSub(sub: any, now: number = Date.now()): boolean {
  if (!sub || sub.status !== 'active') return false;
  if (!sub.current_period_end) return true; // no period tracked → trust status
  return new Date(sub.current_period_end).getTime() >= now;
}
