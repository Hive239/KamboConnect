// Mints a LiveKit room JWT for a video session. The caller must be a party to the
// booking (its client or practitioner). No-op { configured:false } until
// LIVEKIT_API_KEY / LIVEKIT_API_SECRET are set. Room name is derived from the booking id.
import { authorizeRequest } from './_auth.js';

const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const API_KEY = process.env.LIVEKIT_API_KEY;
  const API_SECRET = process.env.LIVEKIT_API_SECRET;
  if (!API_KEY || !API_SECRET) return res.status(200).json({ configured: false });

  const auth = await authorizeRequest(req);
  if (!auth.ok || auth.kind !== 'user') return res.status(401).json({ error: 'unauthorized' });
  const uid = auth.uid;

  const { bookingId } = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) || {};
  if (!bookingId) return res.status(400).json({ error: 'missing_booking' });

  // Authorize: the caller must be this booking's client or practitioner.
  let booking = null, displayName = 'Guest';
  if (SB_URL && SRK) {
    try {
      const r = await fetch(`${SB_URL}/rest/v1/bookings?id=eq.${bookingId}&select=id,client_id,practitioner_id,client_name,practitioner_name,status`, { headers: { apikey: SRK, Authorization: `Bearer ${SRK}` } });
      const [row] = r.ok ? await r.json() : [];
      booking = row || null;
    } catch { /* fall through */ }
  }
  if (!booking) return res.status(404).json({ error: 'booking_not_found' });
  const isClient = booking.client_id === uid;
  const isPractitioner = booking.practitioner_id === uid;
  if (!isClient && !isPractitioner) return res.status(403).json({ error: 'not_a_participant' });
  displayName = isPractitioner ? (booking.practitioner_name || 'Practitioner') : (booking.client_name || 'Client');

  let AccessToken;
  try { ({ AccessToken } = await import('livekit-server-sdk')); } catch { return res.status(200).json({ configured: false, reason: 'livekit-server-sdk not installed' }); }

  const roomName = `kg_booking_${bookingId}`;
  try {
    const at = new AccessToken(API_KEY, API_SECRET, { identity: uid, name: displayName, ttl: '2h' });
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true });
    const token = await at.toJwt();
    return res.status(200).json({ configured: true, token, room: roomName, url: process.env.LIVEKIT_URL || process.env.VITE_LIVEKIT_URL || null });
  } catch (e) {
    return res.status(500).json({ configured: true, error: e.message });
  }
}
