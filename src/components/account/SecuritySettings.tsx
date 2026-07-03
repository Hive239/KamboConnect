import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, Booking, Consultation, Order, Payment, ConsentRecord, ScreeningResponse, Favorite, Review, Notification, Message } from "@/entities/all";
import { updateCurrentUser } from "@/data/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Lock, Trash2, Loader2, Download, Bell } from "@/lib/icons";
import { toast } from "sonner";

/** Gather everything this user owns into one JSON export (GDPR-style). */
async function collectMyData(user: any) {
  const uid = user.id;
  const f = (p: Promise<any>) => p.catch(() => []);
  const [bookings, consultations, orders, payments, consents, screenings, favorites, reviews, notifications, sent] = await Promise.all([
    f(Booking.filter({ client_id: uid })), f(Consultation.filter({ client_id: uid })),
    f(Order.filter({ user_id: uid })), f(Payment.filter({ user_id: uid })),
    f(ConsentRecord.filter({ user_id: uid })), f(ScreeningResponse.filter({ user_id: uid })),
    f(Favorite.filter({ user_id: uid })), f(Review.filter({ user_id: uid })),
    f(Notification.filter({ user_id: uid })), f(Message.filter({ sender_id: uid })),
  ]);
  return { exported_at: new Date().toISOString(), profile: user, bookings, consultations, orders, payments, consents, screenings, favorites, reviews, notifications, messages_sent: sent };
}

/** Account security: change password, sign out, delete account. */
export default function SecuritySettings() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { toast.error("Not available."); return; }
    if (pw.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setPw("");
      toast.success("Password updated.");
    } catch (err: any) { toast.error(err?.message || "Could not update password."); }
    finally { setBusy(false); }
  };

  // NB: use window.Notification — the bare `Notification` is the imported entity, which shadows the browser API.
  const [notifState, setNotifState] = useState<string>(
    typeof window !== "undefined" && "Notification" in window ? window.Notification.permission : "default",
  );
  const enableNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) { toast.error("Notifications not supported in this browser."); return; }
    const p = await window.Notification.requestPermission();
    setNotifState(p);
    if (p === "granted") { new window.Notification("KamboGuide", { body: "Notifications enabled." }); toast.success("Browser notifications enabled."); }
    else toast.error("Notifications blocked — enable them in your browser settings.");
  };

  const signOut = async () => { await User.logout(); window.location.assign("/"); };

  const exportData = async () => {
    setBusy(true);
    try {
      const me = await User.me();
      if (!me) { toast.error("Not signed in."); return; }
      const data = await collectMyData(me);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `kamboguide-my-data-${me.id}.json`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Your data has been downloaded.");
    } finally { setBusy(false); }
  };

  const deleteAccount = async () => {
    if (!confirm("Permanently delete your account and data? This cannot be undone.")) return;
    setBusy(true);
    try {
      const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } as any };
      const token = data?.session?.access_token;
      let hardDeleted = false;
      // Try the serverless hard-delete (removes the auth user + owned rows via service role).
      try {
        const r = await fetch("/api/delete-account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ access_token: token }) });
        hardDeleted = r.ok;
      } catch { /* falls back to soft delete */ }
      if (!hardDeleted) { try { await updateCurrentUser({ status: "deleted" }); } catch { /* best effort */ } }
      await User.logout();
      toast.success("Account deleted.");
      window.location.assign("/");
    } finally { setBusy(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>Manage your password and account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={changePassword} className="space-y-3">
          <Label htmlFor="newpw" className="flex items-center gap-2"><Lock className="h-4 w-4" /> Change password</Label>
          <div className="flex gap-2">
            <Input id="newpw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" minLength={6} />
            <Button type="submit" disabled={busy || !pw}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}</Button>
          </div>
        </form>

        <div className="border-t border-border pt-4">
          <Label className="flex items-center gap-2"><Bell className="h-4 w-4" /> Browser notifications</Label>
          <p className="mb-2 mt-1 text-sm text-muted-foreground">Get desktop alerts for new messages, bookings, and reviews.</p>
          <Button variant="outline" size="sm" onClick={enableNotifications} className="gap-2">
            <Bell className="h-4 w-4" /> {notifState === "granted" ? "Notifications on" : "Enable notifications"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          <Button variant="outline" onClick={exportData} disabled={busy} className="gap-2"><Download className="h-4 w-4" /> Download my data</Button>
          <Button variant="outline" onClick={signOut} className="gap-2"><LogOut className="h-4 w-4" /> Sign out</Button>
          <Button variant="ghost" onClick={deleteAccount} disabled={busy} className="gap-2 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /> Delete account</Button>
        </div>
      </CardContent>
    </Card>
  );
}
