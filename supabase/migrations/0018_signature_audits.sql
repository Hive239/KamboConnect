-- 0018 E-signature audit trail (ESIGN/UETA). One row per signed waiver.
create table if not exists public.signature_audits (
  id uuid primary key default gen_random_uuid(),
  audit_id text unique,
  booking_id text,
  user_id uuid,
  signer_name text,
  doc_hash text,             -- SHA-256 of the exact filed PDF
  document_url text,
  document_version text,
  ip text,
  user_agent text,
  signature_image_url text,
  signed_at timestamptz default now(),
  created_at timestamptz default now()
);
alter table public.signature_audits enable row level security;
-- Signer can read their own audit rows; inserts happen via the app (authenticated).
drop policy if exists sig_own_select on public.signature_audits;
create policy sig_own_select on public.signature_audits for select using (auth.uid() = user_id);
drop policy if exists sig_own_insert on public.signature_audits;
create policy sig_own_insert on public.signature_audits for insert with check (auth.uid() = user_id);
