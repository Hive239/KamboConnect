// Creates a Stripe Checkout Session when STRIPE_SECRET_KEY is set; otherwise
// returns { configured:false } so the client keeps using the mock Payments seam.
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const KEY = process.env.STRIPE_SECRET_KEY;
  if (!KEY) { res.status(200).json({ configured: false }); return; }

  // Require an authenticated caller; derive the user id server-side so the
  // webhook can trust metadata.user_id (client can't forge whose payment this is).
  const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = (req.headers.authorization || '').startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
  let uid = null;
  if (token && SB_URL) {
    try { const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: ANON || token } }); if (r.ok) uid = (await r.json())?.id; } catch { /* fall through */ }
  }
  if (!uid) { res.status(401).json({ error: 'unauthorized' }); return; }

  let Stripe;
  try { Stripe = (await import('stripe')).default; } catch { res.status(200).json({ configured: false, reason: 'stripe not installed' }); return; }

  const stripe = new Stripe(KEY);
  const { amount, currency = 'usd', description = 'KamboGuide booking', successUrl, cancelUrl, metadata = {} } = req.body || {};
  const origin = req.headers.origin || '';
  // Server-authoritative: stamp the verified uid, and for a referenced booking use
  // the DB price (ignore a client-tampered amount).
  const meta = { ...metadata, user_id: uid };
  let chargeAmount = Number(amount);
  if (metadata?.booking_id && SB_URL && SRK) {
    try {
      const br = await fetch(`${SB_URL}/rest/v1/bookings?id=eq.${metadata.booking_id}&select=price,client_id`, { headers: { apikey: SRK, Authorization: `Bearer ${SRK}` } });
      const [bk] = br.ok ? await br.json() : [];
      if (bk && Number(bk.price) > 0) chargeAmount = Number(bk.price);
    } catch { /* keep client amount as fallback */ }
  }
  if (!(chargeAmount > 0)) { res.status(400).json({ error: 'invalid_amount' }); return; }

  // Marketplace split: for a booking/product tied to a practitioner with payouts
  // enabled, route the charge to their connected account and keep the 5% platform fee.
  // Subscriptions + coursework stay 100% platform revenue (no transfer).
  const PLATFORM_FEE_RATE = 0.05;
  let payment_intent_data;
  const splittable = (metadata?.kind === 'booking' || metadata?.kind === 'product' || metadata?.kind === 'order');
  if (splittable && metadata?.practitioner_id && SB_URL && SRK) {
    try {
      const pr = await fetch(`${SB_URL}/rest/v1/practitioners?id=eq.${metadata.practitioner_id}&select=stripe_account_id,stripe_charges_enabled`, { headers: { apikey: SRK, Authorization: `Bearer ${SRK}` } });
      const [prac] = pr.ok ? await pr.json() : [];
      if (prac?.stripe_account_id && prac?.stripe_charges_enabled) {
        payment_intent_data = {
          application_fee_amount: Math.round(chargeAmount * 100 * PLATFORM_FEE_RATE),
          transfer_data: { destination: prac.stripe_account_id },
        };
        meta.transfer_destination = prac.stripe_account_id;
        meta.application_fee = (chargeAmount * PLATFORM_FEE_RATE).toFixed(2);
      }
    } catch { /* fall back to platform charge if lookup fails */ }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: { currency, product_data: { name: description }, unit_amount: Math.round(chargeAmount * 100) },
        quantity: 1,
      }],
      success_url: successUrl || `${origin}/Bookings?paid=1`,
      cancel_url: cancelUrl || `${origin}/Bookings?canceled=1`,
      metadata: meta,
      ...(payment_intent_data ? { payment_intent_data } : {}),
    });
    res.status(200).json({ configured: true, id: session.id, url: session.url });
  } catch (e) {
    res.status(500).json({ configured: true, error: e.message });
  }
}
