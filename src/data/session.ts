/**
 * Mock auth session for local development.
 * Tracks the "current user" and lets you switch between demo accounts via the
 * dev Role Switcher (src/components/dev/RoleSwitcher.tsx).
 *
 * On migration this is replaced by Supabase Auth (session + getUser()).
 */
import { makeEntity } from './store';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/entities';

const userStore = makeEntity('User');

/** Ensure a profile row exists for a real Supabase auth user; returns it. */
async function ensureProfile(authUser: any): Promise<User> {
  try { return await userStore.get(authUser.id); } catch { /* not created yet */ }
  return await userStore.create({
    id: authUser.id,
    email: authUser.email,
    full_name: authUser.user_metadata?.full_name || (authUser.email || '').split('@')[0],
    role: 'user',
  } as any);
}
const SESSION_KEY = 'kc_session_user_id';
const LOGGED_OUT = '__logged_out__';

export interface DemoAccount {
  id: string;
  label: string;
  description: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { id: 'user-client', label: 'Client', description: 'Jordan Rivera — books sessions' },
  { id: 'user-maria', label: 'Practitioner', description: 'Maria Santos — has a profile' },
  { id: 'user-admin', label: 'Admin', description: 'Avery Admin — full access' },
];

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}

/** Subscribe to session changes (used by the Role Switcher + AuthContext). */
export function onSessionChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getCurrentUserId(): string | null {
  const v = typeof localStorage !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null;
  if (v === LOGGED_OUT) return null;
  return v || 'user-client'; // default: auto-signed-in as the client for convenience
}

export async function getCurrentUser(): Promise<User | null> {
  // Prefer a real Supabase auth session; fall back to the demo/dev session.
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) return await ensureProfile(data.session.user);
    } catch { /* fall through to demo session */ }
  }
  const id = getCurrentUserId();
  if (!id) return null;
  try {
    return await userStore.get(id);
  } catch {
    return null;
  }
}

export function setCurrentUserId(id: string) {
  localStorage.setItem(SESSION_KEY, id);
  notify();
}

export function login() {
  setCurrentUserId('user-client');
}

export async function logout() {
  if (supabase) { try { await supabase.auth.signOut(); } catch { /* ignore */ } }
  localStorage.setItem(SESSION_KEY, LOGGED_OUT);
  notify();
}

export async function updateCurrentUser(data: Partial<User> & Record<string, any>) {
  const me = await getCurrentUser();
  if (!me) throw new Error('Not signed in');
  const updated = await userStore.update(me.id, data);
  notify();
  return updated;
}
