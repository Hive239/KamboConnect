-- 0015 Signup approval flow.
-- Grandfather existing users so no one is locked out: any null status → active.
update public.profiles set status = 'active' where status is null;
-- Practitioner's tier chosen at signup (applied on approval; charged later).
alter table public.practitioners add column if not exists desired_tier text;
