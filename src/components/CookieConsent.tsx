import { useEffect, useState } from "react";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Info as Cookie } from "@/lib/icons";

const KEY = "kc_cookie_consent";

/** Minimal GDPR/CCPA-style cookie-consent banner (persisted, shown once). */
export default function CookieConsent() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setShow(true); } catch { /* ignore */ }
  }, []);
  const decide = (value: "accepted" | "essential") => {
    try { localStorage.setItem(KEY, value); } catch { /* ignore */ }
    setShow(false);
  };
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-border bg-card/95 p-4 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Cookie className="hidden h-6 w-6 shrink-0 text-primary sm:block" weight="duotone" />
        <p className="flex-1 text-sm text-muted-foreground">
          We use cookies to keep you signed in, remember preferences, and understand usage. See our{" "}
          <a href={createPageUrl("Privacy")} className="text-primary hover:underline">Privacy Policy</a>.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => decide("essential")}>Essential only</Button>
          <Button size="sm" onClick={() => decide("accepted")}>Accept all</Button>
        </div>
      </div>
    </div>
  );
}
