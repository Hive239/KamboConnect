-- 0009 Practitioner course directory (training programs listed for prospective practitioners).
create table if not exists public.courses (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  provider text,
  description text,
  url text,
  location text,
  format text,                      -- 'online' | 'in_person' | 'hybrid'
  duration text,
  price numeric,
  currency text default 'USD',
  image_url text,
  lineage text,                     -- e.g. Matsés, Katukina
  is_featured boolean default false,
  status text default 'published',  -- 'published' | 'draft'
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);
alter table public.courses enable row level security;
drop policy if exists courses_read on public.courses;
create policy courses_read on public.courses for select using (true);
drop policy if exists courses_write on public.courses;
create policy courses_write on public.courses for all using (true) with check (true);
create index if not exists courses_status_idx on public.courses (status);
