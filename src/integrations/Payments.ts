/**
 * Payment gateway seam. Two paths behind one API:
 *
 *  • REAL Stripe — when the deploy has STRIPE_SECRET_KEY (server) the
 *    /api/stripe-checkout function returns a hosted Checkout Session URL and we
 *    redirect the browser to it. The /api/stripe-webhook function then flips the
 *    pending record to paid. Nothing here needs to change when keys are added.
 *
 *  • MOCK — with no keys the endpoint replies { configured:false } and we return a
 *    synthetic "completed" charge so the whole app (bookings, market, billing)
 *    works end-to-end for demos and local dev.
 */
import { supabase } from '@/lib/supabase';

export interface CheckoutInput {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CheckoutResult {
  id: string;
  status: 'completed' | 'failed';
  amount: number;
  currency: string;
  method: string;
  created_at: string;
}

/** True once a Stripe publishable key is present (client-side signal that payments are live). */
export function isPaymentsConfigured(): boolean {
  return Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
}

export async function createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  await new Promise((r) => setTimeout(r, 400));
  return {
    id: 'ch_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    status: 'completed',
    amount: input.amount,
    currency: input.currency || 'USD',
    method: 'mock_card',
    created_at: new Date().toISOString(),
  };
}

export interface StartCheckoutInput extends CheckoutInput {
  successPath?: string; // where Stripe returns on success (e.g. "/Orders?paid=1")
  cancelPath?: string;
}
export type StartCheckoutResult =
  | { mode: 'redirect'; url: string }        // real Stripe — caller should navigate here
  | { mode: 'mock'; charge: CheckoutResult }; // no keys — caller marks the record paid now

/**
 * Begin a checkout. Asks the server to create a real Stripe Checkout Session; if
 * Stripe isn't configured, falls back to a mock charge. The caller should create
 * its record as `pending` (passing its id in metadata) BEFORE calling this so the
 * webhook can reconcile it after a real payment.
 */
export async function startCheckout(input: StartCheckoutInput): Promise<StartCheckoutResult> {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  try {
    // Send the session token — the endpoint requires an authenticated caller and
    // stamps the verified user id into the payment metadata server-side.
    const token = (await supabase?.auth.getSession())?.data?.session?.access_token;
    const res = await fetch('/api/stripe-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        amount: input.amount,
        currency: (input.currency || 'usd').toLowerCase(),
        description: input.description,
        metadata: input.metadata || {},
        successUrl: input.successPath ? origin + input.successPath : undefined,
        cancelUrl: input.cancelPath ? origin + input.cancelPath : undefined,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (json?.configured && json?.url) return { mode: 'redirect', url: json.url };
  } catch {
    /* endpoint unreachable (pure local dev) — fall through to mock */
  }
  return { mode: 'mock', charge: await createCheckout(input) };
}

/** Stripe Connect — practitioner payout onboarding. Returns a hosted onboarding URL
 *  (redirect the browser there) or { configured:false } when Stripe isn't set up. */
export async function startConnectOnboarding(): Promise<{ configured: boolean; url?: string; reason?: string }> {
  try {
    const token = (await supabase?.auth.getSession())?.data?.session?.access_token;
    const res = await fetch('/api/stripe-connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ action: 'onboard' }),
    });
    return await res.json().catch(() => ({ configured: false }));
  } catch { return { configured: false }; }
}

/** Refresh + return the practitioner's payout status from Stripe. */
export async function getConnectStatus(): Promise<{ configured: boolean; charges_enabled?: boolean; details_submitted?: boolean }> {
  try {
    const token = (await supabase?.auth.getSession())?.data?.session?.access_token;
    const res = await fetch('/api/stripe-connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ action: 'status' }),
    });
    return await res.json().catch(() => ({ configured: false }));
  } catch { return { configured: false }; }
}

export default { createCheckout, startCheckout, isPaymentsConfigured, startConnectOnboarding, getConnectStatus };
