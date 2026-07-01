import { useEffect, useState } from "react";
import { ClientRecord, Booking, Consultation, ScreeningResponse, ConsentRecord, ClientDocument, ConsultationNote } from "@/entities/all";
import { upsertClientRecord } from "@/lib/fileWaiver";
import { openDoc } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, FileText, ClipboardText, CheckCircle, Loader2, Mail, Phone } from "@/lib/icons";
import { formatDate } from "@/lib/format";

/** Practitioner CRM: client roster + per-client history/intake/waiver/notes/documents. */
export default function ClientsManagement({ practitioner }: { practitioner: any }) {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    if (!practitioner) return;
    const [records, bookings] = await Promise.all([
      ClientRecord.filter({ practitioner_id: practitioner.id }, "-last_seen"),
      Booking.filter({ practitioner_id: practitioner.id }, "-created_date"),
    ]);
    // Backfill: ensure every booking's client shows up even without a CRM row yet.
    const byKey = new Map<string, any>();
    records.forEach((r: any) => byKey.set(r.client_id || r.client_email, r));
    bookings.forEach((b: any) => {
      const key = b.client_id || b.client_email;
      if (key && !byKey.has(key)) {
        byKey.set(key, { id: `virtual-${key}`, virtual: true, practitioner_id: practitioner.id, client_id: b.client_id, client_name: b.client_name, client_email: b.client_email, client_phone: b.client_phone, last_seen: b.created_date });
      }
    });
    setClients([...byKey.values()]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [practitioner?.id]);

  if (loading) return <div className="py-8 text-muted-foreground">Loading clients…</div>;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" weight="duotone" />
        <h2 className="font-semibold">Clients ({clients.length})</h2>
      </div>
      {clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">No clients yet. They'll appear here after their first consultation or booking.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {clients.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(c)}>
              <CardContent className="flex items-center gap-3 p-4">
                <Avatar className="h-10 w-10"><AvatarFallback>{(c.client_name || "?")[0]}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.client_name || "Client"}</p>
                  <p className="truncate text-sm text-muted-foreground">{c.client_email}</p>
                </div>
                {c.last_seen && <span className="text-xs text-muted-foreground">{formatDate(c.last_seen)}</span>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <ClientDrawer practitioner={practitioner} client={selected} onClose={() => { setSelected(null); load(); }} />
      )}
    </div>
  );
}

