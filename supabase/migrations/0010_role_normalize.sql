-- 0010 Normalize user tiers to exactly {admin, practitioner, client} and make
-- profiles.role the single source of truth. Additive + idempotent.

-- Legacy/blank/null → client.
update public.profiles set role = 'client' where role is null or role in ('user', '');

-- Anyone who owns a practitioner listing is a practitioner (unless already admin).
update public.profiles p set role = 'practitioner'
  where exists (select 1 from public.practitioners pr where pr.id = p.id)
    and coalesce(p.role, '') <> 'admin';

-- Keep role authoritative going forward: creating a practitioner listing promotes
-- the owning profile to 'practitioner' (never downgrades an admin).
create or replace function public.sync_practitioner_role()
returns trigger language plpgsql as $$
begin
  update public.profiles
     set role = 'practitioner'
   where id = new.id and coalesce(role, '') not in ('practitioner', 'admin');
  return new;
end $$;

drop trigger if exists trg_sync_practitioner_role on public.practitioners;
create trigger trg_sync_practitioner_role
  after insert on public.practitioners
  for each row execute function public.sync_practitioner_role();
