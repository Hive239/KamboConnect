/**
 * Shared availability/slot engine — the single source of truth for "what times
 * can this practitioner be booked on this date." Composes weekly availability,
 * exceptions, and blocked dates (extracted from DirectBookingModal), then
 * **removes slots already taken by active bookings** so no slot double-books.
 * Used by both booking paths (DirectBookingModal + BookingRequest).
 */
import {
  PractitionerAvailability,
  PractitionerBlockedDate,
  PractitionerException,
  Booking,
} from '@/entities/all';
import { format, parse, isSameDay } from 'date-fns';

/** Bookings in these states hold a slot (so it can't be re-booked). */
const ACTIVE_STATUSES = ['pending', 'confirmed'];

export function generateTimeSlots(start: string, end: string, interval = 60): string[] {
  const slots: string[] = [];
  if (!start || !end) return slots;
  let cur = parse(start, 'HH:mm', new Date());
  const endTime = parse(end, 'HH:mm', new Date());
  while (cur < endTime) {
    slots.push(format(cur, 'HH:mm'));
    cur = new Date(cur.getTime() + interval * 60000);
  }
  return slots;
}

/**
 * Returns the bookable `HH:mm` slots for a practitioner on a given date,
 * with already-booked slots removed.
 */
export async function getAvailableSlots(
  practitionerId: string,
  date: Date,
  interval = 60,
): Promise<string[]> {
  const dayOfWeek = format(date, 'eeee').toLowerCase();

  const [weeklyAvail, blockedDates, exceptions, bookings] = await Promise.all([
    PractitionerAvailability.filter({ practitioner_id: practitionerId, day_of_week: dayOfWeek }),
    PractitionerBlockedDate.filter({ practitioner_id: practitionerId }),
    PractitionerException.filter({ practitioner_id: practitionerId, date: format(date, 'yyyy-MM-dd') }),
    Booking.filter({ practitioner_id: practitionerId }),
  ]);

  // 1. Base = weekly availability
  let baseSlots: string[] = (weeklyAvail as any[])
    .filter((a) => a.is_available)
    .flatMap((a) => generateTimeSlots(a.start_time, a.end_time, interval));

  // 2. Apply exceptions
  const overrideException = (exceptions as any[]).find((e) => e.exception_type === 'override');
  const additionalExceptions = (exceptions as any[]).filter((e) => e.exception_type === 'additional');
  const removeExceptions = (exceptions as any[]).filter((e) => e.exception_type === 'remove');

  if (overrideException) baseSlots = generateTimeSlots(overrideException.start_time, overrideException.end_time, interval);
  additionalExceptions.forEach((e) => baseSlots.push(...generateTimeSlots(e.start_time, e.end_time, interval)));
  if (removeExceptions.length > 0) {
    const removeRanges = removeExceptions.map((e) => ({ start: parse(e.start_time, 'HH:mm', date), end: parse(e.end_time, 'HH:mm', date) }));
    baseSlots = baseSlots.filter((slot) => {
      const t = parse(slot, 'HH:mm', date);
      return !removeRanges.some((r) => t >= r.start && t < r.end);
    });
  }

  // 3. Blocked dates
  const todayBlocks = (blockedDates as any[]).filter((b) => isSameDay(new Date(b.date), date));
  let finalSlots: string[];
  if (todayBlocks.some((b) => b.block_type === 'full_day')) {
    finalSlots = [];
  } else {
    const ranges = todayBlocks
      .filter((b) => b.block_type === 'partial_day')
      .map((b) => ({ start: parse(b.start_time, 'HH:mm', date), end: parse(b.end_time, 'HH:mm', date) }));
    finalSlots = baseSlots.filter((slot) => {
      const t = parse(slot, 'HH:mm', date);
      return !ranges.some((r) => t >= r.start && t < r.end);
    });
  }

  // 4. Remove slots already taken by active bookings (prevents double-booking)
  const taken = new Set(
    (bookings as any[])
      .filter((b) => ACTIVE_STATUSES.includes(b.status))
      .map((b) => b.slot_start || b.requested_date)
      .filter(Boolean)
      .filter((iso: string) => {
        const d = new Date(iso);
        return !isNaN(d.getTime()) && isSameDay(d, date);
      })
      .map((iso: string) => format(new Date(iso), 'HH:mm')),
  );
  finalSlots = finalSlots.filter((s) => !taken.has(s));

  // Drop past times if the date is today
  if (isSameDay(date, new Date())) {
    const now = format(new Date(), 'HH:mm');
    finalSlots = finalSlots.filter((s) => s > now);
  }

  return [...new Set(finalSlots)].sort();
}
