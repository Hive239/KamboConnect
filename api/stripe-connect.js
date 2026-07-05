// Stripe Connect (Express) onboarding for practitioner payouts.
//   POST { action:'onboard' }  → creates/returns the connected account + an
//                                Account Link (hosted onboarding URL).
//   POST { action:'status'  }  → refreshes charges_enabled from Stripe.
// No-op { configured:false } until STRIPE_SECRET_KEY is set. Writes to the DB with
// the service-role key. The practitioner listing id === the owner's user id.
import { authorizeRequest } from './_auth.js';

const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getPractitioner(id) {
  const r = await fetch(`${SB_URL}/rest/v1/practitioners?id=eq.${id}&select=id,full_name,email,stripe_account_id`, {
    headers: { apikey: SRK, Authorization: `Bearer ${SRK}` },
  });
  const [row] = r.ok ? await r.json() : [];
  return row || null;
}
async function patchPractitioner(id, body) {
  await fetch(`${SB_URL}/rest/v1/practitioners?id=eq.${id}`, {
    method: 'PATCH',
    headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const KEY = process.env.STRIPE_SECRET_KEY;
  if (!KEY) return res.status(200).json({ configured: false });
  if (!SB_URL || !SRK) return res.status(200).json({ configured: false, reason: 'supabase service role not set' });

  const auth = await authorizeRequest(req);
  if (!auth.ok || auth.kind !== 'user') return res.status(401).json({ error: 'unauthorized' });
  const uid = auth.uid;

  let Stripe;
  try { Stripe = (await import('stripe')).default; } catch { return res.status(200).json({ configured: false, reason: 'stripe not installed' }); }
  const stripe = new Stripe(KEY);

  const { action } = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) || {};
  const origin = req.headers.origin || '';

  const prac = await getPractitioner(uid);
  if (!prac) return res.status(400).json({ error: 'not_a_practitioner' });

  try {
    let accountId = prac.stripe_account_id;

    // Create the Express account on first onboard.
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: prac.email || undefined,
        business_type: 'individual',
        capabilities: { transfers: { requested: true }, card_payments: { requested: true } },
        metadata: { practitioner_id: uid },
      });
      accountId = account.id;
      await patchPractitioner(uid, { stripe_account_id: accountId });
    }

    if (action === 'status') {
      const acct = await stripe.accounts.retrieve(accountId);
      const enabled = !!acct.charges_enabled;
      await patchPractitioner(uid, { stripe_charges_enabled: enabled });
      return res.status(200).json({ configured: true, accountId, charges_enabled: enabled, details_submitted: !!acct.details_submitted });
    }

    // Default: create an onboarding Account Link.
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/Billing?connect=refresh`,
      return_url: `${origin}/Billing?connect=return`,
      type: 'account_onboarding',
    });
    return res.status(200).json({ configured: true, accountId, url: link.url });
  } catch (e) {
    return res.status(500).json({ configured: true, error: e.message });
  }
}
