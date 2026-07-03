import { useEffect, useState } from "react";
import { User, Practitioner } from "@/entities/all";
import { notify } from "@/lib/notify";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, UserCircle } from "@/lib/icons";
import { toast } from "sonner";

/** Admin queue: approve/reject new CLIENT signups (status='pending').
 *  Practitioner applicants are excluded here — they're reviewed in the Verification tab. */
export default function ClientApprovals() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [users, pracs] = await Promise.all([
        User.filter({ status: "pending" }, "-created_date").catch(() => []),
        Practitioner.filter({ verification_level: "pending" }).catch(() => []),
      ]);
      const pracIds = new Set((pracs || []).map((p: any) => p.id));
      setPending((users || []).filter((u: any) => !pracIds.has(u.id))); // clients only
    } catch { setPending([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const decide = async (u: any, approve: boolean) => {
    setBusyId(u.id);
    try {
      await User.update(u.id, { status: approve ? "active" : "rejected" });
      await notify({
        userId: u.id, userEmail: u.email, type: "system",
        title: approve ? "Your KamboGuide account is approved" : "Your KamboGuide account wasn't approved",
        body: approve
          ? "Welcome! Your account has been approved — sign in to start finding verified practitioners."
          : "Thanks for your interest. Your account wasn't approved at this time. Contact support if you have questions.",
        link: approve ? "/Directory" : "/", email: true,
      }).catch(() => {});
      toast.success(approve ? "Client approved." : "Client rejected.");
      setPending((prev) => prev.filter((x) => x.id !== u.id));
    } catch { toast.error("Could not update this signup."); }
    finally { setBusyId(null); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Pending client signups ({pending.length})</h3>
        <p className="text-xs text-muted-foreground">Practitioner applications are reviewed in the Verification tab.</p>
      </div>
      {pending.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No client signups awaiting approval.</CardContent></Card>
      ) : (
        pending.map((u) => (
          <Card key={u.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><UserCircle className="h-6 w-6 text-primary" /></div>
                <div>
                  <p className="font-medium">{u.full_name || "—"} <Badge variant="secondary" className="ml-1">client</Badge></p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" disabled={busyId === u.id} onClick={() => decide(u, false)}><XCircle className="mr-1 h-4 w-4" /> Reject</Button>
                <Button size="sm" disabled={busyId === u.id} onClick={() => decide(u, true)}><CheckCircle className="mr-1 h-4 w-4" /> Approve</Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
