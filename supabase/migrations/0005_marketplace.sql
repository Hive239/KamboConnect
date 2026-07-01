-- 0005 Marketplace core: identity, consultations, CRM, waiver filing.
-- Additive + idempotent. Strict RLS comes in 0006 (these get permissive dev policies for now).

-- Practitioner listing is owned by an auth user (practitioners.id = profiles.id = auth uid).
alter table public.practitioners add column if not exists user_id text;

-- Booking: link to originating consultation + waiver hard-gate flag.
alter table public.bookings add column if not exists consultation_id text;
alter table public.bookings add column if not exists waiver_signed boolean default false;

-- Consent record: the filed waiver PDF + which version was signed.
alter table public.consent_records add column if not exists document_url text;
alter table public.consent_records add column if not exists waiver_version text;

-- Consultations: the pre-booking stage (client requests → practitioner schedules → converts to booking).
create table if not exists public.consultations (
  id text primary key default gen_random_uuid()::text,
  client_id text,
  client_name text,
  client_email text,
  practitioner_id text,
  practitioner_name text,
  requested_time timestamptz,
  status text default 'requested', -- requested | scheduled | completed | declined | converted
  message text,
  notes text,
  booking_id text,
  created_by text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.consultations enable row level security;
drop policy if exists "consultations_rw" on public.consultations;
create policy "consultations_rw" on public.consultations for all using (true) with check (true); -- tightened in 0006

-- Client records: the practitioner CRM row (one per practitioner+client).
create table if not exists public.client_records (
  id text primary key default gen_random_uuid()::text,
  practitioner_id text,
  client_id text,
  client_name text,
  client_email text,
  client_phone text,
  tags jsonb,
  notes text,
  first_seen timestamptz,
  last_seen timestamptz,
  created_by text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.client_records enable row level security;
drop policy if exists "client_records_rw" on public.client_records;
create policy "client_records_rw" on public.client_records for all using (true) with check (true); -- tightened in 0006

-- Consultation / session notes (practitioner-authored, private).
create table if not exists public.consultation_notes (
  id text primary key default gen_random_uuid()::text,
  practitioner_id text,
  client_id text,
  booking_id text,
  consultation_id text,
  body text,
  created_by text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.consultation_notes enable row level security;
drop policy if exists "consultation_notes_rw" on public.consultation_notes;
create policy "consultation_notes_rw" on public.consultation_notes for all using (true) with check (true); -- tightened in 0006

-- Client documents: links a Storage file (waiver PDF, intake, id) to a client + practitioner.
create table if not exists public.client_documents (
  id text primary key default gen_random_uuid()::text,
  practitioner_id text,
  client_id text,
  booking_id text,
  kind text, -- waiver | intake | id | other
  title text,
  file_url text,
  created_by text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.client_documents enable row level security;
drop policy if exists "client_documents_rw" on public.client_documents;
create policy "client_documents_rw" on public.client_documents for all using (true) with check (true); -- tightened in 0006

create index if not exists idx_consultations_practitioner on public.consultations(practitioner_id);
create index if not exists idx_consultations_client on public.consultations(client_id);
create index if not exists idx_client_records_practitioner on public.client_records(practitioner_id);
create index if not exists idx_client_documents_client on public.client_documents(client_id);
