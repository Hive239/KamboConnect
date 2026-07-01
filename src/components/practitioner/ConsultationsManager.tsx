import { useEffect, useState } from "react";
import { Consultation } from "@/entities/all";
import { convertConsultationToBooking } from "@/lib/consultations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Check, X, ArrowRight } from "@/lib/icons";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

const STATUS_VARIANT: Record<string, any> = { requested: "warning", scheduled: "info", completed: "verified", declined: "destructive", converted: "secondary" };

/** Practitioner-side consultation queue: schedule → complete → convert to booking. */
export default function ConsultationsManager({ practitioner }: { practitioner: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    if (!practitioner) return;
    setItems(await Consultation.filter({ practitioner_id: practitioner.id }, "-created_date"));
    setLoading(false);
  };
  useEffect(() => { load(); }, [practitioner?.id]);

  const setStatus = async (c: any, status: string) => {
    setBusy(c.id);
    try { await Consultation.update(c.id, { status }); load(); } finally { setBusy(null); }
  };
  const convert = async (c: any) => {
    setBusy(c.id);
    try { await convertConsultationToBooking(c, practitioner); toast.success("Converted to a booking — client will sign the waiver & pay."); load(); }
    finally { setBusy(null); }
  };

  if (loading) return null;
  const active = items.filter((c) => c.status !== "converted" && c.status !== "declined");
  if (active.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="mb-3 flex items-center gap-2 font-semibold"><MessageSquare className="h-5 w-5 text-primary" weight="duotone" /> Consultation requests ({active.length})</h3>
      <div className="space-y-3">
        {active.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.client_name || "Client"}</span>
                  <Badge variant={STATUS_VARIANT[c.status] || "secondary"} className="capitalize">{c.status}</Badge>
                </div>
                {c.message && <p className="truncate text-sm text-muted-foreground">{c.message}</p>}
                <p className="text-xs text-muted-foreground">{c.created_date ? formatDate(c.created_date) : ""}</p>
              </div>
              <div className="flex gap-2">
                {c.status === "requested" && <>
                  <Button size="sm" variant="outline" disabled={busy === c.id} onClick={() => setStatus(c, "scheduled")} className="gap-1"><Check className="h-4 w-4" /> Accept</Button>
                  <Button size="sm" variant="ghost" disabled={busy === c.id} onClick={() => setStatus(c, "declined")} className="gap-1 text-destructive"><X className="h-4 w-4" /> Decline</Button>
                </>}
                {c.status === "scheduled" && <Button size="sm" variant="outline" disabled={busy === c.id} onClick={() => setStatus(c, "completed")}>Mark completed</Button>}
                {(c.status === "scheduled" || c.status === "completed") && <Button size="sm" disabled={busy === c.id} onClick={() => convert(c)} className="gap-1">Convert to booking <ArrowRight className="h-4 w-4" /></Button>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
