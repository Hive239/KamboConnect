// Web-push sender. Real when VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY are set;
// otherwise responds 200 with sent:0 so callers stay non-blocking (mirrors send-email.js).
import { authorizeRequest } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  if (!(await authorizeRequest(req)).ok) { res.status(401).json({ error: 'unauthorized' }); return; }

  const PUBLIC = process.env.VAPID_PUBLIC_KEY;
  const PRIVATE = process.env.VAPID_PRIVATE_KEY;
  const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:hello@kamboguide.app';

  const { subscriptions = [], title = 'KamboGuide', body = '', url = '/' } = req.body || {};

  if (!PUBLIC || !PRIVATE) {
    // Not configured yet — no-op success so notify() never throws.
    res.status(200).json({ sent: 0, configured: false });
    return;
  }

  let webpush;
  try {
    webpush = (await import('web-push')).default;
  } catch {
    res.status(200).json({ sent: 0, configured: false, reason: 'web-push not installed' });
    return;
  }

  webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
  const payload = JSON.stringify({ title, body, url });

  let sent = 0;
  await Promise.all(
    // Skip native (FCM/APNs) tokens — those go to /api/native-push-send.
    subscriptions.filter((s) => !s?.keys?.platform).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload);
        sent += 1;
      } catch { /* stale subscription — ignore */ }
    }),
  );
  res.status(200).json({ sent, configured: true });
}
