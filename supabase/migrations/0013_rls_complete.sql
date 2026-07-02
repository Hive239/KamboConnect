-- 0013 Complete strict Row-Level Security across ALL public tables.
--
-- Supersedes the partial 0006. Runs in a single transaction (atomic — either the
-- whole policy set applies or nothing does).
--
-- Identity model (verified against the app):
--   * profile / client / sender / receiver / user_id columns == auth.uid()  (the profile id)
--   * practitioner_id columns == practitioners.id  (NOT auth.uid) — resolved via
--     owns_practitioner(): the practitioner row whose user_id == auth.uid().
--   * created_by is stamped to auth.uid() by trigger on every insert → a reliable
--     ownership anchor for tables without a natural owner column.
--
-- Model: SELECT public-read for shared content / party-only for private data;
--        INSERT authenticated; UPDATE/DELETE owner / two-party / admin.

begin;

-- ---------- helpers ----------
create or replace function public.is_admin() returns boolean language sql stable as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid()::text and p.role = 'admin')
$$;

-- True when `pid` is a practitioners.id owned by the current auth user.
create or replace function public.owns_practitioner(pid text) returns boolean language sql stable as $$
  select pid is not null and exists (
    select 1 from public.practitioners pr
    where pr.id = pid and (pr.user_id = auth.uid()::text or pr.id = auth.uid()::text)
  )
$$;

create or replace function public.stamp_created_by() returns trigger language plpgsql as $$
begin
  if new.created_by is null then new.created_by := auth.uid()::text; end if;
  return new;
end $$;

-- Enable RLS + attach created_by stamp trigger on every table that has the column.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop trigger if exists trg_stamp_created_by on public.%I', t);
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name=t and column_name='created_by') then
      execute format('create trigger trg_stamp_created_by before insert on public.%I for each row execute function public.stamp_created_by()', t);
    end if;
  end loop;
end $$;

-- Drop ALL existing policies (clean slate) so re-runs are deterministic.
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- ========== profiles: public read, self write ==========
create policy profiles_read   on public.profiles for select using (true);
create policy profiles_insert on public.profiles for insert with check (id = auth.uid()::text or public.is_admin());
create policy profiles_update on public.profiles for update using (id = auth.uid()::text or public.is_admin()) with check (id = auth.uid()::text or public.is_admin());
create policy profiles_delete on public.profiles for delete using (public.is_admin());

-- ========== PUBLIC-READ CONTENT (public read; authed insert; owner/admin modify) ==========
do $$
declare r record; own text;
begin
  for r in (
    select * from (values
      ('practitioners',            'user_id = auth.uid()::text or id = auth.uid()::text or created_by = auth.uid()::text'),
      ('events',                   'public.owns_practitioner(practitioner_id) or created_by = auth.uid()::text'),
      ('products',                 'seller_id = auth.uid()::text or public.owns_practitioner(seller_id) or created_by = auth.uid()::text'),
      ('credentials',              'public.owns_practitioner(practitioner_id) or created_by = auth.uid()::text'),
      ('practitioner_availability','public.owns_practitioner(practitioner_id) or created_by = auth.uid()::text'),
      ('practitioner_blocked_dates','public.owns_practitioner(practitioner_id) or created_by = auth.uid()::text'),
      ('practitioner_exceptions',  'public.owns_practitioner(practitioner_id) or created_by = auth.uid()::text'),
      ('posts',                    'author_id = auth.uid()::text or created_by = auth.uid()::text'),
      ('replies',                  'author_id = auth.uid()::text or created_by = auth.uid()::text'),
      ('reviews',                  'created_by = auth.uid()::text'),
      ('groups',                   'created_by = auth.uid()::text'),
      ('community_resources',      'created_by = auth.uid()::text'),
      ('feed_items',               'created_by = auth.uid()::text'),
      ('reactions',                'user_id = auth.uid()::text or created_by = auth.uid()::text'),
      ('follows',                  'follower_id = auth.uid()::text or created_by = auth.uid()::text')
    ) as v(tbl, own)
  ) loop
    own := r.own;
    execute format('create policy %I on public.%I for select using (true)', r.tbl||'_read', r.tbl);
    execute format('create policy %I on public.%I for insert with check (auth.uid() is not null)', r.tbl||'_insert', r.tbl);
    execute format('create policy %I on public.%I for update using (%s or public.is_admin()) with check (%s or public.is_admin())', r.tbl||'_update', r.tbl, own, own);
    execute format('create policy %I on public.%I for delete using (%s or public.is_admin())', r.tbl||'_delete', r.tbl, own);
  end loop;
end $$;

-- group_memberships: public read; self insert; self OR group-owner OR admin remove.
create policy group_memberships_read   on public.group_memberships for select using (true);
create policy group_memberships_insert on public.group_memberships for insert with check (auth.uid() is not null);
create policy group_memberships_update on public.group_memberships for update using (
  user_id = auth.uid()::text or created_by = auth.uid()::text
  or group_id in (select id from public.groups where created_by = auth.uid()::text) or public.is_admin());
