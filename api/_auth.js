// Shared authorizer for serverless endpoints. Underscore prefix → Vercel does NOT
// treat this as a route. Accepts either an internal server-to-server shared secret
// (INTERNAL_API_SECRET, used by api/reminders.js) or a valid Supabase user JWT.
export async function authorizeRequest(req) {
  const internal = process.env.INTERNAL_API_SECRET;
  if (internal && req.headers['x-internal-secret'] === internal) return { ok: true, kind: 'internal' };
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const URL_ = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!token || !URL_) return { ok: false };
  try {
    const r = await fetch(`${URL_}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: ANON || token } });
    if (!r.ok) return { ok: false };
    const u = await r.json();
    return u?.id ? { ok: true, kind: 'user', uid: u.id } : { ok: false };
  } catch { return { ok: false }; }
}
