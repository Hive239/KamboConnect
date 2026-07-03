// Vercel serverless function: receives Resend webhooks and logs delivery/open/click
// events into email_events for the admin email-engagement panel.
// Configure the webhook URL in Resend → Webhooks: https://<domain>/api/resend-webhook
// Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.

const MAP = {
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'failed',
  'email.complained': 'failed',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const URL_ = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL_ || !SRK) return res.status(200).json({ skipped: true });

  try {
    const evt = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) || {};
    const type = MAP[evt?.type];
    if (!type) return res.status(200).json({ ignored: evt?.type || 'unknown' });
    const data = evt.data || {};
    await fetch(`${URL_}/rest/v1/email_events`, {
      method: 'POST',
      headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        to_email: Array.isArray(data.to) ? data.to[0] : data.to,
        subject: data.subject,
        type,
        provider_id: data.email_id || data.id || null,
        meta: { raw_type: evt.type },
      }),
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ error: String(e) }); // 200 so Resend doesn't retry-storm
  }
}
