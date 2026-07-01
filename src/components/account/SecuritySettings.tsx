import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@/entities/all";
import { updateCurrentUser } from "@/data/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Lock, Trash2, Loader2 } from "@/lib/icons";
import { toast } from "sonner";

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

  const signOut = async () => { await User.logout(); window.location.assign("/"); };

  const deleteAccount = async () => {
    if (!confirm("Delete your account? Your profile will be deactivated and you'll be signed out. This cannot be undone.")) return;
    setBusy(true);
    try {
      try { await updateCurrentUser({ status: "deleted" }); } catch { /* best effort */ }
      await User.logout();
      toast.success("Account deactivated.");
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

        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          <Button variant="outline" onClick={signOut} className="gap-2"><LogOut className="h-4 w-4" /> Sign out</Button>
          <Button variant="ghost" onClick={deleteAccount} disabled={busy} className="gap-2 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /> Delete account</Button>
        </div>
      </CardContent>
    </Card>
  );
}
