
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from 'date-fns';
import { Check, X, Mail, Phone, MoreHorizontal, Briefcase, FileText, ShieldCheck, AlertCircle, Loader2 } from "@/lib/icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Booking } from '@/entities/Booking';
import { ScreeningResponse, ConsentRecord } from '@/entities/all';

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

const StatusBadge = ({ status }) => {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-primary/10 text-primary border-primary/20",
      declined: "bg-red-100 text-red-800 border-red-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
      cancelled: "bg-muted text-foreground border-border",
    };
    return <Badge className={statusStyles[status] || statusStyles.pending}>{status}</Badge>;
};

const PractitionerBookingsView = ({ bookings, onUpdate }) => {
  const [intakeBooking, setIntakeBooking] = useState(null);

  const updateBookingStatus = async (bookingId, status) => {
    await Booking.update(bookingId, { status });
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
