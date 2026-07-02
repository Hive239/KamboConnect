/**
 * Unified notification helper — one call fans out to all channels:
 *   1. in-app  (Notification entity → NotificationCenter, live via realtime)
 *   2. email   (SendEmail → /api/send-email; real when RESEND_API_KEY set, else no-op)
 *   3. web-push(best-effort → /api/push-send; no-op without VAPID keys)
 * Every channel is wrapped so a failure in one never blocks the others or the caller.
 */
import { Notification, PushSubscription } from '@/entities/all';
import { SendEmail } from '@/integrations/Core';

export interface NotifyInput {
  userId?: string;
  userEmail?: string;
  type?: 'booking' | 'message' | 'event' | 'community' | 'review' | 'system';
  title: string;
  body: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  link?: string;       // action_url
  relatedId?: string;
  /** Force email on/off. Default: send email for high/urgent priority. */
  email?: boolean;
}

export async function notify(input: NotifyInput): Promise<void> {
  const { userId, userEmail, type = 'system', title, body, priority = 'normal', link, relatedId, email } = input;

  // 1. In-app
  if (userId) {
    try {
      await Notification.create({
        user_id: userId, title, message: body, type, priority,
        related_id: relatedId, action_url: link,
      });
    } catch { /* non-blocking */ }
  }

  // 2. Email — default to high/urgent only
  const shouldEmail = email ?? (priority === 'high' || priority === 'urgent');
  if (shouldEmail && userEmail) {
    try { await SendEmail({ to: userEmail, subject: `KamboGuide: ${title}`, body }); } catch { /* Resend no-ops without key */ }
  }

  // 3. Web push (best-effort)
  if (userId) {
    try {
      const subs = await PushSubscription.filter({ user_id: userId }).catch(() => []);
      if (subs.length) {
        await fetch('/api/push-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptions: subs, title, body, url: link }),
        }).catch(() => {});
      }
    } catch { /* ignore */ }
  }
}
