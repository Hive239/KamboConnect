-- 0013 Complete strict Row-Level Security across ALL public tables.
--
-- Supersedes the partial 0006 (which predated reactions, journal_entries, favorites,
-- follows, saved_searches, subscriptions, activity_events, push_subscriptions,
-- consultations, consent_records, client_documents, orders, availability tables).
--
-- Model:
--   SELECT  — public-read for shared content; party/owner-only for private data
--             (bookings, messages, health/consent/financial rows).
--   INSERT  — any authenticated user (created_by is stamped to auth.uid() by trigger).
--   UPDATE/DELETE — owner / two-party / admin only.
--   is_admin() overrides everywhere.
--
-- Safe to apply pre-launch: identity is unified (profiles.id == auth.uid(), set at
-- signup) and the app carries a real Supabase JWT. Existing demo rows with a null/legacy
-- created_by simply become invisible to non-admins — acceptable before real users exist.

-- ---------- helpers ----------
create or replace function public.is_admin() returns boolean language sql stable as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid()::text and p.role = 'admin')
$$;

-- Stamp created_by = auth.uid() on insert when the client didn't set it. Unforgeable
-- ownership anchor for tables without a natural owner column (event_registrations, etc.).
create or replace function public.stamp_created_by() returns trigger language plpgsql as $$
begin
  if new.created_by is null then new.created_by := auth.uid()::text; end if;
  return new;
end $$;

-- Attach the stamp trigger + enable RLS on every public table, then (re)create policies.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop trigger if exists trg_stamp_created_by on public.%I', t);
    -- only tables that actually have a created_by column
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name=t and column_name='created_by') then
      execute format('create trigger trg_stamp_created_by before insert on public.%I for each row execute function public.stamp_created_by()', t);
    end if;
  end loop;
end $$;

-- Generic policy helpers via a DO block: drop known permissive policy names first.
-- (Each table below drops its old policy by the names used in 0001/0006, then creates strict ones.)

-- Convenience: uid text
-- auth.uid()::text  == profiles.id

-- ========== PUBLIC-READ CONTENT (everyone reads; owner writes) ==========
-- profiles: public read (names/avatars), self write, admin override
drop policy if exists profiles_rw on public.profiles;
drop policy if exists profiles_self_read on public.profiles;
drop policy if exists profiles_self_write on public.profiles;
drop policy if exists profiles_self_insert on public.profiles;
drop policy if exists profiles_admin on public.profiles;
create policy profiles_read   on public.profiles for select using (true);
create policy profiles_insert on public.profiles for insert with check (id = auth.uid()::text or public.is_admin());
create policy profiles_update on public.profiles for update using (id = auth.uid()::text or public.is_admin()) with check (id = auth.uid()::text or public.is_admin());
create policy profiles_delete on public.profiles for delete using (public.is_admin());

-- Helper block to build "public read + authed insert + owner modify" tables.
do $$
declare
  r record;
  owner_col text;
begin
  -- table -> owner column for update/delete
  for r in (
    select * from (values
      ('practitioners','id'),
      ('events','practitioner_id'),
      ('products','practitioner_id'),
      ('posts','author_id'),
      ('replies','author_id'),
      ('reviews','user_id'),
      ('groups','created_by'),
      ('community_resources','created_by'),
      ('feed_items','created_by'),
      ('credentials','practitioner_id'),
      ('practitioner_availability','practitioner_id'),
      ('practitioner_blocked_dates','practitioner_id'),
      ('practitioner_exceptions','practitioner_id'),
      ('reactions','user_id'),
      ('follows','follower_id'),
      ('group_memberships','user_id')
    ) as v(tbl, owner_col)
  ) loop
    owner_col := r.owner_col;
    -- drop old permissive/0006 policies (common names)
    execute format('drop policy if exists %I on public.%I', r.tbl||'_rw', r.tbl);
    execute format('drop policy if exists %I on public.%I', r.tbl||'_read', r.tbl);
    execute format('drop policy if exists %I on public.%I', r.tbl||'_write', r.tbl);
    execute format('drop policy if exists %I on public.%I', r.tbl||'_insert', r.tbl);
    execute format('drop policy if exists %I on public.%I', r.tbl||'_modify', r.tbl);
    execute format('drop policy if exists %I on public.%I', r.tbl||'_update', r.tbl);
    execute format('drop policy if exists %I on public.%I', r.tbl||'_delete', r.tbl);
    -- strict set
    execute format('create policy %I on public.%I for select using (true)', r.tbl||'_read', r.tbl);
    execute format('create policy %I on public.%I for insert with check (auth.uid() is not null)', r.tbl||'_insert', r.tbl);
    execute format('create policy %I on public.%I for update using (%I = auth.uid()::text or public.is_admin()) with check (%I = auth.uid()::text or public.is_admin())', r.tbl||'_update', r.tbl, owner_col, owner_col);
    execute format('create policy %I on public.%I for delete using (%I = auth.uid()::text or public.is_admin())', r.tbl||'_delete', r.tbl, owner_col);
  end loop;
