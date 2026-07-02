-- 0012 — Platform upgrades (instant booking, trust/lineage, reviews outcomes,
-- safety/compliance, integration/aftercare, deposits). Additive & idempotent.
-- RLS stays permissive-dev (using(true)) to match 0001; strict RLS deferred.

-- #4 Trust & lineage -----------------------------------------------------------
alter table public.practitioners add column if not exists lineage text;
alter table public.practitioners add column if not exists tradition jsonb;
alter table public.practitioners add column if not exists disclosed_teachers text;

-- #1 Instant booking + #2 deposits + #9 emergency contact ----------------------
alter table public.bookings add column if not exists slot_start timestamptz;
alter table public.bookings add column if not exists duration_minutes int;
alter table public.bookings add column if not exists deposit_amount numeric;
alter table public.bookings add column if not exists deposit_status text;
alter table public.bookings add column if not exists emergency_contact jsonb;

-- #7 Review outcomes -----------------------------------------------------------
alter table public.reviews add column if not exists wellbeing_before int;
alter table public.reviews add column if not exists wellbeing_after int;

-- #9 Safety/compliance ---------------------------------------------------------
alter table public.screening_responses add column if not exists medications jsonb;
alter table public.screening_responses add column if not exists interaction_flags jsonb;
alter table public.screening_responses add column if not exists emergency_contact jsonb;

-- #6 Integration & aftercare journaling ---------------------------------------
create table if not exists public.journal_entries (
  id text primary key default gen_random_uuid()::text,
  user_id text,
  booking_id text,
  practitioner_id text,
  kind text,
  mood text,
  wellbeing_rating int,
  prompt text,
  body text,
  created_by text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.journal_entries enable row level security;
drop policy if exists "journal_entries_rw" on public.journal_entries;
create policy "journal_entries_rw" on public.journal_entries for all using (true) with check (true); -- TODO tighten (owner)
create index if not exists idx_journal_user on public.journal_entries(user_id);
create index if not exists idx_journal_booking on public.journal_entries(booking_id);

-- #5 Web-push subscriptions ----------------------------------------------------
create table if not exists public.push_subscriptions (
  id text primary key default gen_random_uuid()::text,
  user_id text,
  endpoint text,
  keys jsonb,
  user_agent text,
  created_by text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "push_subscriptions_rw" on public.push_subscriptions;
create policy "push_subscriptions_rw" on public.push_subscriptions for all using (true) with check (true); -- TODO tighten (owner)
create index if not exists idx_push_user on public.push_subscriptions(user_id);

-- Realtime for live journaling (optional; safe if already added)
do $$ begin
  alter publication supabase_realtime add table public.journal_entries;
exception when duplicate_object then null; end $$;
