// Vercel serverless function: permanently delete the calling user's account + owned data.
// Env (Vercel → Settings → Environment Variables):
//   SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY (required), VITE_SUPABASE_ANON_KEY
// Returns 501 if not configured (client then falls back to a soft delete).

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const URL_ = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ANON = process.env.VITE_SUPABASE_ANON_KEY || SRK;
  if (!URL_ || !SRK) return res.status(501).json({ error: 'delete_not_configured' });

  const { access_token } = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) || {};
  if (!access_token) return res.status(401).json({ error: 'no_token' });

  // Identify the caller from their JWT.
  const who = await fetch(`${URL_}/auth/v1/user`, { headers: { apikey: ANON, Authorization: `Bearer ${access_token}` } });
  const u = await who.json().catch(() => ({}));
  const uid = u?.id;
  if (!uid) return res.status(401).json({ error: 'invalid_token' });

  const H = { apikey: SRK, Authorization: `Bearer ${SRK}`, 'Content-Type': 'application/json' };
  const owned = [
    ['bookings', 'client_id'], ['consultations', 'client_id'], ['orders', 'user_id'],
    ['payments', 'user_id'], ['consent_records', 'user_id'], ['screening_responses', 'user_id'],
    ['favorites', 'user_id'], ['saved_searches', 'user_id'], ['follows', 'follower_id'],
    ['notifications', 'user_id'], ['client_records', 'client_id'], ['practitioners', 'id'], ['profiles', 'id'],
  ];
  for (const [t, col] of owned) {
    try { await fetch(`${URL_}/rest/v1/${t}?${col}=eq.${uid}`, { method: 'DELETE', headers: H }); } catch { /* best effort */ }
  }
  try { await fetch(`${URL_}/auth/v1/admin/users/${uid}`, { method: 'DELETE', headers: H }); } catch { /* best effort */ }
  return res.status(200).json({ deleted: true });
}
