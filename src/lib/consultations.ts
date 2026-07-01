import { Consultation, Booking, Notification, Conversation } from "@/entities/all";
import { upsertClientRecord } from "@/lib/fileWaiver";

/** Client requests a (free) consultation with a practitioner. */
export async function requestConsultation(practitioner: any, user: any, message = "") {
  const consult = await Consultation.create({
    client_id: user?.id,
    client_name: user?.full_name,
    client_email: user?.email,
    practitioner_id: practitioner.id,
    practitioner_name: practitioner.full_name,
    status: "requested",
    message,
  });
  await Notification.create({
    user_id: practitioner.id,
    title: "New consultation request",
    message: `${user?.full_name || "A client"} requested a consultation.`,
    type: "booking",
    priority: "high",
    related_id: consult.id,
    action_url: "/PractitionerDashboard",
  });
  // Seed the CRM row so the client shows up immediately.
  if (practitioner.id && user?.id) {
    await upsertClientRecord({ practitionerId: practitioner.id, clientId: user.id, clientName: user.full_name, clientEmail: user.email });
  }
  // Open a conversation thread for the two parties.
  try {
    const existing = await Conversation.filter({ participant_1_id: user.id, participant_2_id: practitioner.id });
    if (!existing[0]) {
      await Conversation.create({
        participant_1_id: user.id, participant_1_name: user.full_name,
        participant_2_id: practitioner.id, participant_2_name: practitioner.full_name,
        last_message: "Consultation requested", last_message_date: new Date().toISOString(),
      });
    }
  } catch { /* non-fatal */ }
  return consult;
}

/** Practitioner converts a completed/scheduled consultation into a pending booking. */
export async function convertConsultationToBooking(consult: any, practitioner: any) {
  const booking = await Booking.create({
    practitioner_id: consult.practitioner_id,
    practitioner_name: consult.practitioner_name || practitioner?.full_name,
    client_id: consult.client_id,
    client_name: consult.client_name,
    client_email: consult.client_email,
    service_type: "Private Session",
    requested_date: consult.requested_time || new Date().toISOString(),
    status: "pending",
    price: 0,
    payment_status: "unpaid",
    waiver_signed: false,
    consultation_id: consult.id,
    message: `Converted from consultation${consult.notes ? `: ${consult.notes}` : ""}`,
  });
  await Consultation.update(consult.id, { status: "converted", booking_id: booking.id });
  await Notification.create({
    user_id: consult.client_id, title: "Your consultation is ready to book",
    message: `${consult.practitioner_name || "Your practitioner"} converted your consultation to a booking. Sign the waiver and pay to confirm.`,
    type: "booking", priority: "high", related_id: booking.id, action_url: "/Bookings",
  });
  return booking;
}
