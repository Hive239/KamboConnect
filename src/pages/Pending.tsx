import { useEffect, useState } from "react";
import { User } from "@/entities/all";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, ShieldCheck, LogOut } from "@/lib/icons";

/** Awaiting-approval / rejected / suspended screen for signed-in-but-unapproved users. */
export default function Pending() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { User.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);

  // If they're actually approved, don't strand them here.
  useEffect(() => {
    if (user && (!user.status || user.status === "active")) window.location.assign("/");
  }, [user]);

  const status = user?.status || "pending";
  const signOut = async () => { await User.logout(); window.location.assign(createPageUrl("Auth")); };

  const copy = {
    pending: { icon: Clock, tone: "text-primary", title: "Your account is awaiting approval", body: "Thanks for signing up! An admin is reviewing your account. You'll get an email as soon as you're approved — then you can sign in and start using KamboGuide." },
    rejected: { icon: XCircle, tone: "text-destructive", title: "Your application wasn't approved", body: "Unfortunately your account wasn't approved at this time. If you believe this is a mistake, please reach out to our support team." },
    suspended: { icon: ShieldCheck, tone: "text-warning", title: "Your account is suspended", body: "Your access is temporarily suspended. Please contact support if you have questions." },
    banned: { icon: XCircle, tone: "text-destructive", title: "Your account has been disabled", body: "This account no longer has access to KamboGuide." },
  }[status] || { icon: Clock, tone: "text-primary", title: "Awaiting approval", body: "An admin is reviewing your account." };

  const Icon = copy.icon;
  if (loading) return <div className="flex min-h-screen items-center justify-center"><Clock className="h-6 w-6 animate-pulse text-muted-foreground" /></div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ${copy.tone}`}>
          <Icon className="h-8 w-8" weight="duotone" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">{copy.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{copy.body}</p>
        {status === "pending" && (
          <div className="mt-5 space-y-2 rounded-lg border border-border bg-muted/50 p-3 text-left text-xs text-muted-foreground">
            <p className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-success" /> Account created</p>
            <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-primary" /> Awaiting admin review</p>
            <p className="flex items-center gap-2 opacity-50"><CheckCircle className="h-3.5 w-3.5" /> Access granted</p>
          </div>
        )}
        <Button variant="outline" className="mt-6 w-full gap-2" onClick={signOut}><LogOut className="h-4 w-4" /> Sign out</Button>
      </div>
    </div>
  );
}
