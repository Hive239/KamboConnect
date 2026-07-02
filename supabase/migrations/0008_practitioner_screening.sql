-- 0008 Practitioner onboarding screening fields (from the vetting standard):
-- who certified you, # ceremonies, experience with medical conditions, client references.
alter table public.practitioners add column if not exists certified_by text;
alter table public.practitioners add column if not exists ceremonies_count integer;
alter table public.practitioners add column if not exists condition_experience text;
alter table public.practitioners add column if not exists client_references jsonb;
