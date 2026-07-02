// Creates a Stripe Checkout Session when STRIPE_SECRET_KEY is set; otherwise
// returns { configured:false } so the client keeps using the mock Payments seam.
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const KEY = process.env.STRIPE_SECRET_KEY;
  if (!KEY) { res.status(200).json({ configured: false }); return; }

  let Stripe;
  try { Stripe = (await import('stripe')).default; } catch { res.status(200).json({ configured: false, reason: 'stripe not installed' }); return; }

  const stripe = new Stripe(KEY);
  const { amount, currency = 'usd', description = 'KamboGuide booking', successUrl, cancelUrl, metadata = {} } = req.body || {};
  const origin = req.headers.origin || '';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: { currency, product_data: { name: description }, unit_amount: Math.round(Number(amount) * 100) },
        quantity: 1,
      }],
      success_url: successUrl || `${origin}/Bookings?paid=1`,
      cancel_url: cancelUrl || `${origin}/Bookings?canceled=1`,
      metadata,
    });
    res.status(200).json({ configured: true, id: session.id, url: session.url });
  } catch (e) {
    res.status(500).json({ configured: true, error: e.message });
  }
}
