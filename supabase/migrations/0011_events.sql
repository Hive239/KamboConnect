-- 0011 Typed event taxonomy — extend activity_events for real funnels.
alter table public.activity_events add column if not exists entity_id text;
alter table public.activity_events add column if not exists meta jsonb default '{}'::jsonb;
create index if not exists idx_activity_events_type on public.activity_events(type);