function ClientDrawer({ practitioner, client, onClose }: { practitioner: any; client: any; onClose: () => void }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [consults, setConsults] = useState<any[]>([]);
  const [screenings, setScreenings] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const cid = client.client_id;
  const email = client.client_email;

  const load = async () => {
    const [bk, co, sc, cs, dc, nt] = await Promise.all([
      Booking.filter({ practitioner_id: practitioner.id }).then((r: any[]) => r.filter((b) => b.client_id === cid || b.client_email === email)),
      Consultation.filter({ practitioner_id: practitioner.id }).then((r: any[]) => r.filter((c) => c.client_id === cid || c.client_email === email)),
      cid ? ScreeningResponse.filter({ practitioner_id: practitioner.id, user_id: cid }) : Promise.resolve([]),
      cid ? ConsentRecord.filter({ practitioner_id: practitioner.id, user_id: cid }) : Promise.resolve([]),
      cid ? ClientDocument.filter({ practitioner_id: practitioner.id, client_id: cid }) : Promise.resolve([]),
      cid ? ConsultationNote.filter({ practitioner_id: practitioner.id, client_id: cid }, "-created_date") : Promise.resolve([]),
    ]);
    setBookings(bk); setConsults(co); setScreenings(sc); setConsents(cs); setDocs(dc); setNotes(nt);
  };
  useEffect(() => { load(); }, [client?.id]);

  const addNote = async () => {
    if (!noteDraft.trim()) return;
    setBusy(true);
    try {
      // Ensure a real CRM row exists (in case this was a virtual/backfilled client).
      if (client.virtual) await upsertClientRecord({ practitionerId: practitioner.id, clientId: cid, clientName: client.client_name, clientEmail: email, clientPhone: client.client_phone });
      await ConsultationNote.create({ practitioner_id: practitioner.id, client_id: cid, body: noteDraft.trim() });
      setNoteDraft("");
      load();
    } finally { setBusy(false); }
  };

  const latestScreening = screenings[0];
  const latestWaiver = consents.find((c) => c.document_url) || consents[0];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10"><AvatarFallback>{(client.client_name || "?")[0]}</AvatarFallback></Avatar>
            {client.client_name || "Client"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          <div className="flex flex-wrap gap-4 text-muted-foreground">
            {email && <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {email}</span>}
            {client.client_phone && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {client.client_phone}</span>}
          </div>

          {/* Waiver + screening */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3">
              <p className="mb-1 flex items-center gap-1.5 font-medium"><FileText className="h-4 w-4 text-primary" weight="duotone" /> Signed waiver</p>
              {latestWaiver ? (
                <>
                  <p className="text-xs text-muted-foreground">{latestWaiver.waiver_version || latestWaiver.document_version} · {latestWaiver.agreed_at ? formatDate(latestWaiver.agreed_at) : ""}</p>
                  {latestWaiver.document_url
                    ? <button type="button" onClick={() => openDoc(latestWaiver.document_url)} className="text-primary hover:underline">View PDF</button>
                    : <span className="text-xs text-muted-foreground">Signed (no PDF)</span>}
                </>
              ) : <p className="text-xs text-muted-foreground">Not yet signed.</p>}
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="mb-1 flex items-center gap-1.5 font-medium"><ClipboardText className="h-4 w-4 text-primary" weight="duotone" /> Health screening</p>
              {latestScreening ? (
                <>
                  {latestScreening.flagged
                    ? <Badge variant="warning" className="gap-1"><ClipboardText className="h-3 w-3" /> Flags to review</Badge>
                    : <Badge variant="verified" className="gap-1"><CheckCircle className="h-3 w-3" weight="fill" /> Clear</Badge>}
                  {latestScreening.notes && <p className="mt-1 text-xs text-muted-foreground">{latestScreening.notes}</p>}
                </>
              ) : <p className="text-xs text-muted-foreground">No screening on file.</p>}
            </div>
          </div>

          {/* History */}
          <div>
            <p className="mb-2 font-medium">History</p>
            <div className="space-y-1.5">
              {consults.map((c) => <div key={c.id} className="flex justify-between rounded-md bg-muted/50 px-3 py-2"><span>Consultation · {c.status}</span><span className="text-muted-foreground">{c.requested_time ? formatDate(c.requested_time) : (c.created_date ? formatDate(c.created_date) : "")}</span></div>)}
              {bookings.map((b) => <div key={b.id} className="flex justify-between rounded-md bg-muted/50 px-3 py-2"><span>{b.service_type || "Session"} · {b.status}</span><span className="text-muted-foreground">{b.requested_date ? formatDate(b.requested_date) : ""}</span></div>)}
              {consults.length + bookings.length === 0 && <p className="text-xs text-muted-foreground">No sessions yet.</p>}
            </div>
          </div>

          {/* Documents */}
          {docs.length > 0 && (
            <div>
              <p className="mb-2 font-medium">Documents</p>
              <div className="space-y-1.5">
                {docs.map((d) => <button type="button" key={d.id} onClick={() => openDoc(d.file_url)} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-left hover:bg-muted"><FileText className="h-4 w-4" /> {d.title || d.kind}</button>)}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="mb-2 font-medium">Private notes</p>
            <div className="space-y-2">
              {notes.map((n) => <div key={n.id} className="rounded-md border border-border p-2.5"><p>{n.body}</p><p className="mt-1 text-xs text-muted-foreground">{n.created_date ? formatDate(n.created_date) : ""}</p></div>)}
            </div>
            <Textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Add a private note about this client…" className="mt-2 min-h-[70px]" />
            <div className="mt-2 flex justify-end">
              <Button size="sm" onClick={addNote} disabled={busy || !noteDraft.trim()} className="gap-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Add note</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
