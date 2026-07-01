/**
 * Mock auth session for local development.
 * Tracks the "current user" and lets you switch between demo accounts via the
 * dev Role Switcher (src/components/dev/RoleSwitcher.tsx).
 *
 * On migration this is replaced by Supabase Auth (session + getUser()).
 */
import { makeEntity } from './store';
import type { User } from '@/types/entities';

const userStore = makeEntity('User');
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

export function logout() {
  localStorage.setItem(SESSION_KEY, LOGGED_OUT);
  notify();
}

export async function updateCurrentUser(data: Partial<User> & Record<string, any>) {
  const id = getCurrentUserId();
  if (!id) throw new Error('Not signed in');
  const updated = await userStore.update(id, data);
  notify();
  return updated;
}
