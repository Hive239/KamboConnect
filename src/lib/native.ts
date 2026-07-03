import { Capacitor } from "@capacitor/core";
import { supabase } from "@/lib/supabase";

/**
 * Native (Capacitor) bootstrap. Completely no-ops on web — plugins are imported
 * dynamically inside the native guard so they never load in the browser bundle.
 * Called once from main.tsx.
 */
export async function initNative(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  // Status bar — match the app theme.
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    const dark = document.documentElement.classList.contains("dark");
    await StatusBar.setStyle({ style: dark ? Style.Light : Style.Dark }).catch(() => {});
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: dark ? "#0e1512" : "#2f5e46" }).catch(() => {});
    }
  } catch { /* plugin unavailable */ }

  // Hide the splash once the web app is up.
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide().catch(() => {});
  } catch { /* ignore */ }

  try {
    const { App } = await import("@capacitor/app");
    // Android hardware back → history back, or exit at the root.
    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else App.exitApp();
    });
    // Deep links (custom scheme com.kamboguide.app://…).
    App.addListener("appUrlOpen", async ({ url }) => {
      try {
        // Auth callbacks (PKCE): com.kamboguide.app://oauth?code=… (login) or
        // …://reset?code=… (password recovery). Exchange the code → session.
        if (/oauth|reset|[?&]code=/.test(url)) {
          try { const { Browser } = await import("@capacitor/browser"); await Browser.close(); } catch { /* ignore */ }
          const code = new URL(url).searchParams.get("code");
          if (code && supabase) await supabase.auth.exchangeCodeForSession(code).catch(() => {});
          window.location.assign(/reset/.test(url) ? "/ResetPassword" : "/Directory");
          return;
        }
        // Otherwise route the path/query/hash into the SPA.
        const u = new URL(url);
        const target = `${u.pathname || "/"}${u.search || ""}${u.hash || ""}`;
        if (target && target !== window.location.pathname) window.location.assign(target);
      } catch { /* malformed url */ }
    });
  } catch { /* ignore */ }

  // Native push registration (FCM/APNs) — token stored for the future send path.
  try {
    const { registerNativePush } = await import("@/lib/nativePush");
    await registerNativePush();
  } catch { /* ignore */ }
}

/** Light haptic tap for primary actions (no-op on web). */
export async function haptic(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  } catch { /* ignore */ }
}
