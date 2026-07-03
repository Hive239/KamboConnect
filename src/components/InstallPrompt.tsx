import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "@/lib/icons";

const DISMISS_KEY = "kg_install_dismissed";

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;

/**
 * Dismissible "Install app" prompt. Uses `beforeinstallprompt` on Android/desktop
 * Chromium; on iOS Safari (no such event) it shows an Add-to-Home-Screen hint.
 * Hidden when already installed or inside the native (Capacitor) shell.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return;
    if ((window as any).Capacitor?.isNativePlatform?.()) return; // native app → no web install UI

    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e); setShow(true); };
    const onInstalled = () => { setShow(false); localStorage.setItem(DISMISS_KEY, "1"); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    let t: any;
    const safari = /safari/i.test(navigator.userAgent) && !/crios|fxios|android/i.test(navigator.userAgent);
    if (isIos() && safari) t = setTimeout(() => { setIosHint(true); setShow(true); }, 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (t) clearTimeout(t);
    };
  }, []);

  const dismiss = () => { setShow(false); localStorage.setItem(DISMISS_KEY, "1"); };
  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch { /* ignore */ }
    setDeferred(null);
    dismiss();
  };

  if (!show) return null;

  return (
    <div className="safe-b fixed inset-x-0 bottom-16 z-[70] mx-auto max-w-md px-3 md:bottom-4">
      <div className="glass flex items-center gap-3 rounded-2xl border border-border p-3 shadow-xl">
        <img src="/pwa-192x192.png" alt="" className="h-10 w-10 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install KamboGuide</p>
          <p className="text-xs text-muted-foreground">
            {iosHint ? "Tap Share, then “Add to Home Screen”." : "Add it to your home screen for a full-screen app."}
          </p>
        </div>
        {!iosHint && <Button size="sm" onClick={install}>Install</Button>}
        <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
