// Keyless per-user calendar feed. GET /api/ics?token=<calendar_token> returns a
// text/calendar (ICS) document of the user's confirmed bookings — subscribe to it
// in Google/Apple/Outlook. Auth is the unguessable token (no login needed by the
// calendar client). Reads via the Supabase service-role key.
const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;

function toICSDate(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
function esc(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export default async function handler(req, res) {
  const token = req.query?.token || '';
  if (!token) return res.status(400).send('missing token');
  if (!SB_URL || !SRK) return res.status(503).send('calendar not configured');

  const H = { apikey: SRK, Authorization: `Bearer ${SRK}` };
  const origin = `https://${req.headers.host || 'kamboguide.com'}`;

  // Resolve the user from the calendar token.
  let uid = null, name = '';
  try {
    const r = await fetch(`${SB_URL}/rest/v1/profiles?calendar_token=eq.${token}&select=id,full_name`, { headers: H });
    const [p] = r.ok ? await r.json() : [];
    if (p) { uid = p.id; name = p.full_name || ''; }
  } catch { /* fall through */ }
  if (!uid) return res.status(404).send('invalid token');

  // Confirmed bookings where the user is client or practitioner.
  let bookings = [];
  try {
    const q = `or=(client_id.eq.${uid},practitioner_id.eq.${uid})&status=eq.confirmed&select=id,requested_date,duration_minutes,service_type,client_name,practitioner_name`;
    const r = await fetch(`${SB_URL}/rest/v1/bookings?${q}`, { headers: H });
    bookings = r.ok ? await r.json() : [];
  } catch { /* none */ }

  const now = toICSDate(new Date().toISOString());
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KamboGuide//Calendar//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:KamboGuide${name ? ' — ' + esc(name) : ''}`,
  ];
  for (const b of bookings) {
    const start = toICSDate(b.requested_date);
    if (!start) continue;
    const endDate = new Date(new Date(b.requested_date).getTime() + (Number(b.duration_minutes) || 90) * 60000);
    const end = toICSDate(endDate.toISOString());
    const other = b.practitioner_name && b.client_name ? `${b.practitioner_name} & ${b.client_name}` : (b.practitioner_name || b.client_name || '');
    lines.push(
      'BEGIN:VEVENT',
      `UID:booking-${b.id}@kamboguide.com`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${esc(b.service_type || 'Kambo session')}${other ? ' — ' + esc(other) : ''}`,
      `DESCRIPTION:${esc('Your KamboGuide session.')}\\nJoin: ${origin}/Session?booking=${b.id}`,
      `URL:${origin}/Session?booking=${b.id}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="kamboguide.ics"');
  res.setHeader('Cache-Control', 'private, max-age=300');
  return res.status(200).send(lines.join('\r\n'));
}
