
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Booking, Practitioner, Message, User, Payment, Review, Conversation } from "@/entities/all";
import { createPageUrl } from "@/utils";
import { format } from 'date-fns';
import { Calendar, Check, X, Hourglass, CalendarCheck2, AlertTriangle, MessageSquare, Loader2, RefreshCw, DollarSign, Star, CheckCircle, Book } from '@/lib/icons';
import { NotificationService } from '../notifications/NotificationService';
import BookingReviewModal from './BookingReviewModal';
import AddToCalendar from "@/components/AddToCalendar";

const ConfirmationDialog = ({ open, onOpenChange, onConfirm, title, description, isDestructive, isProcessing, children }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {isDestructive && <AlertTriangle className="text-red-500" />}
          {title}
        </DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      {children}
      <DialogFooter className="gap-2 pt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
          Back
        </Button>
        <Button 
          onClick={onConfirm}
          className={isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'}
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
          Confirm
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const StatusInfo = ({ status }) => {
  const config = {
    pending: {
      icon: <Hourglass className="w-4 h-4 text-yellow-600" />,
      text: "Pending practitioner confirmation.",
      badge: "bg-warning/10 text-warning border-warning/20",
    },
    confirmed: {
      icon: <Check className="w-4 h-4 text-primary" />,
      text: "Confirmed! The practitioner will be in touch.",
      badge: "bg-primary/10 text-primary border-primary/20",
    },
    declined: {
      icon: <X className="w-4 h-4 text-red-700" />,
      text: "This booking was declined by the practitioner.",
      badge: "bg-destructive/10 text-destructive border-destructive/20",
    },
    cancelled: {
      icon: <X className="w-4 h-4 text-muted-foreground" />,
      text: "You have cancelled this booking request.",
      badge: "bg-muted text-foreground border-border",
    },
    completed: {
      icon: <CalendarCheck2 className="w-4 h-4 text-info" />,
      text: "This session has been completed.",
      badge: "bg-info/10 text-info border-info/20",
    },
    no_show: {
      icon: <X className="w-4 h-4 text-warning" />,
      text: "This session was marked as a no-show.",
      badge: "bg-warning/10 text-warning border-warning/20",
    },
  };

  const current = config[status] || config.pending;

  return (
    <>
        <StatusPill status={status} />
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
            {current.icon}
            <p>{current.text}</p>
        </div>
    </>
  );
};

const RescheduleButton = ({ booking }) => {
    const navigate = useNavigate();
    const [conversationId, setConversationId] = useState(null);

    useEffect(() => {
        const findConversation = async () => {
            if (!booking.id) return;
            try {
                const convos = await Conversation.filter({ related_booking_id: booking.id });
                if (convos.length > 0) {
                    setConversationId(convos[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch conversation for booking:", error);
            }
        };
        findConversation();
    }, [booking.id]);

    const handleReschedule = () => {
        if (conversationId) {
            navigate(createPageUrl(`Messages?conversation_id=${conversationId}`));
        } else {
            // Fallback for older bookings without a conversation link or if fetching fails
            navigate(createPageUrl('Messages'));
        }
    };

    return (
        <Button variant="outline" size="sm" onClick={handleReschedule}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Request Reschedule
        </Button>
    );
};

const ClientBookingsView = ({ bookings, onUpdate }) => {
  const [confirmState, setConfirmState] = useState({ open: false, booking: null, action: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewState, setReviewState] = useState({ open: false, booking: null });
  const [reviewedBookingIds, setReviewedBookingIds] = useState(new Set());
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  // Memoize bookings length to prevent unnecessary re-renders
  const bookingsLength = bookings?.length || 0;

  useEffect(() => {
    // Only fetch reviews once when component mounts or when bookings length changes
    const checkReviewedBookings = async () => {
      // Don't fetch if we already loaded reviews or if there are no bookings
      if (reviewsLoaded || bookingsLength === 0) return;
      
      try {
        const user = await User.me();
        if (user) {
          const userReviews = await Review.filter({ reviewer_id: user.id });
          const reviewedIds = new Set(userReviews.map(r => r.booking_id));
          setReviewedBookingIds(reviewedIds);
          setReviewsLoaded(true); // Mark as loaded
        }
      } catch (error) {
        console.warn("Could not load review history:", error);
        setReviewsLoaded(true); // Mark as loaded even on error to prevent retries
      }
    };
    
    checkReviewedBookings();
  }, [bookingsLength, reviewsLoaded]); // Use bookingsLength instead of accessing bookings directly

  const cancellationFee = confirmState.booking?.price ? (confirmState.booking.price * 0.2).toFixed(2) : '0.00';

  const handleAction = (booking, action) => {
    setConfirmState({ open: true, booking, action });
  };
  
  const handleReview = (booking) => {
    // Ensure booking is completed before allowing review
    if (booking.status !== 'completed') {
      console.warn("Can only review completed bookings");
      return;
    }
    
    // Check if already reviewed
    if (reviewedBookingIds.has(booking.id)) {
      console.warn("This booking has already been reviewed");
      return;
    }

    setReviewState({ open: true, booking: booking });
  };

  const handleReviewSubmit = async () => {
    // Reload bookings and review status after review submission
    onUpdate();
    
    // Update local state to reflect new review without making additional API calls
    if (reviewState.booking) {
      setReviewedBookingIds(prev => new Set([...prev, reviewState.booking.id]));
    }
    setReviewState({ open: false, booking: null }); // Close the modal
  };

  const handleConfirm = async () => {
    const { booking, action } = confirmState;
    if (!booking || !action) return;

    setIsProcessing(true);

    try {
      if (action === 'withdraw') { // For pending requests, no fee
        await Booking.update(booking.id, { status: 'cancelled' });
        
        // Create notification for user
        const currentUser = await User.me();
        await NotificationService.createBookingNotification(
          currentUser.id, 
          booking, 
          'cancelled'
        );
        
      } else if (action === 'cancel' && booking.status === 'confirmed') { // For confirmed sessions, process fee
        const currentUser = await User.me();
        
        // 1. Process cancellation fee payment
        if (booking.price > 0 && parseFloat(cancellationFee) > 0) {
          await Payment.create({
            booking_id: booking.id,
            user_id: currentUser.id,
            practitioner_id: booking.practitioner_id,
            amount: parseFloat(cancellationFee),
            payment_type: 'cancellation_fee',
            payment_status: 'completed',
            currency: 'USD',
          });
        }
        
        // 2. Update booking to cancelled
        await Booking.update(booking.id, { status: 'cancelled' });

        // 3. Create notification for user
        await NotificationService.createBookingNotification(
          currentUser.id, 
          booking, 
          'cancelled'
        );

        // 4. Send in-app system message to practitioner
        const practitioners = await Practitioner.filter({ id: booking.practitioner_id });
        if (practitioners.length > 0) {
          const practitionerUser = await User.filter({ email: practitioners[0].email });
          if (practitionerUser.length > 0) {
            await Message.create({
              booking_id: booking.id,
              sender_id: currentUser.id,
              receiver_id: practitionerUser[0].id,
              sender_name: "KamboGuide System",
              content: `Booking Cancelled: Your session with ${booking.client_name} for ${format(new Date(booking.requested_date), 'PPP')} was cancelled. A 20% cancellation fee of $${cancellationFee} has been processed.`,
              message_type: 'system',
              is_read: false
            });
          }
        }
      }
      onUpdate(); // Reload data in parent
    } catch (error) {
      console.error(`Failed to ${action} booking:`, error);
      // You could show an error toast here
    } finally {
      setIsProcessing(false);
      setConfirmState({ open: false, booking: null, action: null });
    }
  };
  
  if (!bookings || bookings.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardHeader>
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground/40" />
          <CardTitle className="mt-4">You have no booking requests</CardTitle>
          <CardDescription>
            Find a practitioner in the directory to request a session.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const upcoming = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const past = bookings.filter(b => b.status === 'declined' || b.status === 'completed' || b.status === 'cancelled');

  return (
    <div className="space-y-8">
      <ConfirmationDialog
        open={confirmState.open}
        onOpenChange={(isOpen) => !isProcessing && setConfirmState({ ...confirmState, open: isOpen })}
        onConfirm={handleConfirm}
        isProcessing={isProcessing}
        title={confirmState.action === 'withdraw' ? 'Withdraw Booking Request?' : 'Cancel Confirmed Session?'}
        description={
            confirmState.action === 'withdraw' 
            ? `Are you sure you want to withdraw your request with ${confirmState.booking?.practitioner_name}? This can be re-booked later.`
            : `Are you sure you want to cancel this session? Please review the cancellation policy below.`
        }
        isDestructive={true}
      >
        {confirmState.action === 'cancel' && confirmState.booking?.status === 'confirmed' && (
             <div className="mt-4 p-4 bg-warning/10 border border-warning/40 rounded-lg">
                <h4 className="font-semibold text-warning flex items-center gap-2"><DollarSign className="w-5 h-5"/>Cancellation Fee</h4>
                <p className="text-sm text-warning mt-2">
                    Cancelling a confirmed session incurs a 20% fee to compensate the practitioner. This does not include standard credit card processing fees.
                </p>
                <div className="mt-3 font-medium text-warning">
                    Session Price: ${confirmState.booking?.price?.toFixed(2) || 'N/A'}<br/>
                    Cancellation Fee (20%): ${cancellationFee}
                </div>
                 <p className="text-xs text-warning mt-2">By confirming, you agree to be charged this amount.</p>
            </div>
        )}
      </ConfirmationDialog>
      
      {reviewState.open && (
        <BookingReviewModal
          booking={reviewState.booking}
          onClose={() => setReviewState({ open: false, booking: null })}
          onSubmit={handleReviewSubmit}
        />
      )}

      <section>
        <h2 className="text-2xl font-bold mb-4">Upcoming Bookings</h2>
        {upcoming.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {upcoming.map(booking => (
              <BookingCard key={booking.id} booking={booking} onAction={handleAction} onReview={handleReview} hasBeenReviewed={reviewedBookingIds.has(booking.id)} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No upcoming sessions found.</p>
        )}
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-4">Booking History</h2>
        {past.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {past.map(booking => (
              <BookingCard key={booking.id} booking={booking} onAction={handleAction} onReview={handleReview} hasBeenReviewed={reviewedBookingIds.has(booking.id)} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No past bookings found.</p>
        )}
      </section>
    </div>
  );
};

const BookingCard = ({ booking, onAction, onReview, hasBeenReviewed }) => {
    const canReview = booking.status === 'completed' && !hasBeenReviewed;
    
    return (
        <Card key={booking.id} className="flex flex-col border-border shadow-sm">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">
                            Session with {booking.practitioner_name}
                        </CardTitle>
                        <CardDescription>{booking.service_type}</CardDescription>
                    </div>
                    <Link to={createPageUrl(`PractitionerProfile?id=${booking.practitioner_id}`)}>
                       <Button variant="outline" size="sm">View Profile</Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="flex items-center gap-2 text-sm text-foreground">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Requested for: {format(new Date(booking.requested_date), 'PPP')}</span>
                </div>
                {(booking.deposit_amount > 0 || booking.price > 0) && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>${booking.deposit_amount || booking.price}</span>
                        <Badge variant={booking.deposit_status === "paid" || booking.payment_status === "paid" ? "verified" : "secondary"} className="text-[10px] capitalize">
                            {booking.deposit_status === "paid" || booking.payment_status === "paid" ? "Paid" : (booking.payment_status || "pending")}
                        </Badge>
                    </div>
                )}
                <div>
                    <StatusInfo status={booking.status} />
                </div>
            </CardContent>
            <div className="p-4 border-t bg-muted flex flex-wrap gap-2">
                {booking.status === 'pending' && (
                    <Button variant="destructive" size="sm" onClick={() => onAction(booking, 'withdraw')}>
                        <X className="w-4 h-4 mr-2" />
                        Withdraw Request
                    </Button>
                )}
                {booking.status === 'confirmed' && (
                    <>
                        <AddToCalendar
                          event={{
                            title: `Kambo Session with ${booking.practitioner_name}`,
                            details: booking.service_type ? `Service: ${booking.service_type}` : undefined,
                            location: booking.location,
                            start: booking.requested_date,
                          }}
                        />
                        <Button variant="destructive" size="sm" onClick={() => onAction(booking, 'cancel')}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel Session
                        </Button>
                        <RescheduleButton booking={booking} />
                        <Link to={createPageUrl(`Journal?kind=intention&booking_id=${booking.id}`)}>
                          <Button variant="outline" size="sm"><Book className="w-4 h-4 mr-2" /> Set intention</Button>
                        </Link>
                    </>
                )}
                {booking.status === 'completed' && (
                    canReview ? (
                        <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => onReview(booking)}>
                            <Star className="w-4 h-4 mr-2" />
                            Leave a Review
                        </Button>
                    ) : hasBeenReviewed ? (
                        <Button size="sm" disabled variant="outline">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Review Submitted
                        </Button>
                    ) : null
                )}
                {booking.status === 'completed' && (
                    <Link to={createPageUrl(`Journal?kind=reflection&booking_id=${booking.id}`)}>
                        <Button variant="outline" size="sm"><Book className="w-4 h-4 mr-2" /> Add reflection</Button>
                    </Link>
                )}
                {(booking.status === 'declined' || booking.status === 'cancelled') && (
                    <Link to={createPageUrl(`Directory`)}>
                        <Button size="sm">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Find Another Practitioner
                        </Button>
                    </Link>
                )}
            </div>
        </Card>
    );
};

export default ClientBookingsView;
