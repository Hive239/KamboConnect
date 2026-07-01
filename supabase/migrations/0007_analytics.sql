-- 0007 Analytics instrumentation: engagement events + acquisition attribution.

-- Lightweight activity log for DAU/WAU/MAU (throttled client-side to ~1/user/30min).
create table if not exists public.activity_events (
  id text primary key default gen_random_uuid()::text,
  user_id text,
  type text,       -- e.g. 'page_view'
  path text,
  created_by text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.activity_events enable row level security;
drop policy if exists "activity_events_rw" on public.activity_events;
create policy "activity_events_rw" on public.activity_events for all using (true) with check (true); -- dev-permissive
create index if not exists idx_activity_events_created on public.activity_events(created_date);
create index if not exists idx_activity_events_user on public.activity_events(user_id);

-- Signup acquisition attribution (source/medium/campaign/referrer/landing).
alter table public.profiles add column if not exists acquisition jsonb;

-- Subscription cancellation timestamp (for churn/NRR).
alter table public.subscriptions add column if not exists canceled_at timestamptz;
