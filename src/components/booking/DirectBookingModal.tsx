
import React, { useState, useEffect, useCallback } from "react";
import {
  Booking,
  Payment,
  Conversation,
  PractitionerAvailability,
  PractitionerBlockedDate,
  PractitionerException,
  User,
  Notification,
  ScreeningResponse,
  ConsentRecord
} from "@/entities/all";
import SafetyGate, { type SafetyData } from "./SafetyGate";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  CheckCircle,
  Calendar as CalendarIcon,
  Clock,
  ArrowRight,
  Shield,
  XCircle
} from "@/lib/icons";
import { format, parse, startOfDay, isSameDay } from "date-fns";

// Helper function to generate time slots
const generateTimeSlots = (start, end, interval) => {
  const slots = [];
  let currentTime = parse(start, 'HH:mm', new Date());
  const endTime = parse(end, 'HH:mm', new Date());

  while (currentTime < endTime) {
    slots.push(format(currentTime, 'HH:mm'));
    currentTime.setMinutes(currentTime.getMinutes() + interval);
  }
  return slots;
};


export default function DirectBookingModal({ practitioner, onClose, onBookingComplete }) {
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [bookingStep, setBookingStep] = useState('date_selection'); // 'date_selection' | 'safety' | 'confirmation' | 'success'
  const [safetyData, setSafetyData] = useState<SafetyData | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const getAvailableSlots = useCallback(async (date) => {
    if (!date) return;
    setIsLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedTime(null);
    setError('');

    const dayOfWeek = format(date, 'eeee').toLowerCase();

    try {
      const [weeklyAvail, blockedDates, exceptions] = await Promise.all([
        PractitionerAvailability.filter({ practitioner_id: practitioner.id, day_of_week: dayOfWeek }),
        PractitionerBlockedDate.filter({ practitioner_id: practitioner.id }),
        PractitionerException.filter({ practitioner_id: practitioner.id, date: format(date, 'yyyy-MM-dd') }),
      ]);

      let finalSlots = [];

      // 1. Start with weekly availability
      let baseSlots = weeklyAvail.filter(a => a.is_available).flatMap(a => generateTimeSlots(a.start_time, a.end_time, 60));

      // 2. Apply exceptions for the day
      const overrideException = exceptions.find(e => e.exception_type === 'override');
      const additionalExceptions = exceptions.filter(e => e.exception_type === 'additional');
      const removeExceptions = exceptions.filter(e => e.exception_type === 'remove');

      if (overrideException) {
        baseSlots = generateTimeSlots(overrideException.start_time, overrideException.end_time, 60);
      }
      
      additionalExceptions.forEach(e => {
        baseSlots.push(...generateTimeSlots(e.start_time, e.end_time, 60));
      });

      if (removeExceptions.length > 0) {
        const removeRanges = removeExceptions.map(e => ({ start: parse(e.start_time, 'HH:mm', date), end: parse(e.end_time, 'HH:mm', date) }));
        baseSlots = baseSlots.filter(slot => {
          const slotTime = parse(slot, 'HH:mm', date);
          return !removeRanges.some(range => slotTime >= range.start && slotTime < range.end);
        });
      }

      // 3. Filter out blocked dates/times
      const todayBlockedDates = blockedDates.filter(b => isSameDay(new Date(b.date), date));
      if (todayBlockedDates.some(b => b.block_type === 'full_day')) {
        finalSlots = [];
      } else {
        const partialBlocks = todayBlockedDates.filter(b => b.block_type === 'partial_day');
        const blockedRanges = partialBlocks.map(b => ({ start: parse(b.start_time, 'HH:mm', date), end: parse(b.end_time, 'HH:mm', date) }));
        
        finalSlots = baseSlots.filter(slot => {
          const slotTime = parse(slot, 'HH:mm', date);
          return !blockedRanges.some(range => slotTime >= range.start && slotTime < range.end);
        });
      }

      // Remove duplicates and sort
      finalSlots = [...new Set(finalSlots)].sort();
      
      setAvailableSlots(finalSlots);

    } catch (err) {
      console.error("Error fetching availability:", err);
      setError("Could not load available times. Please try again.");
    } finally {
      setIsLoadingSlots(false);
    }
  }, [practitioner.id]);
  
  const handleDateChange = (date) => {
    setSelectedDate(date);
    getAvailableSlots(date);
  };

  const handleConfirmBooking = async () => {
    if (!user || !selectedDate || !selectedTime) {
      setError("Please select a date and time to continue.");
      return;
    }
    
    setIsProcessing(true);
    setError("");

    try {
      const bookingDateTime = parse(selectedTime, 'HH:mm', selectedDate);
      const sessionPrice = practitioner.pricing_range === '$' ? 150 : practitioner.pricing_range === '$$' ? 200 : 250;

      // --- MOCK PAYMENT GATEWAY ---
      // In a real app, this would redirect to Stripe Checkout or use Stripe Elements.
      // Here, we simulate a successful payment by creating a Payment record.
      const paymentRecord = await Payment.create({
        booking_id: null, // will be updated after booking is created
        user_id: user.id,
        practitioner_id: practitioner.id,
        amount: sessionPrice,
        payment_type: 'booking',
        payment_status: 'completed',
        payment_method: 'mock_credit_card',
      });
      // --- END MOCK PAYMENT ---

      const bookingRecord = await Booking.create({
        practitioner_id: practitioner.id,
        practitioner_name: practitioner.full_name,
        client_id: user.id,
        client_name: user.full_name,
        client_email: user.email,
        service_type: "Private Session",
        requested_date: format(bookingDateTime, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        status: "confirmed", // Direct booking is auto-confirmed
        price: sessionPrice,
        payment_status: "paid",
        message: `Direct booking made via practitioner profile for ${format(bookingDateTime, 'PPP @ p')}`
      });

      // Link payment to booking
      await Payment.update(paymentRecord.id, { booking_id: bookingRecord.id });

      // Persist health screening + consent (safety pathway)
      if (safetyData) {
        await ScreeningResponse.create({
          booking_id: bookingRecord.id, user_id: user.id, practitioner_id: practitioner.id,
          answers: safetyData.answers, flagged: safetyData.flagged,
        });
        await ConsentRecord.create({
          booking_id: bookingRecord.id, user_id: user.id, practitioner_id: practitioner.id,
          document_version: safetyData.consent.document_version, agreed: safetyData.consent.agreed,
          signature_name: safetyData.consent.signature_name, agreed_at: safetyData.consent.agreed_at,
        });
        if (safetyData.flagged) {
          await Notification.create({
            user_id: practitioner.id, title: "⚠ Screening flags to review",
            message: `${user.full_name}'s health screening flagged items — please review before the session.`,
            type: 'booking', related_id: bookingRecord.id, priority: 'urgent', action_url: '/PractitionerDashboard',
          });
        }
      }

      // Ensure a conversation exists for this booking
      const existingConvo = await Conversation.filter({ related_booking_id: bookingRecord.id });
      if (existingConvo.length === 0) {
        await Conversation.create({
          participant_1_id: user.id,
          participant_2_id: practitioner.id,
          participant_1_name: user.full_name,
          participant_2_name: practitioner.full_name,
          related_booking_id: bookingRecord.id,
          last_message: "Session booked! You can now chat with your practitioner.",
          last_message_date: new Date().toISOString(),
        });
      }

      // Notify practitioner
      await Notification.create({
          user_id: practitioner.id,
          title: "New Direct Booking!",
          message: `${user.full_name} has booked a session with you for ${format(bookingDateTime, 'PPP @ p')}.`,
          type: 'booking',
          related_id: bookingRecord.id,
          priority: 'high',
          action_url: '/PractitionerDashboard'
      });

      setBookingStep('success');
      onBookingComplete();

    } catch (err) {
      console.error("Direct booking failed:", err);
      setError("An unexpected error occurred while confirming your booking. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Book a Session with {practitioner.full_name}</DialogTitle>
          <DialogDescription>
            {bookingStep === 'date_selection' && "Select an available date and time for your session."}
            {bookingStep === 'safety' && "A quick health screening and consent, for your safety."}
            {bookingStep === 'confirmation' && "Please confirm your booking and proceed with payment."}
            {bookingStep === 'success' && "Your session is confirmed!"}
          </DialogDescription>
        </DialogHeader>

        {error && (
            <Alert variant="destructive"><XCircle className="h-4 w-4" /> <AlertDescription>{error}</AlertDescription></Alert>
        )}

        {bookingStep === 'date_selection' && (
          <div className="grid md:grid-cols-2 gap-8 pt-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-primary"/> Select a Date</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                disabled={(date) => date < startOfDay(new Date())}
                className="rounded-md border"
              />
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2"><Clock className="w-5 h-5 text-primary"/> Select a Time</h3>
              {isLoadingSlots ? (
                <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
              ) : selectedDate && availableSlots.length > 0 ? (
                <RadioGroup value={selectedTime} onValueChange={setSelectedTime} className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map(slot => (
                      <div key={slot}>
                        <RadioGroupItem value={slot} id={slot} className="peer sr-only" />
                        <Label
                          htmlFor={slot}
                          className="flex items-center justify-center rounded-md border-2 border-border bg-card p-3 text-sm font-medium hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary cursor-pointer"
                        >
                          {format(parse(slot, 'HH:mm', new Date()), 'p')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              ) : selectedDate ? (
                <p className="text-muted-foreground text-center h-48 flex items-center justify-center">No available slots for this date.</p>
              ) : (
                <p className="text-muted-foreground text-center h-48 flex items-center justify-center">Please select a date to see available times.</p>
              )}
            </div>
          </div>
        )}
        
        {bookingStep === 'safety' && (
          <SafetyGate
            userName={user?.full_name || ''}
            onBack={() => setBookingStep('date_selection')}
            onComplete={(d) => { setSafetyData(d); setBookingStep('confirmation'); }}
          />
        )}

        {bookingStep === 'confirmation' && (
             <div className="pt-4 space-y-4">
                <h3 className="text-lg font-semibold">Booking Summary</h3>
                {safetyData?.flagged && (
                  <Alert variant="destructive">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>Your screening flagged items your practitioner will review before confirming.</AlertDescription>
                  </Alert>
                )}
                <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p><strong>Practitioner:</strong> {practitioner.full_name}</p>
                    <p><strong>Date:</strong> {format(selectedDate, 'PPP')}</p>
                    <p><strong>Time:</strong> {format(parse(selectedTime, 'HH:mm', new Date()), 'p')}</p>
                    <Separator/>
                    <p className="font-bold text-lg"><strong>Total:</strong> ${practitioner.pricing_range === '$' ? 150 : practitioner.pricing_range === '$$' ? 200 : 250}</p>
                </div>
                 <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                        This is a mock payment step. In a real application, you would enter your credit card details here. Clicking "Confirm & Pay" will simulate a successful payment and book your session.
                    </AlertDescription>
                </Alert>
            </div>
        )}

        {bookingStep === 'success' && (
            <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4"/>
                <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                <p className="text-muted-foreground mb-6">
                    Your session with {practitioner.full_name} is booked. You can view your booking details and message your practitioner from the "My Bookings" page.
                </p>
                <Button onClick={onClose}>Done</Button>
            </div>
        )}
        
        {bookingStep !== 'success' && (
            <div className="flex justify-end pt-6 border-t mt-6">
                {bookingStep === 'date_selection' && (
                    <Button onClick={() => setBookingStep('safety')} disabled={!selectedDate || !selectedTime}>
                        Continue <ArrowRight className="w-4 h-4 ml-2"/>
                    </Button>
                )}
                 {bookingStep === 'confirmation' && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setBookingStep('safety')} disabled={isProcessing}>Back</Button>
                        <Button onClick={handleConfirmBooking} disabled={isProcessing} className="bg-primary hover:bg-primary/90">
                            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <CheckCircle className="w-4 h-4 mr-2"/>}
                            {isProcessing ? 'Processing...' : 'Confirm & Pay'}
                        </Button>
                    </div>
                )}
            </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
