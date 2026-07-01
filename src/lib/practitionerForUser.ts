import { Practitioner } from '@/entities/all';

/**
 * Resolve the Practitioner listing owned by a user.
 * Unified identity: a practitioner's listing id === their auth/user id. We try
 * that first, then user_id, then email (legacy/transition fallback).
 */
export async function resolvePractitionerForUser(user: any) {
  if (!user) return null;
  try { const p = await Practitioner.get(user.id); if (p) return p; } catch { /* not a practitioner */ }
  const byUserId = await Practitioner.filter({ user_id: user.id }).catch(() => []);
  if (byUserId[0]) return byUserId[0];
  const byEmail = user.email ? await Practitioner.filter({ email: user.email }).catch(() => []) : [];
  return byEmail[0] || null;
}