create policy group_memberships_delete on public.group_memberships for delete using (
  user_id = auth.uid()::text or created_by = auth.uid()::text
  or group_id in (select id from public.groups where created_by = auth.uid()::text) or public.is_admin());

-- ========== PRIVATE / TWO-PARTY (restricted reads) ==========
do $$
declare r record;
begin
  for r in (
    select * from (values
      ('bookings',            'client_id = auth.uid()::text or public.owns_practitioner(practitioner_id) or created_by = auth.uid()::text'),
      ('consultations',       'client_id = auth.uid()::text or public.owns_practitioner(practitioner_id) or created_by = auth.uid()::text'),
      ('consultation_notes',  'client_id = auth.uid()::text or public.owns_practitioner(practitioner_id) or created_by = auth.uid()::text'),
      ('screening_responses', 'user_id = auth.uid()::text or public.owns_practitioner(practitioner_id) or created_by = auth.uid()::text'),
      ('client_records',      'client_id = auth.uid()::text or public.owns_practitioner(practitioner_id) or created_by = auth.uid()::text'),
      ('client_documents',    'client_id = auth.uid()::text or public.owns_practitioner(practitioner_id) or created_by = auth.uid()::text'),
      ('consent_records',     'user_id = auth.uid()::text or public.owns_practitioner(practitioner_id) or created_by = auth.uid()::text'),
      ('payments',            'user_id = auth.uid()::text or public.owns_practitioner(practitioner_id) or created_by = auth.uid()::text'),
      ('subscriptions',       'public.owns_practitioner(practitioner_id) or created_by = auth.uid()::text'),
      ('messages',            'sender_id = auth.uid()::text or receiver_id = auth.uid()::text or created_by = auth.uid()::text'),
      ('conversations',       'participant_1_id = auth.uid()::text or participant_2_id = auth.uid()::text or created_by = auth.uid()::text'),
      ('orders',              'user_id = auth.uid()::text or created_by = auth.uid()::text'),
      ('journal_entries',     'user_id = auth.uid()::text or public.owns_practitioner(practitioner_id) or created_by = auth.uid()::text'),
      ('push_subscriptions',  'user_id = auth.uid()::text or created_by = auth.uid()::text'),
      ('saved_searches',      'user_id = auth.uid()::text or created_by = auth.uid()::text'),
      ('favorites',           'user_id = auth.uid()::text or created_by = auth.uid()::text'),
      ('activity_events',     'user_id = auth.uid()::text or created_by = auth.uid()::text')
    ) as v(tbl, pred)
  ) loop
    execute format('create policy %I on public.%I for select using (%s or public.is_admin())', r.tbl||'_read', r.tbl, r.pred);
    execute format('create policy %I on public.%I for insert with check (auth.uid() is not null)', r.tbl||'_insert', r.tbl);
    execute format('create policy %I on public.%I for update using (%s or public.is_admin()) with check (%s or public.is_admin())', r.tbl||'_update', r.tbl, r.pred, r.pred);
    execute format('create policy %I on public.%I for delete using (%s or public.is_admin())', r.tbl||'_delete', r.tbl, r.pred);
  end loop;
end $$;

-- ========== notifications: recipient-private, anyone authed may create ==========
create policy notifications_read   on public.notifications for select using (user_id = auth.uid()::text or public.is_admin());
create policy notifications_insert on public.notifications for insert with check (auth.uid() is not null);
create policy notifications_update on public.notifications for update using (user_id = auth.uid()::text or public.is_admin());
create policy notifications_delete on public.notifications for delete using (user_id = auth.uid()::text or public.is_admin());

-- ========== event_registrations: registrant (created_by) or event host ==========
create policy event_registrations_read on public.event_registrations for select using (
  created_by = auth.uid()::text
  or event_id in (select id from public.events where public.owns_practitioner(practitioner_id))
  or public.is_admin());
create policy event_registrations_insert on public.event_registrations for insert with check (auth.uid() is not null);
create policy event_registrations_update on public.event_registrations for update using (
  created_by = auth.uid()::text
  or event_id in (select id from public.events where public.owns_practitioner(practitioner_id))
  or public.is_admin());
create policy event_registrations_delete on public.event_registrations for delete using (
  created_by = auth.uid()::text
  or event_id in (select id from public.events where public.owns_practitioner(practitioner_id))
  or public.is_admin());

-- ========== reports: reporter creates + reads own; admin manages ==========
create policy reports_read   on public.reports for select using (reporter_id = auth.uid()::text or created_by = auth.uid()::text or public.is_admin());
create policy reports_insert on public.reports for insert with check (auth.uid() is not null);
create policy reports_update on public.reports for update using (public.is_admin());
create policy reports_delete on public.reports for delete using (public.is_admin());

-- ========== moderation_cases: admin only ==========
create policy moderation_cases_admin on public.moderation_cases for all using (public.is_admin()) with check (public.is_admin());

commit;
