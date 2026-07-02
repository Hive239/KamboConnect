/**
 * Web-push subscription helper. Fully functional once a VAPID public key is set
 * (`VITE_VAPID_PUBLIC_KEY`) and the `/api/push-send` server key is configured.
 * Degrades gracefully: returns a reason string if push can't be enabled.
 */
import { PushSubscription as PushSub, User } from '@/entities/all';

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export function pushSupported(): boolean {
  // `Notification` must be checked too — some contexts (headless/embedded webviews,
  // insecure origins, older iOS Safari) expose service workers but not the
  // Notification API, and calling Notification.requestPermission there throws.
  return typeof window !== 'undefined' && 'serviceWorker' in navigator
    && 'PushManager' in window && 'Notification' in window
    && typeof Notification.requestPermission === 'function';
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Register the SW and subscribe this device to push. Returns {ok, reason?}. */
export async function enablePush(): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported()) return { ok: false, reason: 'This browser does not support notifications.' };
  if (!VAPID_PUBLIC) return { ok: false, reason: 'Push is not configured yet (missing VAPID key).' };

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, reason: 'Notification permission was declined.' };

  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });
    const json: any = sub.toJSON();
    const me = await User.me().catch(() => null);
    // De-dupe by endpoint for this user.
    const existing = me ? await PushSub.filter({ user_id: me.id }).catch(() => []) : [];
    if (!existing.some((e: any) => e.endpoint === json.endpoint)) {
      await PushSub.create({
        user_id: me?.id,
        endpoint: json.endpoint,
        keys: json.keys,
        user_agent: navigator.userAgent,
      } as any);
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'Could not enable push notifications.' };
  }
}

export function pushPermission(): NotificationPermission | 'unsupported' {
  if (!pushSupported()) return 'unsupported';
  return Notification.permission;
}
