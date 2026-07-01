import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { User } from "@/entities/all";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Leaf, AlertTriangle, Loader2, CheckCircle, GoogleLogo, GithubLogo } from "@/lib/icons";
import { useSeo } from "@/lib/useSeo";

export default function Auth() {
  useSeo({ title: "Sign in — KamboGuide" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const done = () => { window.location.assign("/Directory"); };

  const signInWithProvider = async (provider: "google" | "github") => {
    setError(""); setNotice("");
    if (!supabase) { setError("Supabase is not configured."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/Directory` },
      });
      if (error) throw error;
      // On success the browser redirects to the provider; nothing else to do here.
    } catch (err: any) {
      setError(err?.message || `Could not sign in with ${provider}.`);
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setNotice("");
    if (!supabase) { setError("Supabase is not configured."); return; }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        done();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
        if (error) throw error;
        if (data.session) {
          // Email confirmation disabled → session active; create profile now.
          try { await User.create({ id: data.user!.id, email, full_name: fullName || email.split("@")[0], role: "user" } as any); } catch { /* ensured on load too */ }
          done();
        } else {
          setNotice("Account created. Check your email to confirm, then sign in.");
          setMode("signin");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center p-6">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Leaf className="h-6 w-6 text-primary" weight="duotone" />
        </div>
        <h1 className="font-display text-2xl font-semibold">Welcome to KamboGuide</h1>
        <p className="text-sm text-muted-foreground">Sign in or create an account to continue.</p>
      </div>

      {!isSupabaseConfigured && (
        <Alert variant="destructive" className="mb-4"><AlertTriangle className="h-4 w-4" /><AlertDescription>Supabase isn't configured — set VITE_SUPABASE_* in .env.</AlertDescription></Alert>
      )}

      <Card>
        <CardContent className="p-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-xl">
              <TabsTrigger value="signin" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Sign in</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Sign up</TabsTrigger>
            </TabsList>

            {notice && <Alert className="mt-4"><CheckCircle className="h-4 w-4" /><AlertDescription>{notice}</AlertDescription></Alert>}
            {error && <Alert variant="destructive" className="mt-4"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

            <div className="mt-5 space-y-2">
              <Button type="button" variant="outline" className="w-full gap-2" disabled={busy} onClick={() => signInWithProvider("google")}>
                <GoogleLogo className="h-4 w-4" weight="bold" /> Continue with Google
              </Button>
              <Button type="button" variant="outline" className="w-full gap-2" disabled={busy} onClick={() => signInWithProvider("github")}>
                <GithubLogo className="h-4 w-4" weight="fill" /> Continue with GitHub
              </Button>
            </div>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or use email <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={submit} className="space-y-4">
              <TabsContent value="signup" className="m-0 space-y-4">
                <div>
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="mt-1" />
                </div>
              </TabsContent>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
