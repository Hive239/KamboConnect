import { Capacitor } from "@capacitor/core";
import { PushSubscription as PushSub, User } from "@/entities/all";

/**
 * Native push registration (FCM on Android / APNs on iOS). Stores the device
 * token in `push_subscriptions` tagged with the platform. No-op on web (that
 * path uses web-push via src/lib/push.ts).
 *
 * DELIVERY is a separate step (see MOBILE.md): a native token is NOT a web-push
 * endpoint, so `api/push-send.js` (web-push) can't send to it. Sending needs a
 * Firebase project (google-services.json) + APNs key + an FCM/APNs send path.
 * The `keys.platform` marker lets that future send path route native tokens.
 */
export async function registerNativePush(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt") perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") return;

    PushNotifications.addListener("registration", async (token) => {
      try {
        const me = await User.me().catch(() => null);
        const platform = Capacitor.getPlatform(); // 'ios' | 'android'
        const existing = me ? await PushSub.filter({ user_id: me.id }).catch(() => []) : [];
        if (!existing.some((e: any) => e.endpoint === token.value)) {
          await PushSub.create({
            user_id: me?.id,
            endpoint: token.value, // native FCM/APNs registration token
            keys: { platform },    // transport marker for the (future) native send path
            user_agent: `native-${platform}`,
          } as any);
        }
      } catch { /* ignore */ }
    });

    PushNotifications.addListener("registrationError", (e) => console.warn("Native push registration error", e));

    // Tapping a native notification → deep-link into the app.
    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const url = (action.notification?.data as any)?.url;
      if (url) window.location.assign(url);
    });

    await PushNotifications.register();
  } catch { /* plugin unavailable */ }
}
