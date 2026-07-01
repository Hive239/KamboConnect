import { useState } from "react";
import { Link } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { createPageUrl } from "@/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Leaf, AlertTriangle, Loader2, CheckCircle, GoogleLogo,
  ArrowLeft, ShieldCheck, Sparkle, Users, Star,
} from "@/lib/icons";
import { useSeo } from "@/lib/useSeo";
import { getAcquisition } from "@/lib/acquisition";

export default function Auth() {
  useSeo({ title: "Sign in — KamboGuide" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const done = () => { window.location.assign("/Directory"); };

  const forgotPassword = async () => {
    setError(""); setNotice("");
    if (!supabase) { setError("Supabase is not configured."); return; }
    if (!email) { setError("Enter your email above first, then click reset."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/ResetPassword` });
      if (error) throw error;
      setNotice("Password reset email sent — check your inbox.");
    } catch (err: any) {
      setError(err?.message || "Could not send reset email.");
    } finally { setBusy(false); }
  };

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
        if (!agreed) { setError("Please agree to the Terms and Privacy Policy to continue."); setBusy(false); return; }
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
        if (error) throw error;
        if (data.session) {
          try { await User.create({ id: data.user!.id, email, full_name: fullName || email.split("@")[0], role: "client", acquisition: getAcquisition() } as any); } catch { /* ensured on load too */ }
          window.location.assign("/Welcome");
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
    <ThemeProvider attribute="class" forcedTheme="light">
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#0b3a2a] text-white grain">
        {/* ---------- Vibrant animated background ---------- */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f4a33] via-[#0b3a2a] to-[#07271d]" />
          {/* aurora blobs */}
          <div className="absolute -left-[12%] -top-[15%] h-[60vh] w-[60vh] rounded-full bg-clay/50 blur-3xl animate-aurora" />
          <div className="absolute -right-[10%] top-[8%] h-[52vh] w-[52vh] rounded-full bg-success/45 blur-3xl animate-aurora" style={{ animationDelay: "-5s" }} />
          <div className="absolute bottom-[-18%] left-[20%] h-[55vh] w-[55vh] rounded-full bg-info/40 blur-3xl animate-aurora" style={{ animationDelay: "-9s" }} />
          <div className="absolute right-[14%] bottom-[6%] h-[40vh] w-[40vh] rounded-full bg-warning/30 blur-3xl animate-aurora" style={{ animationDelay: "-13s" }} />
          <div className="absolute left-1/2 top-1/3 h-[45vh] w-[45vh] -translate-x-1/2 rounded-full bg-primary/40 blur-3xl animate-aurora" style={{ animationDelay: "-3s" }} />
          {/* vignette for focus */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.35)_100%)]" />
        </div>

        {/* ---------- Top bar ---------- */}
        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur">
              <Leaf className="h-5 w-5 text-white" weight="duotone" />
            </span>
            KamboGuide
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur transition-colors hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </header>

        {/* ---------- Body ---------- */}
        <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-5 py-8 lg:grid-cols-2">
          {/* Left: welcome copy (desktop) */}
          <div className="hidden lg:block">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
              <Sparkle className="h-4 w-4" weight="fill" /> Welcome back
            </span>
            <h1 className="mt-6 font-display text-display font-semibold leading-tight text-balance">
              Your journey to a safe, guided practice continues.
            </h1>
            <p className="mt-4 max-w-md text-lg text-white/80 text-pretty">
              Sign in to message practitioners, manage bookings, and pick up right where you left off.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                { icon: ShieldCheck, title: "Verified & safe", body: "Screening and informed consent on every booking." },
                { icon: Sparkle, title: "Your personal Guide", body: "Matches and answers, tailored to you." },
                { icon: Users, title: "A warm community", body: "Learn and integrate with people on the path." },
              ].map((f) => (
                <li key={f.title} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                    <f.icon className="h-5 w-5 text-white" weight="duotone" />
                  </span>
                  <div>
                    <p className="font-semibold">{f.title}</p>
                    <p className="text-sm text-white/70">{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <figure className="mt-10 max-w-md rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <div className="mb-2 flex gap-0.5 text-warning">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-warning" weight="fill" />)}
              </div>
              <blockquote className="text-sm text-white/90">"The Guide answered every safety question before I ever booked. I finally felt in control."</blockquote>
              <figcaption className="mt-2 text-xs text-white/60">Priya N. · Member</figcaption>
            </figure>
          </div>

          {/* Right: auth card */}
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-white/40 bg-white/95 p-6 text-foreground shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Leaf className="h-6 w-6 text-primary" weight="duotone" />
                </div>
                <h2 className="font-display text-2xl font-semibold">Welcome to KamboGuide</h2>
                <p className="text-sm text-muted-foreground">Sign in or create an account to continue.</p>
              </div>

              {!isSupabaseConfigured && (
                <Alert variant="destructive" className="mb-4"><AlertTriangle className="h-4 w-4" /><AlertDescription>Supabase isn't configured — set VITE_SUPABASE_* in .env.</AlertDescription></Alert>
              )}

              <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
                <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted p-1">
                  <TabsTrigger value="signin" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Sign in</TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Sign up</TabsTrigger>
                </TabsList>

                {notice && <Alert className="mt-4"><CheckCircle className="h-4 w-4" /><AlertDescription>{notice}</AlertDescription></Alert>}
                {error && <Alert variant="destructive" className="mt-4"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

                <div className="mt-5">
                  <Button type="button" variant="outline" size="lg" className="w-full gap-2" disabled={busy} onClick={() => signInWithProvider("google")}>
                    <GoogleLogo className="h-4 w-4" weight="bold" /> Continue with Google
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
                    {mode === "signin" && (
                      <button type="button" onClick={forgotPassword} className="mt-1.5 text-xs text-primary hover:underline">Forgot password?</button>
                    )}
                  </div>
                  <TabsContent value="signup" className="m-0">
                    <label className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-0.5" />
                      <span>I agree to the <Link to={createPageUrl("Terms")} target="_blank" className="text-primary hover:underline">Terms</Link> and <Link to={createPageUrl("Privacy")} target="_blank" className="text-primary hover:underline">Privacy Policy</Link>.</span>
                    </label>
                  </TabsContent>
                  <Button type="submit" size="lg" className="w-full gap-2" disabled={busy}>
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {mode === "signin" ? "Sign in" : "Create account"}
                  </Button>
                </form>
              </Tabs>
            </div>

            <p className="mt-5 text-center text-sm text-white/70">
              New here?{" "}
              <button onClick={() => setMode("signup")} className="font-semibold text-white underline-offset-4 hover:underline">Create a free account</button>
            </p>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
