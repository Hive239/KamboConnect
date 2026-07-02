// Stripe webhook — verifies the signature and is the integration point for
// marking payments/bookings paid. No-op until STRIPE keys are configured.
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

  // TODO(on Stripe cutover): on 'checkout.session.completed', update the matching
  // Payment/Booking row to paid via the Supabase service-role key.
  res.status(200).json({ received: true, type: event.type });
}
