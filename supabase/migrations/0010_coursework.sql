-- 0010 Built-in coursework enrollments + progress (paid educational tracks).
create table if not exists public.coursework_enrollments (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  track text not null,                 -- 'practitioner' | 'client'
  status text default 'active',        -- 'active'
  price numeric,
  paid_at timestamptz,
  progress jsonb default '{}'::jsonb,   -- { lessonId: { completed: true, score: n } }
  completed_at timestamptz,
  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  unique (user_id, track)
);
alter table public.coursework_enrollments enable row level security;
drop policy if exists cw_all on public.coursework_enrollments;
create policy cw_all on public.coursework_enrollments for all using (true) with check (true);
create index if not exists cw_user_idx on public.coursework_enrollments (user_id);
