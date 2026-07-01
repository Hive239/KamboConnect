-- 0009 Data-integrity hardening: uniqueness, privilege-escalation block,
-- denormalization sync, and money sanity. Additive + idempotent.
-- Verified 0 existing duplicates before authoring (safe to add unique indexes).

-- ============ 1. Uniqueness (kills duplicate-race rows at the DB level) =======
create unique index if not exists uq_follows_pair
  on public.follows (follower_id, followee_id, coalesce(followee_type, ''));
create unique index if not exists uq_favorites_item
  on public.favorites (user_id, item_id, coalesce(item_type, ''));
create unique index if not exists uq_group_memberships
  on public.group_memberships (group_id, user_id);
create unique index if not exists uq_event_reg_email
  on public.event_registrations (event_id, participant_email)
  where participant_email is not null;
create unique index if not exists uq_reviews_booking
  on public.reviews (booking_id)
  where booking_id is not null;

-- ============ 2. Block client privilege escalation to admin ===================
-- profiles is world-writable under permissive-dev RLS, so any client could set
-- role='admin'. This trigger forbids UPDATEs that grant admin unless the row was
-- already admin. Admins are provisioned out-of-band (seed / service-role INSERT).
-- Practitioner grants (role='practitioner') are unaffected.
create or replace function public.block_role_escalation()
returns trigger language plpgsql as $$
begin
  if new.role = 'admin' and coalesce(old.role, '') <> 'admin' then
    raise exception 'role escalation to admin is not permitted from the client';
  end if;
  return new;
end $$;

drop trigger if exists trg_block_role_escalation on public.profiles;
create trigger trg_block_role_escalation
  before update on public.profiles
  for each row execute function public.block_role_escalation();

-- ============ 3. Denormalization sync (rename/photo propagates to copies) =====
-- practitioners.id == profiles.id (same auth uid). When a display name or image
-- changes at the source, propagate to the frozen copies so lists/threads/reviews
-- don't show stale identity. Keyed on the (shared) id.

create or replace function public.sync_profile_denorm()
returns trigger language plpgsql as $$
begin
  if new.full_name is distinct from old.full_name then
    update public.bookings          set client_name = new.full_name   where client_id  = new.id and client_name   is distinct from new.full_name;
    update public.reviews           set reviewer_name = new.full_name  where reviewer_id = new.id and reviewer_name is distinct from new.full_name;
    update public.posts             set author_name = new.full_name    where author_id  = new.id and author_name   is distinct from new.full_name;
    update public.replies           set author_name = new.full_name    where author_id  = new.id and author_name   is distinct from new.full_name;
    update public.group_memberships set user_name = new.full_name      where user_id    = new.id and user_name     is distinct from new.full_name;
    update public.feed_items        set actor_name = new.full_name     where actor_id   = new.id and actor_name    is distinct from new.full_name;
    update public.follows           set followee_name = new.full_name  where followee_id = new.id and followee_name is distinct from new.full_name;
    update public.conversations     set participant_1_name = new.full_name where participant_1_id = new.id and participant_1_name is distinct from new.full_name;
    update public.conversations     set participant_2_name = new.full_name where participant_2_id = new.id and participant_2_name is distinct from new.full_name;
  end if;
  if new.profile_image_url is distinct from old.profile_image_url then
    update public.follows    set followee_image_url = new.profile_image_url where followee_id = new.id and followee_image_url is distinct from new.profile_image_url;
    update public.feed_items set actor_image_url = new.profile_image_url    where actor_id   = new.id and actor_image_url    is distinct from new.profile_image_url;
  end if;
  return new;
end $$;

drop trigger if exists trg_sync_profile_denorm on public.profiles;
create trigger trg_sync_profile_denorm
  after update on public.profiles
  for each row execute function public.sync_profile_denorm();

create or replace function public.sync_practitioner_denorm()
returns trigger language plpgsql as $$
begin
  if new.full_name is distinct from old.full_name then
    update public.bookings set practitioner_name = new.full_name where practitioner_id = new.id and practitioner_name is distinct from new.full_name;
    update public.products set seller_name = new.full_name        where seller_id = new.id and seller_name is distinct from new.full_name;
    update public.follows  set followee_name = new.full_name      where followee_id = new.id and followee_name is distinct from new.full_name;
  end if;
  if new.profile_image_url is distinct from old.profile_image_url then
    update public.follows set followee_image_url = new.profile_image_url where followee_id = new.id and followee_image_url is distinct from new.profile_image_url;
  end if;
  return new;
end $$;

drop trigger if exists trg_sync_practitioner_denorm on public.practitioners;
create trigger trg_sync_practitioner_denorm
  after update on public.practitioners
  for each row execute function public.sync_practitioner_denorm();

-- ============ 4. Money sanity (DB-level floor; app/server still authoritative) =
-- NOT VALID so any legacy row can't block the migration; enforced for new writes.
alter table public.bookings add constraint chk_bookings_price_nonneg check (price is null or price >= 0) not valid;
alter table public.payments add constraint chk_payments_amount_nonneg check (amount is null or amount >= 0) not valid;
alter table public.orders   add constraint chk_orders_total_nonneg  check (total is null or total >= 0) not valid;
alter table public.products add constraint chk_products_price_nonneg check (price is null or price >= 0) not valid;
