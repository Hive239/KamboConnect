
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User, Practitioner, Booking, Notification } from "@/entities/all";
import SafetyGate, { type SafetyData } from "@/components/booking/SafetyGate";
import { fileScreeningAndWaiver } from "@/lib/fileWaiver";
import { isValidEmail, isValidPhone } from "@/lib/validation";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { getAvailableSlots as computeSlots } from "@/lib/availability";
import { Calendar as CalendarIcon, Send, ArrowLeft, UserCircle, Loader2, Clock } from "@/lib/icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";

import { track } from "@/lib/activity";
export default function BookingRequestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const practitionerId = new URLSearchParams(location.search).get("practitionerId");
  
  const [practitioner, setPractitioner] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState<"form" | "safety">("form");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    service_type: "Private Session",
    requested_date: null,
    message: ""
  });

  useEffect(() => {
    if (!practitionerId) {
      navigate(createPageUrl("Directory"));
      return;
    }

    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [practitionerData] = await Practitioner.filter({ id: practitionerId });
        if (!practitionerData) {
          // Handle case where practitioner is not found
          navigate(createPageUrl("Directory"));
          return;
        }
        setPractitioner(practitionerData);
        track("booking_started", { entityId: practitionerData.id, meta: { kind: "booking_request" } });

        const currentUser = await User.me();
        setUser(currentUser);
        setFormData(prev => ({
          ...prev,
          client_name: currentUser.full_name || "",
          client_email: currentUser.email || ""
        }));
      } catch (error) {
        // User not logged in, but can still book.
        console.log("User not logged in, proceeding with manual entry.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, [practitionerId, navigate]);

  // Load real available slots (shared engine) when a date is chosen.
  const handleDatePick = async (date) => {
    setFormData((prev) => ({ ...prev, requested_date: date }));
    setSelectedTime(null);
    setAvailableSlots([]);
    if (!date || !practitioner) return;
    setIsLoadingSlots(true);
    try {
      setAvailableSlots(await computeSlots(practitioner.id, date));
    } catch {
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Combine the chosen date + slot into an ISO timestamp.
  const requestedIso = () => {
    const dt = formData.requested_date as Date | null;
    if (!dt) return undefined;
    const d = new Date(dt);
    if (selectedTime) {
      const [h, m] = selectedTime.split(":").map(Number);
      d.setHours(h, m, 0, 0);
    }
    return d.toISOString();
  };

  // Step 1 → move to the safety gate (health screening + consent) before booking.
  const handleContinue = (e) => {
    e.preventDefault();
    if (!formData.requested_date || !practitioner) return;
    if (!isValidEmail(formData.client_email)) { toast.error("Please enter a valid email address."); return; }
    if (formData.client_phone && !isValidPhone(formData.client_phone)) { toast.error("Please enter a valid phone number."); return; }
    if (availableSlots.length > 0 && !selectedTime) return; // must pick a slot when times exist
    setStep("safety");
  };

  // Step 2 → create the booking and persist screening + consent (safety parity with direct booking).
  const finalizeBooking = async (safety: SafetyData) => {
    if (!practitioner) return;
    setIsSubmitting(true);
    try {
      const iso = requestedIso();
      const newBooking = await Booking.create({
        ...formData,
        requested_date: iso,
        slot_start: selectedTime ? iso : undefined,
        duration_minutes: selectedTime ? 60 : undefined,
        practitioner_id: practitioner.id,
        practitioner_name: practitioner.full_name,
        client_id: user?.id,
        price: 150, // Default price, can be adjusted
        status: "pending", // REQUIRED — without it the booking is invisible to both parties' filtered views
        payment_status: "unpaid"
      });

      track("booking_submitted", { entityId: practitioner.id, meta: { kind: "booking_request", bookingId: newBooking.id } });
      const clientId = user?.id || newBooking.client_id;
      await fileScreeningAndWaiver({
        bookingId: newBooking.id, clientId, clientName: formData.client_name,
        clientEmail: formData.client_email, clientPhone: formData.client_phone,
        practitionerId: practitioner.id, practitionerName: practitioner.full_name, safety,
      });

      // Notify practitioner
      await Notification.create({
        user_id: practitioner.id, // The practitioner gets the notification
        title: "New Booking Request",
        message: `${formData.client_name} has requested a session with you.`,
        type: "booking",
        priority: "high",
        related_id: newBooking.id,
        action_url: createPageUrl('PractitionerDashboard'),
        sender_image_url: user?.profile_image_url
      });
      if (safety.flagged) {
        await Notification.create({
          user_id: practitioner.id, title: "⚠ Screening flags to review",
          message: `${formData.client_name}'s health screening flagged items — please review before confirming.`,
          type: "booking", priority: "urgent", related_id: newBooking.id,
          action_url: createPageUrl('PractitionerDashboard'),
        });
      }

      setSubmitted(true);
      navigate(createPageUrl("Bookings"));
    } catch (error) {
      console.error("Failed to submit booking:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin"/></div>;
  }

  if (!practitioner) {
    return <div>Practitioner not found.</div>;
  }

  return (
    <div className="bg-muted min-h-screen p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <PageBreadcrumbs
          className="mb-6"
          items={[
            { label: "Directory", to: createPageUrl("Directory") },
            { label: practitioner.full_name, to: createPageUrl(`PractitionerProfile?id=${practitioner.id}`) },
            { label: "Request Booking" },
          ]}
        />

        <Card>
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white shadow-lg">
                <AvatarImage src={practitioner.profile_image_url} alt={practitioner.full_name} />
                <AvatarFallback><UserCircle className="w-full h-full text-muted-foreground/40" /></AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">Request a Booking</CardTitle>
            <p className="text-muted-foreground">with {practitioner.full_name}</p>
          </CardHeader>
          <CardContent>
            {step === "safety" ? (
              <SafetyGate
                userName={formData.client_name}
                onBack={() => setStep("form")}
                onComplete={finalizeBooking}
              />
            ) : (
            <>
            <Alert className="mb-6">
              <AlertDescription>
                Submit this form to request a session. Next you'll complete a quick health screening and consent, for your safety. The practitioner will contact you to confirm details and arrange payment.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleContinue} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} required />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" type="email" value={formData.client_email} onChange={e => setFormData({...formData, client_email: e.target.value})} required />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" value={formData.client_phone} onChange={e => setFormData({...formData, client_phone: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service">Service Type</Label>
                  <Select value={formData.service_type} onValueChange={value => setFormData({...formData, service_type: value})}>
                    <SelectTrigger id="service"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Private Session">Private Session</SelectItem>
                      <SelectItem value="Group Circle">Group Circle</SelectItem>
                      <SelectItem value="Consultation">Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Preferred Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="date" variant={"outline"} className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.requested_date ? format(formData.requested_date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={formData.requested_date} onSelect={handleDatePick} initialFocus disabled={(date) => date < new Date()} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {formData.requested_date && (
                <div>
                  <Label className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" /> Available times
                    {isLoadingSlots && <Loader2 className="h-3 w-3 animate-spin" />}
                  </Label>
                  {!isLoadingSlots && availableSlots.length === 0 ? (
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      No set times published for this day — submit your request and the practitioner will arrange a time with you.
                    </p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {availableSlots.map((t) => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setSelectedTime(t)}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                            selectedTime === t
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card hover:bg-accent"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="Introduce yourself, mention any specific needs, or ask a question." />
              </div>
              
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !formData.client_name || !formData.client_email || !formData.requested_date || (availableSlots.length > 0 && !selectedTime)} className="bg-primary hover:bg-primary/90">
                  <Send className="w-4 h-4 mr-2" />
                  Continue to Safety Screening
                </Button>
              </div>
            </form>
            </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
