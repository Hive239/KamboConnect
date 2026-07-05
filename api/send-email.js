// Vercel serverless function: sends transactional email via Resend + logs each
// attempt to the email_events table (for the admin email-engagement panel).
// Configure in Vercel → Settings → Environment Variables:
//   RESEND_API_KEY  (required)  — from https://resend.com
//   EMAIL_FROM      (optional)  — e.g. "KamboGuide <hello@yourdomain.com>"; must be a Resend-verified domain.
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (optional) — enables email_events logging.
// If RESEND_API_KEY is unset the endpoint is a safe no-op (returns skipped:true).

// Authorize the caller: either an internal server-to-server shared secret
// (used by api/reminders.js) OR a valid Supabase user JWT. Prevents the endpoint
// from being an open, unauthenticated email relay.
async function authorize(req) {
  const internal = process.env.INTERNAL_API_SECRET;
  if (internal && req.headers['x-internal-secret'] === internal) return true;
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const URL_ = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!token || !URL_) return false;
  try {
    const r = await fetch(`${URL_}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: ANON || token } });
    if (!r.ok) return false;
    const u = await r.json();
    return !!u?.id;
  } catch { return false; }
}

// Escape HTML so a caller-supplied body can't inject markup into the email.
function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function logEmail(row) {
  const URL_ = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL_ || !SRK) return;
  try {
    await fetch(`${URL_}/rest/v1/email_events`, {
      method: 'POST',
      headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(row),
    });
  } catch { /* logging must not break send */ }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  // Fail closed: only authenticated users or internal callers may send mail.
  if (!(await authorize(req))) return res.status(401).json({ error: 'unauthorized' });

  const KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.EMAIL_FROM || 'KamboGuide <onboarding@resend.dev>';
  const { to, subject, body } = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) || {};

  if (!KEY) {
    await logEmail({ to_email: to, subject, type: 'skipped', meta: { reason: 'no_api_key' } });
    return res.status(200).json({ skipped: true, reason: 'RESEND_API_KEY not set' });
  }
  if (!to || !subject) return res.status(400).json({ error: 'missing_to_or_subject' });

  const html = `<div style="font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;line-height:1.6;color:#1a1c1a">
    ${escapeHtml(body).replace(/\n/g, '<br/>')}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
    <p style="font-size:12px;color:#6b7280">Sent by KamboGuide. If this wasn't you, you can ignore this email.</p>
  </div>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    const j = await r.json().catch(() => ({}));
    await logEmail({ to_email: to, subject, type: r.ok ? 'sent' : 'failed', provider_id: j?.id || null, meta: r.ok ? {} : { error: j } });
    return res.status(r.ok ? 200 : 502).json(j);
  } catch (e) {
    await logEmail({ to_email: to, subject, type: 'failed', meta: { error: String(e) } });
    return res.status(502).json({ error: 'send_failed', detail: String(e) });
  }
}
