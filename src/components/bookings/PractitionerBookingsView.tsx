
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from 'date-fns';
import { Check, X, Mail, Phone, MoreHorizontal, Briefcase, FileText, ShieldCheck, AlertCircle, Loader2, Video } from "@/lib/icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Booking } from '@/entities/Booking';
import { ScreeningResponse, ConsentRecord } from '@/entities/all';
import { notify } from '@/lib/notify';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const IntakeDialog = ({ booking, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [screening, setScreening] = useState(null);
  const [consent, setConsent] = useState(null);

  React.useEffect(() => {
    if (!booking) return;
    let active = true;
    setLoading(true);
    Promise.all([
      ScreeningResponse.filter({ booking_id: booking.id }).catch(() => []),
      ConsentRecord.filter({ booking_id: booking.id }).catch(() => []),
    ]).then(([sr, cr]) => {
      if (!active) return;
      setScreening(sr[0] || null);
      setConsent(cr[0] || null);
      setLoading(false);
    });
    return () => { active = false; };
  }, [booking]);

  return (
    <Dialog open={!!booking} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Client Intake — {booking?.client_name}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-5 text-sm">
            <section>
              <div className="flex items-center gap-2 font-semibold">
                <FileText className="w-4 h-4 text-primary" weight="duotone" /> Health Screening
              </div>
              {screening ? (
                <ul className="mt-2 space-y-1.5">
                  {screening.answers?.map((a) => (
                    <li key={a.key} className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground">{a.question}</span>
                      <span className={`shrink-0 font-medium ${a.flag ? 'text-destructive' : 'text-foreground'}`}>
                        {a.flag && <AlertCircle className="inline w-3.5 h-3.5 mr-1 -mt-0.5" weight="fill" />}
                        {a.answer === true || a.answer === 'true' ? 'Yes' : a.answer === false || a.answer === 'false' ? 'No' : String(a.answer)}
                      </span>
                    </li>
                  ))}
                  {screening.flagged && (
                    <li className="mt-2 rounded-md bg-destructive/10 p-2 text-destructive">
                      This client flagged one or more contraindications. Review carefully before confirming.
                    </li>
                  )}
                </ul>
              ) : (
                <p className="mt-1 text-muted-foreground">No screening on file for this booking.</p>
              )}
            </section>

            {(screening?.medications?.length > 0 || screening?.interaction_flags?.length > 0) && (
              <section className="border-t border-border pt-4">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-warning" weight="duotone" /> Medications & Interactions
                </div>
                {screening.interaction_flags?.length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {screening.interaction_flags.map((f, i) => (
                      <div key={i} className={`rounded-md border px-2.5 py-1.5 text-xs ${f.severity === 'absolute' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-warning/30 bg-warning/10 text-warning'}`}>
                        <strong className="capitalize">{f.severity}: {f.medication}</strong> — {f.note}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-muted-foreground">{(screening.medications || []).join(', ') || 'None reported'}</p>
                )}
              </section>
            )}

            {screening?.emergency_contact?.name && (
              <section className="border-t border-border pt-4">
                <div className="flex items-center gap-2 font-semibold">
                  <Phone className="w-4 h-4 text-primary" weight="duotone" /> Emergency Contact
                </div>
                <p className="mt-2 text-muted-foreground">
                  <span className="font-medium text-foreground">{screening.emergency_contact.name}</span>
                  {screening.emergency_contact.relationship ? ` (${screening.emergency_contact.relationship})` : ''} · {screening.emergency_contact.phone}
                </p>
              </section>
            )}

            <section className="border-t border-border pt-4">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="w-4 h-4 text-primary" weight="duotone" /> Informed Consent
              </div>
              {consent ? (
                <div className="mt-2 space-y-1 text-muted-foreground">
                  <p><span className="text-foreground font-medium">{consent.agreed ? 'Agreed' : 'Not agreed'}</span> · v{consent.document_version}</p>
                  <p>Signed by <span className="text-foreground">{consent.signature_name}</span></p>
                  {consent.agreed_at && <p>{format(new Date(consent.agreed_at), "PPpp")}</p>}
                </div>
              ) : (
                <p className="mt-1 text-muted-foreground">No consent record on file for this booking.</p>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const StatusBadge = ({ status }) => <StatusPill status={status} />;

const PractitionerBookingsView = ({ bookings, onUpdate }) => {
  const [intakeBooking, setIntakeBooking] = useState(null);

  const updateBookingStatus = async (bookingId, status) => {
    // Safety gate: a booking cannot be confirmed until the client has signed the waiver.
    if (status === 'confirmed') {
      const consent = await ConsentRecord.filter({ booking_id: bookingId }).catch(() => []);
      const signed = consent.some((c) => c.agreed);
      if (!signed) {
        toast.error("This client hasn't signed the waiver yet — it must be signed before you can confirm.");
        return;
      }
    }
    await Booking.update(bookingId, { status });
    if (status === 'confirmed') { try { await Booking.update(bookingId, { waiver_signed: true }); } catch { /* noop */ } }

    // Notify the client of the status change across all channels (in-app + email + push).
    try {
      const bk = await Booking.get(bookingId);
      const who = bk?.practitioner_name || "your practitioner";
      const messages = {
        confirmed: { title: "Booking confirmed", body: `Your session with ${who} is confirmed.`, priority: "high", type: "booking" },
        declined: { title: "Booking update", body: `${who} was unable to confirm your requested session.`, priority: "normal", type: "booking" },
        cancelled: { title: "Booking cancelled", body: `Your session with ${who} has been cancelled.`, priority: "normal", type: "booking" },
        completed: { title: "How was your session?", body: `Share your experience with ${who} — leave a review.`, priority: "normal", type: "review" },
      };
      const m = messages[status];
      if (m && (bk?.client_id || bk?.client_email)) {
        await notify({
          userId: bk.client_id, userEmail: bk.client_email,
          type: m.type as any, title: m.title, body: m.body, priority: m.priority as any,
          relatedId: bookingId, link: createPageUrl("Bookings"),
          email: status === 'confirmed' || status === 'completed',
        });
      }
    } catch { /* non-fatal */ }
    onUpdate();
  };

  const BookingRow = ({ booking }) => (
    <TableRow>
      <TableCell>
        <div className="font-medium">{booking.client_name}</div>
        <div className="text-sm text-muted-foreground">{booking.client_email}</div>
      </TableCell>
      <TableCell>{format(new Date(booking.requested_date), "PP")}</TableCell>
      <TableCell>{booking.service_type}</TableCell>
      <TableCell><StatusBadge status={booking.status} /></TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Actions for booking with ${booking.client_name}`}><MoreHorizontal className="w-4 h-4"/></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
             {booking.status === 'confirmed' && (
               <DropdownMenuItem asChild>
                  <a href={createPageUrl(`Session?booking=${booking.id}`)} className="w-full"><Video className="w-4 h-4 mr-2"/>Join video session</a>
               </DropdownMenuItem>
             )}
             <DropdownMenuItem onClick={() => setIntakeBooking(booking)}>
                <FileText className="w-4 h-4 mr-2"/>View Intake
             </DropdownMenuItem>
             <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'confirmed')}>
                <Check className="w-4 h-4 mr-2"/>Confirm
             </DropdownMenuItem>
             <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'declined')}>
                <X className="w-4 h-4 mr-2"/>Decline
             </DropdownMenuItem>
             <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'completed')}>
                <Check className="w-4 h-4 mr-2"/>Mark as Completed
             </DropdownMenuItem>
             <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'no_show')}>
                <X className="w-4 h-4 mr-2"/>Mark No-show
             </DropdownMenuItem>
             <DropdownMenuItem asChild>
                <a href={`mailto:${booking.client_email}`} className="w-full">
                    <Mail className="w-4 h-4 mr-2"/>Email Client
                </a>
             </DropdownMenuItem>
             {booking.client_phone && (
                <DropdownMenuItem asChild>
                    <a href={`tel:${booking.client_phone}`} className="w-full">
                       <Phone className="w-4 h-4 mr-2"/>Call Client
                    </a>
                </DropdownMenuItem>
             )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  if (!bookings || bookings.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardHeader>
          <Briefcase className="w-12 h-12 mx-auto text-muted-foreground/40" />
          <CardTitle className="mt-4">You have no client bookings</CardTitle>
          <CardDescription>
            When clients request to book with you, their requests will appear here.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const filteredBookings = (status) => {
    if (status === 'archived') {
      return bookings.filter(b => b.status === 'declined' || b.status === 'cancelled' || b.status === 'completed');
    }
    return bookings.filter(b => b.status === status);
  };

  return (
    <>
    <Tabs defaultValue="pending">
      <TabsList>
        <TabsTrigger value="pending">Pending ({filteredBookings('pending').length})</TabsTrigger>
        <TabsTrigger value="confirmed">Confirmed ({filteredBookings('confirmed').length})</TabsTrigger>
        <TabsTrigger value="archived">Archived ({filteredBookings('archived').length})</TabsTrigger>
      </TabsList>
      
      {['pending', 'confirmed', 'archived'].map(status => (
        <TabsContent key={status} value={status} className="mt-4">
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Requested Date</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBookings(status).map(b => <BookingRow key={b.id} booking={b}/>)}
                    </TableBody>
                </Table>
                {filteredBookings(status).length === 0 && <p className="p-6 text-center text-muted-foreground">No {status} bookings.</p>}
            </Card>
        </TabsContent>
      ))}
    </Tabs>
    <IntakeDialog booking={intakeBooking} onClose={() => setIntakeBooking(null)} />
    </>
  );
};

export default PractitionerBookingsView;
