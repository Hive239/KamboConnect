-- 0013 Observability — error + email analytics tables.
create table if not exists public.error_logs (
  id text primary key default gen_random_uuid()::text,
  message text,
  stack text,
  context jsonb default '{}'::jsonb,
  path text,
  user_id text,
  created_date timestamptz not null default now()
);
alter table public.error_logs enable row level security;
drop policy if exists error_logs_rw on public.error_logs;
create policy error_logs_rw on public.error_logs for all using (true) with check (true); -- dev-permissive
create index if not exists idx_error_logs_created on public.error_logs(created_date);

create table if not exists public.email_events (
  id text primary key default gen_random_uuid()::text,
  to_email text,
  subject text,
  type text,               -- sent | failed | skipped | delivered | opened | clicked
  provider_id text,
  meta jsonb default '{}'::jsonb,
  created_date timestamptz not null default now()
);
alter table public.email_events enable row level security;
drop policy if exists email_events_rw on public.email_events;
create policy email_events_rw on public.email_events for all using (true) with check (true); -- dev-permissive
create index if not exists idx_email_events_created on public.email_events(created_date);
create index if not exists idx_email_events_type on public.email_events(type);
