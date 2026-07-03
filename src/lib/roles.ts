import { createPageUrl } from '@/utils';

export type Role = 'admin' | 'practitioner' | 'client';

/**
 * Single source of truth for a user's tier. `profiles.role` is authoritative;
 * legacy `'user'`/null/unknown collapse to `'client'`.
 */
export function getRole(user: any): Role {
  const r = user?.role;
  if (r === 'admin') return 'admin';
  if (r === 'practitioner') return 'practitioner';
  return 'client';
}

/** Where each role lands after login / when redirected from a disallowed page. */
export function roleHome(role: Role): string {
  if (role === 'admin') return createPageUrl('AdminDashboard');
  if (role === 'practitioner') return createPageUrl('PractitionerDashboard');
  return createPageUrl('Directory');
}

/**
 * Per-page access for AUTHENTICATED users. A page listed here is visible only to
 * the roles in its array; a logged-in user whose role isn't allowed is redirected
 * to their role-home. Pages NOT listed are open to every authenticated role.
 * Anonymous access is governed separately by PUBLIC_PAGES.
 */
const PAGE_ACCESS: Record<string, Role[]> = {
  // Client discovery + commerce — practitioners are the supply, not the buyers.
  Directory: ['client', 'admin'],
  Matchmaking: ['client', 'admin'],
  ForYou: ['client', 'admin'],
  Journal: ['client', 'admin'], // client integration journal (matches nav gating)
  // Shared discovery tools — practitioners get these too (browse the map, ask the
  // Guide, shop the market + see their orders alongside clients).
  Map: ['client', 'practitioner', 'admin'],
  Guide: ['client', 'practitioner', 'admin'],
  Market: ['client', 'practitioner', 'admin'],
  Orders: ['client', 'practitioner', 'admin'],
  Favorites: ['client', 'admin'],
  Bookings: ['client', 'admin'],
  BookingRequest: ['client', 'admin'],
  PractitionerApplication: ['client', 'admin'],
  // Practitioner service tools.
  PractitionerDashboard: ['practitioner', 'admin'],
  Billing: ['practitioner', 'admin'],
  // Admin only.
  AdminDashboard: ['admin'],
  TrustSafety: ['admin'],
  Verification: ['admin'],
  // (Community, Events, Messages, Profile, MyAccount, Education, PractitionerProfile,
  //  Post, GroupDetail, legal pages → unlisted = all authenticated roles.)
};

/** Pages an anonymous (logged-out) visitor may reach. Everything else requires
 *  sign-in — logged-out users are redirected to /Auth, never left inside the app. */
export const PUBLIC_PAGES = new Set<string>([
  'Auth', 'Landing', 'ResetPassword', 'Disclaimer', 'Privacy', 'Terms',
]);

/** True if `role` may view `page` (authenticated-user check). */
export function canAccess(page: string, role: Role): boolean {
  const allowed = PAGE_ACCESS[page];
  return !allowed || allowed.includes(role);
}
