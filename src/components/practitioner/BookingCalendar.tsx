
import React, { useState } from 'react';
import { Booking, Message, Conversation, ConsentRecord } from "@/entities/all";
import { SendEmail } from "@/integrations/Core";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth
} from "date-fns";
import {
  Calendar, ChevronLeft, ChevronRight, Check, X,
  Mail, Phone, User, MessageSquare
} from "@/lib/icons";

export default function BookingCalendar({ bookings, practitioner, onUpdate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

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

        // Send automated email notification
        await sendStatusEmail(booking, status);

        // Create system message
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

      onUpdate();
    } catch (error) {
      console.error("Failed to update booking:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const sendStatusEmail = async (booking, status) => {
    const emailSubject = `Booking ${status.charAt(0).toUpperCase() + status.slice(1)} - ${practitioner.full_name}`;
    const emailContent = getEmailContent(booking, status);

    try {
      await SendEmail({
        to: booking.client_email,
        subject: emailSubject,
        body: emailContent
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
        return `${baseMessage}Thank you for your interest in booking a session with me.\n\nUnfortunately, I'm unable to accommodate your request for ${format(new Date(booking.requested_date), 'PPP')}. This could be due to scheduling conflicts or other commitments.\n\nI encourage you to reach out with alternative dates, or feel free to browse other practitioners in our directory.\n\nWishing you well on your healing journey,\n${practitioner.full_name}`;

      case 'completed':
        return `${baseMessage}Thank you for participating in our Kambo session. I hope it was a meaningful and healing experience for you.\n\nPlease take time to rest and integrate in the coming days. Remember to stay hydrated and be gentle with yourself.\n\nIf you'd like to share feedback or have any questions about your experience, please don't hesitate to reach out.\n\nWith gratitude,\n${practitioner.full_name}`;

      default:
        return `${baseMessage}Your booking status has been updated to: ${status}.\n\nBest regards,\n${practitioner.full_name}`;
    }
  };

  const getBookingsForDate = (date) => {
    return bookings.filter(booking => {
      try {
        return isSameDay(new Date(booking.requested_date), date);
      } catch (error) {
        return false;
      }
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-warning/10 text-warning border-warning/20",
      confirmed: "bg-primary/10 text-primary border-primary/20",
      declined: "bg-destructive/10 text-destructive border-destructive/20",
      completed: "bg-info/10 text-info border-info/20",
      cancelled: "bg-muted text-foreground border-border",
      no_show: "bg-warning/10 text-warning border-warning/20",
    };
    return colors[status] || colors.pending;
  };

  const StatusBadge = ({ status }) => (
    <Badge className={getStatusColor(status)}>{status}</Badge>
  );

  return (
    <div className="space-y-6">
      {/* Calendar View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Booking Calendar - {format(currentMonth, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center font-medium text-muted-foreground text-sm">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {eachDayOfInterval({
              start: (() => {
                const monthStart = startOfMonth(currentMonth);
                const startDate = new Date(monthStart);
                startDate.setDate(startDate.getDate() - monthStart.getDay());
                return startDate;
              })(),
              end: (() => {
                const monthEnd = endOfMonth(currentMonth);
                const endDate = new Date(monthEnd);
                endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
                return endDate;
              })()
            }).map(day => {
              const dayBookings = getBookingsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[100px] p-2 border border-border rounded-lg ${
                    isCurrentMonth ? 'bg-card' : 'bg-muted'
                  } ${isToday ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                  } ${isToday ? 'text-primary font-bold' : ''}`}>
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-1">
                    {dayBookings.map(booking => (
                      <div
                        key={booking.id}
                        className={`text-xs p-1 rounded text-white cursor-pointer truncate ${
                          booking.status === 'confirmed' ? 'bg-primary hover:bg-primary/90' :
                          booking.status === 'pending' ? 'bg-warning hover:bg-yellow-600' :
                          booking.status === 'declined' ? 'bg-destructive hover:bg-red-600' :
                          'bg-info hover:bg-blue-600'
                        }`}
                        title={`${booking.client_name} - ${booking.service_type} - ${booking.status}`}
                        onClick={() => setSelectedBooking(booking)}
                      >
                        {booking.client_name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Booking Details</CardTitle>
              <Button
                variant="ghost"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Client Information
                </h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {selectedBooking.client_name}</p>
                  <p><strong>Email:</strong> {selectedBooking.client_email}</p>
                  {selectedBooking.client_phone && (
                    <p><strong>Phone:</strong> {selectedBooking.client_phone}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Session Details
                </h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Date:</strong> {format(new Date(selectedBooking.requested_date), 'PPP')}</p>
                  <p><strong>Service:</strong> {selectedBooking.service_type}</p>
                  <p><strong>Status:</strong> <StatusBadge status={selectedBooking.status} /></p>
                </div>
              </div>
            </div>

            {selectedBooking.message && (
              <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Client Message
                </h4>
                <p className="text-sm text-foreground bg-muted p-3 rounded-lg">
                  {selectedBooking.message}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {selectedBooking.status === 'pending' && (
                <>
                  <Button
                    onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                    disabled={isUpdating}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Confirm
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => updateBookingStatus(selectedBooking.id, 'declined')}
                    disabled={isUpdating}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </>
              )}

              {selectedBooking.status === 'confirmed' && (
                <Button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark Completed
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => window.open(`mailto:${selectedBooking.client_email}`, '_blank')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Client
              </Button>

              {selectedBooking.client_phone && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`tel:${selectedBooking.client_phone}`, '_blank')}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Client
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['pending', 'confirmed', 'completed', 'declined'].map(status => {
          const count = bookings.filter(b => b.status === status).length;
          return (
            <Card key={status}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{count}</div>
                <div className="text-sm text-muted-foreground capitalize">{status}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
