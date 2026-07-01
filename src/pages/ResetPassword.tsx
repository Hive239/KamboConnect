import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Leaf, AlertTriangle, CheckCircle, Loader2 } from "@/lib/icons";
import { useSeo } from "@/lib/useSeo";

/** Set a new password after following the recovery email link (Supabase sets a session). */
export default function ResetPassword() {
  useSeo({ title: "Reset password — KamboGuide" });
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    // The recovery link puts a session in the URL hash; supabase-js consumes it.
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { if (session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!supabase) { setError("Supabase not configured."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => window.location.assign("/Directory"), 1500);
    } catch (err: any) {
      setError(err?.message || "Could not update password.");
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><Leaf className="h-6 w-6 text-primary" weight="duotone" /></div>
        <h1 className="font-display text-2xl font-semibold">Set a new password</h1>
      </div>
      <Card>
        <CardContent className="p-6">
          {done ? (
            <Alert><CheckCircle className="h-4 w-4" /><AlertDescription>Password updated. Redirecting…</AlertDescription></Alert>
          ) : !ready ? (
            <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>Open this page from the password-reset link in your email.</AlertDescription></Alert>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
              <div>
                <Label htmlFor="pw">New password</Label>
                <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Update password</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
