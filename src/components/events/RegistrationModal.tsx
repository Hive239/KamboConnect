import React, { useState, useEffect } from 'react';
import { User, Notification } from "@/entities/all";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle } from "@/lib/icons";
import { createPageUrl } from '@/utils';
import AddToCalendar from "@/components/AddToCalendar";

export default function RegistrationModal({ event, onClose, onSubmitRegistration }) {
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [formData, setFormData] = useState({
    participant_name: "",
    participant_email: "",
    participant_phone: "",
    previous_kambo_experience: false,
    medical_conditions: "",
    emergency_contact: ""
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        setFormData(prev => ({
          ...prev,
          participant_name: currentUser.full_name || "",
          participant_email: currentUser.email || "",
          participant_phone: currentUser.phone || ""
        }));
      } catch (e) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const registrationData = {
        ...formData,
        event_id: event.id,
        registration_status: "confirmed", // Auto-confirm for this app version
        payment_status: "pending"
      };
      
      await onSubmitRegistration(registrationData);

      // Create a notification for the user
      if (user) {
        await Notification.create({
            user_id: user.id,
            title: "Event Registration Confirmed",
            message: `You are now registered for "${event.title}".`,
            type: 'event',
            related_id: event.id,
            action_url: createPageUrl("Bookings") // Or an event-specific page
        });
      }

      setRegistered(true);
    } catch (error) {
      console.error("Registration failed:", error);
      alert(error?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!event) return null;

  if (registered) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-8 w-8 text-success" weight="fill" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center">You're registered!</DialogTitle>
            <DialogDescription className="text-center">
              Your spot for "{event.title}" is confirmed. Add it to your calendar so you don't miss it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 pt-2">
            <AddToCalendar
              size="default"
              event={{
                title: event.title,
                details: event.description,
                location: event.is_online ? "Online" : event.location,
                start: event.start_date,
                end: event.end_date,
              }}
            />
            <Button variant="ghost" onClick={onClose}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Register for: {event.title}</DialogTitle>
          <DialogDescription>
            Complete the form below to secure your spot.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleRegistrationSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input
                id="name"
                value={formData.participant_name}
                onChange={(e) => setFormData({...formData, participant_name: e.target.value})}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.participant_email}
                onChange={(e) => setFormData({...formData, participant_email: e.target.value})}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Phone</Label>
              <Input
                id="phone"
                value={formData.participant_phone}
                onChange={(e) => setFormData({...formData, participant_phone: e.target.value})}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="medical" className="text-right pt-2">Medical Notes</Label>
              <Textarea
                id="medical"
                value={formData.medical_conditions}
                onChange={(e) => setFormData({...formData, medical_conditions: e.target.value})}
                placeholder="Any conditions or medications we should be aware of?"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}