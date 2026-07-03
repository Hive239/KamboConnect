/**
 * DEV-ONLY floating control to sign in as any of the seeded demo accounts so we
 * can review every role-gated surface against the REAL Supabase backend (real
 * auth session → real role gating, RLS, and analytics). Gated behind
 * `import.meta.env.DEV` in App.tsx — never ships to production.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DEV_ACCOUNTS, type DevAccount } from "@/data/devAccounts";

const ROLE_TONE: Record<DevAccount["role"], string> = {
  Admin: "text-destructive",
  Practitioner: "text-primary",
  Client: "text-info",
};

export default function RoleSwitcher() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase?.auth.getSession().then(({ data }) => { if (active) setEmail(data.session?.user?.email ?? null); });
    return () => { active = false; };
  }, []);

  const switchTo = async (acct: DevAccount) => {
    if (!supabase) return;
    let password = acct.password;
    if (!password) {
      password = window.prompt(`Password for ${acct.label} (${acct.email})`) || "";
      if (!password) return;
    }
    setBusy(acct.email);
    try {
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithPassword({ email: acct.email, password });
      if (error) {
        setBusy(null);
        alert(`Sign-in failed for ${acct.label}: ${error.message}`);
        return;
      }
      window.location.href = "/"; // reload into the app with the new session/role
    } catch (e: any) {
      setBusy(null);
      alert(`Sign-in error: ${e?.message || e}`);
    }
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
    window.location.href = "/Auth";
  };

  // Only meaningful with Supabase auth wired up.
  if (!supabase) return null;

  const current = DEV_ACCOUNTS.find((a) => a.email === email);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-sans text-sm">
      {open ? (
        <div className="w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="font-semibold text-foreground">Dev · Switch role</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-muted-foreground hover:text-foreground">✕</button>
          </div>

          <div className="px-4 py-2 text-xs text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">{current ? `${current.label} · ${current.role}` : email || "nobody"}</span>
          </div>

          <div className="max-h-[60vh] space-y-1 overflow-y-auto p-2">
            {DEV_ACCOUNTS.map((a) => {
              const active = a.email === email;
              const loading = busy === a.email;
              return (
                <button
                  key={a.email}
                  onClick={() => switchTo(a)}
                  disabled={!!busy}
                  className={`block w-full rounded-xl px-3 py-2.5 text-left transition ${
                    active ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-accent"
                  } ${busy && !loading ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">{a.label}</span>
                    <span className={`text-[11px] font-semibold uppercase tracking-wide ${ROLE_TONE[a.role]}`}>
                      {loading ? "Signing in…" : active ? "● Current" : a.role}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{a.description}</div>
                </button>
              );
            })}
          </div>

          <div className="border-t border-border p-2">
            <button
              onClick={signOut}
              className="w-full rounded-xl px-3 py-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 font-medium text-foreground shadow-lg transition hover:shadow-xl"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          {current ? current.label : "Dev"}
        </button>
      )}
    </div>
  );
}
