import { useEffect, useState } from "react";
import { Credential } from "@/entities/all";
import { UploadPrivateFile } from "@/integrations/Core";
import { openDoc } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, ShieldCheck, Trash2, Loader2, Plus } from "@/lib/icons";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

const TYPES = [
  { value: "kambo", label: "Kambo Certification" },
  { value: "cpr", label: "CPR" },
  { value: "first_aid", label: "First Aid" },
  { value: "insurance", label: "Insurance" },
  { value: "training", label: "Training" },
  { value: "other", label: "Other" },
];
const STATUS_VARIANT: Record<string, any> = { verified: "verified", pending: "warning", rejected: "destructive", expired: "secondary" };

/** Practitioner credential management — add/manage Credential records (upgrade #5/#8). */
export default function CredentialManagement({ practitioner }: { practitioner: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<any>({ type: "kambo", title: "", issuer: "", issued_date: "", expiry_date: "" });
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    if (!practitioner) return;
    setItems(await Credential.filter({ practitioner_id: practitioner.id }, "-created_date"));
    setLoading(false);
  };
  useEffect(() => { load(); }, [practitioner?.id]);

  const add = async () => {
    if (!form.title.trim()) { toast.error("Add a title"); return; }
    setBusy(true);
    try {
      let file_uri: string | undefined;
      if (file) file_uri = (await UploadPrivateFile({ file })).file_uri;
      await Credential.create({ ...form, practitioner_id: practitioner.id, file_uri, status: "pending" });
      setForm({ type: "kambo", title: "", issuer: "", issued_date: "", expiry_date: "" });
      setFile(null);
      toast.success("Credential submitted for review");
      load();
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => { await Credential.delete(id); load(); };

  if (loading) return <div className="py-8 text-muted-foreground">Loading credentials…</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-3 p-4">
          <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-primary" weight="duotone" /> Add a credential</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. IAKP Practitioner" /></div>
            <div><Label>Issuer</Label><Input value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} placeholder="Issuing body" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Issued</Label><Input type="date" value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} /></div>
              <div><Label>Expires</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
            </div>
          </div>
          <div>
            <Label>Document (private)</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={add} disabled={busy} className="gap-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" weight="bold" />} Submit for review</Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 font-semibold">Your credentials ({items.length})</h2>
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-muted-foreground">No credentials yet.</div>
        ) : (
          <div className="space-y-3">
            {items.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <FileText className="h-8 w-8 shrink-0 text-muted-foreground" weight="duotone" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{c.title}</span>
                      <Badge variant={STATUS_VARIANT[c.status] || "secondary"} className="capitalize">{c.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {TYPES.find((t) => t.value === c.type)?.label || c.type}{c.issuer ? ` · ${c.issuer}` : ""}
                      {c.expiry_date ? ` · expires ${formatDate(c.expiry_date)}` : ""}
                    </p>
                  </div>
                  {c.file_uri && <button type="button" onClick={() => openDoc(c.file_uri)} className="text-sm text-primary hover:underline">View</button>}
                  <button onClick={() => remove(c.id)} aria-label="Delete credential"><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
