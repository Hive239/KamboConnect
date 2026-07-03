/**
 * Unified notification helper — one call fans out to all channels:
 *   1. in-app  (Notification entity → NotificationCenter, live via realtime)
 *   2. email   (SendEmail → /api/send-email; real when RESEND_API_KEY set, else no-op)
 *   3. web-push(best-effort → /api/push-send; no-op without VAPID keys)
 * Every channel is wrapped so a failure in one never blocks the others or the caller.
 */
import { Notification, PushSubscription, User } from '@/entities/all';
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

  // Respect the recipient's channel preferences (in-app is always delivered; email
  // and push are the intrusive channels the toggles in AccountSettings control).
  let prefs: any = null;
  if (userId) { try { prefs = (await User.get(userId))?.preferences; } catch { /* default to allowed */ } }
  const emailAllowed = prefs?.email_updates !== false;
  const pushAllowed = prefs?.notifications !== false;

  // 1. In-app
  if (userId) {
    try {
      await Notification.create({
        user_id: userId, title, message: body, type, priority,
        related_id: relatedId, action_url: link,
      });
    } catch { /* non-blocking */ }
  }

  // 2. Email — default to high/urgent only, and only if the user allows email.
  const shouldEmail = (email ?? (priority === 'high' || priority === 'urgent')) && emailAllowed;
  if (shouldEmail && userEmail) {
    try { await SendEmail({ to: userEmail, subject: `KamboGuide: ${title}`, body }); } catch { /* Resend no-ops without key */ }
  }

  // 3. Web push (best-effort) — only if the user allows push.
  if (userId && pushAllowed) {
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
