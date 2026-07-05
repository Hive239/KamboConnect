// Daily reminder scheduler (Vercel Cron — see vercel.json "crons").
// Finds events + bookings happening in the next 24–48h and sends each participant
// a reminder: an in-app Notification (always) plus email (if Resend is configured)
// and web-push (if VAPID is configured). Runs once/day so each item reminds once.
//
// Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (service role — reads/writes
// with RLS bypassed). No-op if unset. Protected by CRON_SECRET when set.

export default async function handler(req, res) {
  // Fail closed: require CRON_SECRET to be configured AND matched. Without this,
  // an unset secret would let anyone trigger the full reminder fan-out (spam).
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'unauthorized' }); return;
  }
  const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SB_URL || !SB_KEY) { res.status(200).json({ configured: false }); return; }

  const origin = `https://${req.headers.host}`;
  const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };
  const sel = (t, qs) => fetch(`${SB_URL}/rest/v1/${t}?${qs}`, { headers: H }).then((r) => r.json()).catch(() => []);
  const insert = (t, body) => fetch(`${SB_URL}/rest/v1/${t}`, { method: 'POST', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(body) });
  const INT = { 'Content-Type': 'application/json', 'x-internal-secret': process.env.INTERNAL_API_SECRET || '' };
  const email = (to, subject, body) => fetch(`${origin}/api/send-email`, { method: 'POST', headers: INT, body: JSON.stringify({ to, subject, body }) }).catch(() => {});
  const push = (subs, title, body, url) => subs.length && fetch(`${origin}/api/push-send`, { method: 'POST', headers: INT, body: JSON.stringify({ subscriptions: subs, title, body, url }) }).catch(() => {});

  const now = new Date();
  const from = new Date(now.getTime() + 24 * 3600e3).toISOString();
  const to = new Date(now.getTime() + 48 * 3600e3).toISOString();
  let eventReminders = 0, bookingReminders = 0;

  // ---- EVENTS starting in 24–48h → remind each registrant ----
  const events = await sel('events', `start_date=gte.${from}&start_date=lt.${to}&status=eq.upcoming&select=id,title,start_date`);
  for (const ev of events || []) {
    const regs = await sel('event_registrations', `event_id=eq.${ev.id}&select=created_by,participant_email,participant_name`);
    for (const r of regs || []) {
      const when = new Date(ev.start_date).toLocaleString();
      if (r.created_by) {
        await insert('notifications', { user_id: r.created_by, title: 'Event reminder', message: `"${ev.title}" is tomorrow (${when}).`, type: 'event', related_id: ev.id, action_url: `/EventDetail?id=${ev.id}` });
        const subs = await sel('push_subscriptions', `user_id=eq.${r.created_by}&select=endpoint,keys`);
        await push((subs || []).map((s) => ({ endpoint: s.endpoint, keys: s.keys })), 'Event reminder', `"${ev.title}" is tomorrow.`, `/EventDetail?id=${ev.id}`);
      }
      if (r.participant_email) await email(r.participant_email, `Reminder: ${ev.title} is tomorrow`, `Hi ${r.participant_name || 'there'},\n\nThis is a reminder that "${ev.title}" is happening ${when}.\n\nSee you there!`);
      eventReminders++;
    }
  }

  // ---- BOOKINGS in 24–48h → remind client + practitioner ----
  const bookings = await sel('bookings', `slot_start=gte.${from}&slot_start=lt.${to}&status=eq.confirmed&select=id,slot_start,client_id,client_email,client_name,practitioner_id,practitioner_name`);
  for (const bk of bookings || []) {
    const when = new Date(bk.slot_start).toLocaleString();
    if (bk.client_id) await insert('notifications', { user_id: bk.client_id, title: 'Session reminder', message: `Your session with ${bk.practitioner_name || 'your practitioner'} is tomorrow (${when}).`, type: 'booking', related_id: bk.id, action_url: '/Bookings' });
    if (bk.client_email) await email(bk.client_email, 'Reminder: your Kambo session is tomorrow', `Hi ${bk.client_name || 'there'},\n\nA reminder that your session is scheduled for ${when}.`);
    bookingReminders++;
  }

  res.status(200).json({ configured: true, eventReminders, bookingReminders });
}
