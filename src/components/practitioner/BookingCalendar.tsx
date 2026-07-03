import React, { useState } from 'react';
import { Booking, Message, Conversation, ConsentRecord } from "@/entities/all";
import { SendEmail } from "@/integrations/Core";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Reveal } from "@/components/ui/Reveal";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth
} from "date-fns";
import {
  Calendar, CalendarDays, ChevronLeft, ChevronRight, Check, X, Clock, CalendarCheck,
  CheckCircle, XCircle, List, Mail, Phone, User, MessageSquare
} from "@/lib/icons";

export default function BookingCalendar({ bookings, practitioner, onUpdate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [view, setView] = useState("month");

  const updateBookingStatus = async (bookingId, status) => {
    setIsUpdating(true);
    try {
      // Safety gate: never confirm a session until the consent waiver is signed
      // (parity with PractitionerBookingsView).
      if (status === 'confirmed') {
        const consent = await ConsentRecord.filter({ booking_id: bookingId }).catch(() => []);
        if (!consent.some((c) => c.agreed)) {
          toast.error("The client's consent waiver must be signed before you can confirm.");
          setIsUpdating(false);
          return;
        }
      }
      await Booking.update(bookingId, { status });
      if (status === 'confirmed') { try { await Booking.update(bookingId, { waiver_signed: true }); } catch {} }
      const booking = bookings.find(b => b.id === bookingId);

      if (booking) {
        // If confirmed, ensure a conversation exists
        if (status === 'confirmed') {
          const existingConversations = await Conversation.filter({ related_booking_id: bookingId });
          if (existingConversations.length === 0) {
            await Conversation.create({
              participant_1_id: practitioner.id,
              participant_2_id: booking.client_id,
              participant_1_name: practitioner.full_name,
              participant_2_name: booking.client_name,
              related_booking_id: bookingId,
              last_message: "Booking confirmed. You can now chat with your practitioner.",
              last_message_date: new Date().toISOString()
            });
          }
        }

        await sendStatusEmail(booking, status);

        const conversation = (await Conversation.filter({ related_booking_id: bookingId }))[0];
        if (conversation) {
          await Message.create({
            conversation_id: conversation.id,
            booking_id: bookingId,
            sender_id: 'system',
            receiver_id: booking.client_id || 'system',
            sender_name: 'System',
            content: `Booking status updated to: ${status}`,
            message_type: 'system'
          });
        }
      }

      toast.success(`Booking ${status}.`);
      if (selectedBooking?.id === bookingId) setSelectedBooking((s) => ({ ...s, status }));
      onUpdate();
    } catch (error) {
      console.error("Failed to update booking:", error);
      toast.error("Couldn't update the booking. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const sendStatusEmail = async (booking, status) => {
    try {
      await SendEmail({
        to: booking.client_email,
        subject: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)} - ${practitioner.full_name}`,
        body: getEmailContent(booking, status),
      });
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  };

  const getEmailContent = (booking, status) => {
    const baseMessage = `Dear ${booking.client_name},\n\n`;
    switch (status) {
      case 'confirmed':
        return `${baseMessage}Great news! Your Kambo session request has been confirmed.\n\nSession Details:\n- Date: ${format(new Date(booking.requested_date), 'PPP')}\n- Service: ${booking.service_type}\n- Practitioner: ${practitioner.full_name}\n\nI will be in touch soon to arrange the final details and location.\n\nLooking forward to our session together!\n\nBest regards,\n${practitioner.full_name}`;
      case 'declined':
        return `${baseMessage}Thank you for your interest in booking a session with me.\n\nUnfortunately, I'm unable to accommodate your request for ${format(new Date(booking.requested_date), 'PPP')}.\n\nI encourage you to reach out with alternative dates, or feel free to browse other practitioners in our directory.\n\nWishing you well on your healing journey,\n${practitioner.full_name}`;
      case 'completed':
        return `${baseMessage}Thank you for participating in our Kambo session. I hope it was a meaningful and healing experience for you.\n\nPlease take time to rest and integrate in the coming days. Remember to stay hydrated and be gentle with yourself.\n\nWith gratitude,\n${practitioner.full_name}`;
      default:
        return `${baseMessage}Your booking status has been updated to: ${status}.\n\nBest regards,\n${practitioner.full_name}`;
    }
  };

  const getBookingsForDate = (date) =>
    bookings.filter((booking) => {
      try { return isSameDay(new Date(booking.requested_date), date); } catch { return false; }
    });

  // Token-based day-chip color per status.
  const chipClass = (status) => ({
    confirmed: "bg-primary hover:bg-primary/90",
    pending: "bg-warning hover:bg-warning/90",
    declined: "bg-destructive hover:bg-destructive/90",
    completed: "bg-info hover:bg-info/90",
    cancelled: "bg-muted-foreground hover:bg-muted-foreground/90",
    no_show: "bg-warning hover:bg-warning/90",
  }[status] || "bg-info hover:bg-info/90");

  const counts = {
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    declined: bookings.filter((b) => b.status === "declined").length,
  };
  const upcoming = [...bookings].sort(
    (a, b) => new Date(a.requested_date).getTime() - new Date(b.requested_date).getTime(),
  );

  const ActionButtons = ({ b, compact }) => (
    <>
      {b.status === "pending" && (
        <>
          <Button size={compact ? "sm" : "default"} className="gap-1.5" disabled={isUpdating} onClick={() => updateBookingStatus(b.id, "confirmed")}>
            <Check className="h-4 w-4" /> Confirm
          </Button>
          <Button size={compact ? "sm" : "default"} variant="destructive" className="gap-1.5" disabled={isUpdating} onClick={() => updateBookingStatus(b.id, "declined")}>
            <X className="h-4 w-4" /> {compact ? "" : "Decline"}
          </Button>
        </>
      )}
      {b.status === "confirmed" && (
        <Button size={compact ? "sm" : "default"} variant="outline" className="gap-1.5 border-info/40 text-info hover:bg-info/10" disabled={isUpdating} onClick={() => updateBookingStatus(b.id, "completed")}>
          <CheckCircle className="h-4 w-4" /> Complete
        </Button>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header + view toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 shadow-glow">
            <Calendar className="h-6 w-6 text-primary" weight="duotone" />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">Booking Calendar</h2>
            <p className="text-sm text-muted-foreground">Manage sessions, requests, and your month at a glance.</p>
          </div>
        </div>
        <div className="w-full sm:w-52">
          <SegmentedControl value={view} onChange={setView} options={[{ value: "month", label: "Month", icon: CalendarDays }, { value: "list", label: "List", icon: List }]} />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Clock} label="Pending" value={counts.pending} color="warning" sub={counts.pending > 0 ? "Awaiting your response" : "All caught up"} />
        <StatCard icon={CalendarCheck} label="Confirmed" value={counts.confirmed} color="primary" sub="Upcoming sessions" />
        <StatCard icon={CheckCircle} label="Completed" value={counts.completed} color="info" sub="Sessions held" />
        <StatCard icon={XCircle} label="Declined" value={counts.declined} color="destructive" sub="Not scheduled" />
      </div>

      {view === "month" ? (
        <Card className="glass overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth((p) => subMonths(p, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth((p) => addMonths(p, 1))}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {[["Pending", "bg-warning"], ["Confirmed", "bg-primary"], ["Completed", "bg-info"], ["Declined", "bg-destructive"]].map(([l, c]) => (
                <span key={l} className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${c}`} /> {l}</span>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">{day}</div>
              ))}
              {eachDayOfInterval({
                start: (() => { const s = startOfMonth(currentMonth); const d = new Date(s); d.setDate(d.getDate() - s.getDay()); return d; })(),
                end: (() => { const e = endOfMonth(currentMonth); const d = new Date(e); d.setDate(d.getDate() + (6 - d.getDay())); return d; })(),
              }).map((day) => {
                const dayBookings = getBookingsForDate(day);
                const isCur = isSameMonth(day, currentMonth);
                const today = isSameDay(day, new Date());
                return (
                  <div key={day.toISOString()} className={`min-h-[104px] rounded-xl border p-1.5 transition-colors ${isCur ? "border-border bg-card hover:border-primary/30" : "border-transparent bg-muted/40"} ${today ? "ring-2 ring-inset ring-primary/60" : ""}`}>
                    <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${today ? "bg-primary text-primary-foreground" : isCur ? "text-foreground" : "text-muted-foreground/50"}`}>{format(day, "d")}</div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map((booking) => (
                        <button key={booking.id} title={`${booking.client_name} · ${booking.service_type} · ${booking.status}`} onClick={() => setSelectedBooking(booking)}
                          className={`block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium text-white transition ${chipClass(booking.status)}`}>
                          {booking.client_name}
                        </button>
                      ))}
                      {dayBookings.length > 3 && <div className="px-1.5 text-[10px] text-muted-foreground">+{dayBookings.length - 3} more</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-3 sm:p-4">
            {upcoming.length === 0 ? (
              <div className="py-14 text-center text-muted-foreground"><Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" weight="duotone" /> No bookings yet.</div>
            ) : (
              <Reveal stagger className="space-y-2">
                {upcoming.map((b) => (
                  <Reveal.Item key={b.id}>
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-sm">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-clay text-sm font-semibold text-primary-foreground">
                        {(b.client_name || "?").charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2"><span className="truncate font-medium">{b.client_name}</span><StatusPill status={b.status} /></div>
                        <p className="text-xs text-muted-foreground">{b.service_type} · {b.requested_date ? format(new Date(b.requested_date), "EEE, MMM d · h:mm a") : "—"}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <ActionButtons b={b} compact />
                        <Button size="sm" variant="ghost" onClick={() => setSelectedBooking(b)}>Details</Button>
                      </div>
                    </div>
                  </Reveal.Item>
                ))}
              </Reveal>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking detail */}
      {selectedBooking && (
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" weight="duotone" /> Booking details</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold"><User className="h-4 w-4 text-muted-foreground" /> Client</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> {selectedBooking.client_name}</p>
                  <p><span className="text-muted-foreground">Email:</span> {selectedBooking.client_email}</p>
                  {selectedBooking.client_phone && <p><span className="text-muted-foreground">Phone:</span> {selectedBooking.client_phone}</p>}
                </div>
              </div>
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Calendar className="h-4 w-4 text-muted-foreground" /> Session</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Date:</span> {format(new Date(selectedBooking.requested_date), "PPP")}</p>
                  <p><span className="text-muted-foreground">Service:</span> {selectedBooking.service_type}</p>
                  <p className="flex items-center gap-2"><span className="text-muted-foreground">Status:</span> <StatusPill status={selectedBooking.status} /></p>
                </div>
              </div>
            </div>
            {selectedBooking.message && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold"><MessageSquare className="h-4 w-4 text-muted-foreground" /> Client message</h4>
                <p className="rounded-lg bg-muted p-3 text-sm">{selectedBooking.message}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <ActionButtons b={selectedBooking} />
              <Button variant="outline" className="gap-2" onClick={() => window.open(`mailto:${selectedBooking.client_email}`, "_blank")}><Mail className="h-4 w-4" /> Email</Button>
              {selectedBooking.client_phone && <Button variant="outline" className="gap-2" onClick={() => window.open(`tel:${selectedBooking.client_phone}`, "_blank")}><Phone className="h-4 w-4" /> Call</Button>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
