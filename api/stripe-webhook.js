// Stripe webhook — verifies the signature and marks the matching record paid.
// No-op until STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET are configured. DB writes
// need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (service role bypasses RLS).
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const KEY = process.env.STRIPE_SECRET_KEY;
  const WHSEC = process.env.STRIPE_WEBHOOK_SECRET;
  if (!KEY || !WHSEC) { res.status(200).json({ configured: false }); return; }

  let Stripe;
  try { Stripe = (await import('stripe')).default; } catch { res.status(200).json({ configured: false }); return; }
  const stripe = new Stripe(KEY);

  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks);

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, req.headers['stripe-signature'], WHSEC);
  } catch (e) {
    res.status(400).json({ error: `Webhook signature verification failed: ${e.message}` });
    return;
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const md = session.metadata || {};
      const paymentId = session.payment_intent || session.id;
      const amount = (session.amount_total || 0) / 100;
      await finalize(md, { paymentId, amount, currency: (session.currency || 'usd').toUpperCase() });
    } else if (event.type === 'account.updated') {
      // Practitioner finished (or changed) Connect onboarding — sync payout status.
      const acct = event.data.object;
      const pracId = acct?.metadata?.practitioner_id;
      if (pracId) {
        await patchTable('practitioners', `id=eq.${pracId}`, { stripe_charges_enabled: !!acct.charges_enabled });
      }
    }
  } catch (e) {
    // Log but still 200 so Stripe doesn't infinitely retry a malformed row.
    console.error('[stripe-webhook] finalize failed:', e?.message);
  }
  res.status(200).json({ received: true, type: event.type });
}

// Module-scope PATCH helper (service role) — used by non-checkout events.
async function patchTable(table, filter, body) {
  const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SB_URL || !SB_KEY) return;
  await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
}

// Update the pending record (order / booking / subscription) to paid, using the
// Supabase REST API with the service-role key.
async function finalize(md, pay) {
  const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SB_URL || !SB_KEY) { console.warn('[stripe-webhook] Supabase service role not configured'); return; }

  const patch = (table, filter, body) => fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  const insert = (table, body) => fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  const now = new Date().toISOString();

  if (md.kind === 'order' && md.order_id) {
    await patch('orders', `id=eq.${md.order_id}`, { status: 'paid', payment_id: pay.paymentId });
    await insert('payments', { user_id: md.user_id, amount: pay.amount, currency: pay.currency, payment_type: 'product', payment_status: 'completed', stripe_payment_id: pay.paymentId, payment_date: now });
    await insert('notifications', { user_id: md.user_id, title: 'Order confirmed', message: 'Your payment was received and your order is confirmed.', type: 'system', related_id: md.order_id, action_url: '/Orders' });
  } else if (md.kind === 'booking' && md.booking_id) {
    await patch('bookings', `id=eq.${md.booking_id}`, { payment_status: 'paid', deposit_status: 'paid' });
    if (md.payment_id) {
      // A pending Payment was pre-created by the client — flip it, don't duplicate.
      await patch('payments', `id=eq.${md.payment_id}`, { payment_status: 'completed', stripe_payment_id: pay.paymentId, payment_date: now });
    } else {
      await insert('payments', { booking_id: md.booking_id, user_id: md.user_id, practitioner_id: md.practitioner_id, amount: pay.amount, currency: pay.currency, payment_type: 'booking', payment_status: 'completed', stripe_payment_id: pay.paymentId, payment_date: now });
    }
  } else if (md.kind === 'course' && md.enrollment_id) {
    await patch('coursework_enrollments', `id=eq.${md.enrollment_id}`, { status: 'active', paid_at: now });
    await insert('payments', { user_id: md.user_id, amount: pay.amount, currency: pay.currency, payment_type: 'course', payment_status: 'completed', stripe_payment_id: pay.paymentId, payment_date: now });
  } else if (md.kind === 'subscription' && md.practitioner_id) {
    await patch('practitioners', `id=eq.${md.practitioner_id}`, { listing_tier: md.tier });
    await insert('subscriptions', { practitioner_id: md.practitioner_id, tier: md.tier, status: 'active', price: pay.amount, currency: pay.currency, period: 'monthly', current_period_end: new Date(Date.now() + 30 * 86400000).toISOString() });
    await insert('payments', { user_id: md.practitioner_id, practitioner_id: md.practitioner_id, amount: pay.amount, currency: pay.currency, payment_type: 'subscription', payment_status: 'completed', stripe_payment_id: pay.paymentId, payment_date: now });
  }
}
