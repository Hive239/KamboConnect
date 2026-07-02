import { EventRegistration, Event, Notification, User } from '@/entities/all';

/**
 * Register for an event with dedup + capacity handling. When the event is full
 * the registration is placed on the waitlist (registration_status:'waitlist')
 * and does NOT consume a seat. Returns the resulting status + participant count.
 */
export async function submitRegistration(event: any, data: any): Promise<{ status: 'confirmed' | 'waitlist'; current_participants: number }> {
  if (data.participant_email) {
    const existing = await EventRegistration.filter({ event_id: event.id, participant_email: data.participant_email }).catch(() => []);
    if (existing.length) throw new Error("You're already registered for this event.");
  }
  const full = !!event.max_participants && (event.current_participants || 0) >= event.max_participants;
  const status: 'confirmed' | 'waitlist' = full ? 'waitlist' : 'confirmed';
  await EventRegistration.create({ ...data, registration_status: status });
  let current = event.current_participants || 0;
  if (!full) {
    current += 1;
    try { await Event.update(event.id, { current_participants: current }); } catch { /* non-fatal */ }
  }
  return { status, current_participants: current };
}

/**
 * Cancel a confirmed registration and auto-promote the oldest waitlisted person
 * into the freed seat (best-effort notify). Returns the new participant count.
 */
export async function cancelAndPromote(reg: any, event: any): Promise<{ current_participants: number; promoted: any | null }> {
  await EventRegistration.delete(reg.id);
  let count = Math.max(0, (event.current_participants || 1) - 1);
  let promoted: any = null;

  if (reg.registration_status !== 'waitlist') {
    // A confirmed seat freed up — promote the oldest waitlist entry into it.
    const waitlist = await EventRegistration.filter({ event_id: event.id, registration_status: 'waitlist' }, 'created_date').catch(() => []);
    if (waitlist.length) {
      promoted = waitlist[0];
      await EventRegistration.update(promoted.id, { registration_status: 'confirmed' });
      count += 1; // seat re-filled by promotion
      try {
        const [u] = promoted.participant_email ? await User.filter({ email: promoted.participant_email }) : [];
        if (u) await Notification.create({ user_id: u.id, title: "You're off the waitlist!", message: `A spot opened up for "${event.title}" — you're now confirmed.`, type: "event", related_id: event.id, action_url: `/EventDetail?id=${event.id}` });
      } catch { /* notify is best-effort */ }
    }
  }
  try { await Event.update(event.id, { current_participants: count }); } catch { /* non-fatal */ }
  return { current_participants: count, promoted };
}
