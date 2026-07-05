import { ScreeningResponse, ConsentRecord, ClientDocument, ClientRecord, Booking } from "@/entities/all";
import { generateAndFileWaiverPdf } from "@/lib/waiverPdf";
import { supabase } from "@/lib/supabase";
import type { SafetyData } from "@/components/booking/SafetyGate";

interface FileArgs {
  bookingId: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  practitionerId: string;
  practitionerName?: string;
  safety: SafetyData;
}

/**
 * Files a completed safety gate: persists screening + consent, generates & stores the
 * signed waiver PDF, files a client_document, upserts the practitioner's client_record,
 * and marks the booking waiver_signed. Central to the consult→waiver→confirm pipeline.
 * Returns the waiver PDF URL.
 */
export async function fileScreeningAndWaiver(a: FileArgs): Promise<string> {
  const { bookingId, clientId, clientName, clientEmail, clientPhone, practitionerId, practitionerName, safety } = a;

  await ScreeningResponse.create({
    booking_id: bookingId, user_id: clientId, practitioner_id: practitionerId,
    answers: safety.answers, flagged: safety.flagged, notes: safety.screeningSummary,
    medications: safety.medications, interaction_flags: safety.interactionFlags,
    emergency_contact: safety.emergencyContact,
  });

  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : undefined;
  const { url: documentUrl, hash: docHash, auditId } = await generateAndFileWaiverPdf({
    signerName: safety.consent.signature_name,
    clientEmail,
    practitionerName,
    agreedAt: safety.consent.agreed_at,
    screeningSummary: safety.screeningSummary,
    signatureImage: safety.consent.signature_image,
    userAgent,
  });

  // Tamper-evident e-signature audit record (ESIGN/UETA).
  try {
    await supabase?.from("signature_audits").insert({
      audit_id: auditId, booking_id: bookingId, user_id: clientId,
      signer_name: safety.consent.signature_name, doc_hash: docHash,
      document_url: documentUrl, document_version: safety.consent.document_version,
      user_agent: userAgent, signed_at: safety.consent.agreed_at,
    });
  } catch { /* audit is best-effort; the signed PDF + consent record are the primary artifacts */ }

  await ConsentRecord.create({
    booking_id: bookingId, user_id: clientId, practitioner_id: practitionerId,
    document_version: safety.consent.document_version, agreed: safety.consent.agreed,
    signature_name: safety.consent.signature_name, agreed_at: safety.consent.agreed_at,
    document_url: documentUrl, waiver_version: safety.consent.document_version,
  });

  await ClientDocument.create({
    practitioner_id: practitionerId, client_id: clientId, booking_id: bookingId,
    kind: "waiver", title: `Signed waiver (${safety.consent.document_version})`, file_url: documentUrl,
  });

  await upsertClientRecord({ practitionerId, clientId, clientName, clientEmail, clientPhone });

  try { await Booking.update(bookingId, { waiver_signed: true, emergency_contact: safety.emergencyContact }); } catch { /* booking may set it itself */ }

  return documentUrl;
}

/** Create or refresh the practitioner's CRM row for this client. */
export async function upsertClientRecord(a: {
  practitionerId: string; clientId?: string; clientName?: string; clientEmail?: string; clientPhone?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const existing = a.clientId
    ? await ClientRecord.filter({ practitioner_id: a.practitionerId, client_id: a.clientId }).catch(() => [])
    : await ClientRecord.filter({ practitioner_id: a.practitionerId, client_email: a.clientEmail }).catch(() => []);
  if (existing[0]) {
    await ClientRecord.update(existing[0].id, { last_seen: now, client_phone: a.clientPhone || existing[0].client_phone });
  } else {
    await ClientRecord.create({
      practitioner_id: a.practitionerId, client_id: a.clientId, client_name: a.clientName,
      client_email: a.clientEmail, client_phone: a.clientPhone, first_seen: now, last_seen: now,
    });
  }
}