end $$;

-- ========== PRIVATE / TWO-PARTY (restricted reads) ==========
do $$
declare r record;
begin
  for r in (
    select * from (values
      -- tbl, read/modify predicate (owner or parties)
      ('bookings',            'client_id = auth.uid()::text or practitioner_id = auth.uid()::text'),
      ('consultations',       'client_id = auth.uid()::text or practitioner_id = auth.uid()::text'),
      ('consultation_notes',  'client_id = auth.uid()::text or practitioner_id = auth.uid()::text'),
      ('screening_responses', 'user_id = auth.uid()::text or practitioner_id = auth.uid()::text'),
      ('client_records',      'client_id = auth.uid()::text or practitioner_id = auth.uid()::text'),
      ('client_documents',    'client_id = auth.uid()::text or practitioner_id = auth.uid()::text'),
      ('consent_records',     'user_id = auth.uid()::text or practitioner_id = auth.uid()::text'),
      ('payments',            'user_id = auth.uid()::text or practitioner_id = auth.uid()::text'),
      ('messages',            'sender_id = auth.uid()::text or receiver_id = auth.uid()::text'),
      ('conversations',       'participant_1_id = auth.uid()::text or participant_2_id = auth.uid()::text'),
      ('orders',              'user_id = auth.uid()::text'),
      ('subscriptions',       'practitioner_id = auth.uid()::text'),
      ('journal_entries',     'user_id = auth.uid()::text or practitioner_id = auth.uid()::text'),
      ('push_subscriptions',  'user_id = auth.uid()::text'),
      ('saved_searches',      'user_id = auth.uid()::text'),
      ('favorites',           'user_id = auth.uid()::text'),
      ('activity_events',     'user_id = auth.uid()::text')
    ) as v(tbl, pred)
  ) loop
    execute format('drop policy if exists %I on public.%I', r.tbl||'_rw', r.tbl);
    execute format('drop policy if exists %I on public.%I', r.tbl||'_read', r.tbl);
    execute format('drop policy if exists %I on public.%I', r.tbl||'_write', r.tbl);
    execute format('create policy %I on public.%I for select using (%s or public.is_admin())', r.tbl||'_read', r.tbl, r.pred);
    execute format('create policy %I on public.%I for insert with check (auth.uid() is not null)', r.tbl||'_insert', r.tbl);
    execute format('create policy %I on public.%I for update using (%s or public.is_admin()) with check (%s or public.is_admin())', r.tbl||'_update', r.tbl, r.pred, r.pred);
    execute format('create policy %I on public.%I for delete using (%s or public.is_admin())', r.tbl||'_delete', r.tbl, r.pred);
  end loop;
end $$;

-- ========== notifications: recipient-private, but anyone authed may create ==========
drop policy if exists notifications_rw on public.notifications;
create policy notifications_read   on public.notifications for select using (user_id = auth.uid()::text or public.is_admin());
create policy notifications_insert on public.notifications for insert with check (auth.uid() is not null);
create policy notifications_update on public.notifications for update using (user_id = auth.uid()::text or public.is_admin());
create policy notifications_delete on public.notifications for delete using (user_id = auth.uid()::text or public.is_admin());

-- ========== event_registrations: registrant (created_by) or event host reads ==========
drop policy if exists event_registrations_rw on public.event_registrations;
drop policy if exists event_registrations_read on public.event_registrations;
drop policy if exists event_registrations_write on public.event_registrations;
create policy event_registrations_read on public.event_registrations for select using (
  created_by = auth.uid()::text
  or event_id in (select id from public.events where practitioner_id = auth.uid()::text)
  or public.is_admin()
);
create policy event_registrations_insert on public.event_registrations for insert with check (auth.uid() is not null);
create policy event_registrations_update on public.event_registrations for update using (
  created_by = auth.uid()::text
  or event_id in (select id from public.events where practitioner_id = auth.uid()::text)
  or public.is_admin()
);
create policy event_registrations_delete on public.event_registrations for delete using (
  created_by = auth.uid()::text
  or event_id in (select id from public.events where practitioner_id = auth.uid()::text)
  or public.is_admin()
);

-- ========== reports: reporter creates + reads own; admin manages ==========
drop policy if exists reports_rw on public.reports;
create policy reports_read   on public.reports for select using (reporter_id = auth.uid()::text or created_by = auth.uid()::text or public.is_admin());
create policy reports_insert on public.reports for insert with check (auth.uid() is not null);
create policy reports_update on public.reports for update using (public.is_admin());
create policy reports_delete on public.reports for delete using (public.is_admin());

-- ========== moderation_cases: admin only ==========
drop policy if exists moderation_cases_rw on public.moderation_cases;
create policy moderation_cases_admin on public.moderation_cases for all using (public.is_admin()) with check (public.is_admin());
