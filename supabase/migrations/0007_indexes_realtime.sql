-- 0006 Performance indexes + realtime for follows.
-- Additive + idempotent. Safe to apply anytime (no RLS/policy changes here).

-- ---- Missing indexes on hot query paths ------------------------------------
-- Client-side bookings list (only practitioner_id was indexed).
create index if not exists idx_bookings_client on public.bookings(client_id);

-- Admin verification queues + directory filters (table had no indexes).
create index if not exists idx_practitioners_verification_level on public.practitioners(verification_level);
create index if not exists idx_practitioners_email on public.practitioners(email);

-- Messaging lookups (only participant_1_id was indexed).
create index if not exists idx_conversations_related_booking on public.conversations(related_booking_id);
create index if not exists idx_conversations_participant_2 on public.conversations(participant_2_id);

-- Reviews: client "has reviewed?" checks + admin flagged queue.
create index if not exists idx_reviews_reviewer on public.reviews(reviewer_id);
create index if not exists idx_reviews_flagged on public.reviews(flagged);

-- Admin report queue by status.
create index if not exists idx_reports_status on public.reports(status);

-- Practitioner billing/earnings.
create index if not exists idx_payments_practitioner on public.payments(practitioner_id);

-- Profile lookups by email / role.
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_role on public.profiles(role);

-- CRM consultation notes (table had no indexes).
create index if not exists idx_consultation_notes_practitioner on public.consultation_notes(practitioner_id);
create index if not exists idx_consultation_notes_client on public.consultation_notes(client_id);

-- ---- Realtime: follows -----------------------------------------------------
-- FeedView subscribes to Follow changes to refresh the "Following" feed across
-- devices. Add the table to the realtime publication (guarded — re-runnable).
do $$
begin
  alter publication supabase_realtime add table public.follows;
exception
  when duplicate_object then null; -- already in the publication
end $$;
