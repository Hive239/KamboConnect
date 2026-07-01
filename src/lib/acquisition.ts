const KEY = "kc_acq";

/** Capture first-touch acquisition (utm_* + referrer + landing) once per browser. */
export function captureAcquisition(): void {
  try {
    if (localStorage.getItem(KEY)) return;
    const p = new URLSearchParams(window.location.search);
    const utmSource = p.get("utm_source");
    const acq = {
      source: utmSource || (document.referrer ? "referral" : "direct"),
      medium: p.get("utm_medium") || undefined,
      campaign: p.get("utm_campaign") || undefined,
      referrer: document.referrer || undefined,
      landing: window.location.pathname,
      at: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify(acq));
  } catch { /* ignore */ }
}

export function getAcquisition(): Record<string, any> | null {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}
