-- Concurrency guards. Two TOCTOU races existed with no DB backstop:
--   1. Two clients could book the SAME practitioner slot (app only filters taken
--      slots at display time; the write does no re-check).
--   2. Two concurrent event registrations could both claim the last seat
--      (capacity is a stale read-then-write in src/lib/eventRegistration.ts).

-- (1) Prevent double-booking a slot: at most one active booking per
--     (practitioner, slot_start). Partial so cancelled/declined + "arrange a time"
--     (null slot) rows don't collide. Verified 0 existing duplicates before adding.
create unique index if not exists uq_booking_active_slot
  on public.bookings (practitioner_id, slot_start)
  where status in ('pending', 'confirmed') and slot_start is not null;

-- (2) Enforce event capacity atomically. A per-event advisory lock serializes the
--     capacity decision so concurrent inserts can't both see the last seat free;
--     an over-capacity confirmed registration is forced to 'waitlist'. This is the
--     authoritative backstop — the client-side check becomes a UX hint only.
create or replace function enforce_event_capacity() returns trigger as $$
declare cap int; taken int;
begin
  if NEW.registration_status = 'confirmed' then
    perform pg_advisory_xact_lock(hashtext(NEW.event_id)::bigint);
    select max_participants into cap from public.events where id = NEW.event_id;
    if cap is not null and cap > 0 then
      select count(*) into taken from public.event_registrations
        where event_id = NEW.event_id and registration_status = 'confirmed';
      if taken >= cap then
        NEW.registration_status := 'waitlist';
      end if;
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_enforce_event_capacity on public.event_registrations;
create trigger trg_enforce_event_capacity
  before insert on public.event_registrations
  for each row execute function enforce_event_capacity();
