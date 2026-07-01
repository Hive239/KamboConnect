-- 0006 Strict Row-Level Security.
--
-- ⚠️ APPLY ONLY DURING THE REAL-AUTH CUTOVER (after wiping demo data and when every
-- request carries a real Supabase JWT). Applying while the app still uses the mock/anon
-- session will block all reads/writes. Requires profiles.id == auth.uid()::text and
-- practitioners.id == owner auth uid (Phase 0 identity unification).
--
-- Pattern: public-read content · owner-only private · two-party (client OR practitioner) · admin override.

-- Admin check helper.
create or replace function public.is_admin() returns boolean language sql stable as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid()::text and p.role = 'admin')
$$;

-- Helper to drop a table's existing (permissive) policies before re-creating strict ones.
-- (Run per-table below; Postgres has no "drop all policies" so we drop by known names.)

-- ---------- profiles: self read/write; public can read minimal (needed for names/avatars) ----------
drop policy if exists "profiles_rw" on public.profiles;
create policy "profiles_self_read"  on public.profiles for select using (true); -- names/avatars are shown publicly
create policy "profiles_self_write" on public.profiles for update using (id = auth.uid()::text) with check (id = auth.uid()::text);
create policy "profiles_self_insert" on public.profiles for insert with check (id = auth.uid()::text);
create policy "profiles_admin"      on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Public-read content, owner/author writes ----------
-- practitioners (owner = id)
drop policy if exists "practitioners_read" on public.practitioners;
drop policy if exists "practitioners_write" on public.practitioners;
create policy "practitioners_read"  on public.practitioners for select using (true);
create policy "practitioners_write" on public.practitioners for all using (id = auth.uid()::text or public.is_admin()) with check (id = auth.uid()::text or public.is_admin());

-- events (owner = practitioner_id)
drop policy if exists "events_read" on public.events;
drop policy if exists "events_write" on public.events;
create policy "events_read"  on public.events for select using (true);
create policy "events_write" on public.events for all using (practitioner_id = auth.uid()::text or public.is_admin()) with check (practitioner_id = auth.uid()::text or public.is_admin());

-- reviews (public read; author = user_id/reviewer writes; keep insert open to authenticated)
drop policy if exists "reviews_read" on public.reviews;
drop policy if exists "reviews_write" on public.reviews;
create policy "reviews_read"   on public.reviews for select using (true);
create policy "reviews_insert" on public.reviews for insert with check (auth.uid()::text is not null);
create policy "reviews_update" on public.reviews for update using (user_id = auth.uid()::text or practitioner_id = auth.uid()::text or public.is_admin());
create policy "reviews_delete" on public.reviews for delete using (user_id = auth.uid()::text or public.is_admin());

-- posts / replies (public read; author writes)
drop policy if exists "posts_read" on public.posts;
drop policy if exists "posts_write" on public.posts;
create policy "posts_read"   on public.posts for select using (true);
create policy "posts_insert" on public.posts for insert with check (auth.uid()::text is not null);
create policy "posts_modify" on public.posts for update using (author_id = auth.uid()::text or public.is_admin());
create policy "posts_delete" on public.posts for delete using (author_id = auth.uid()::text or public.is_admin());
drop policy if exists "replies_read" on public.replies;
drop policy if exists "replies_write" on public.replies;
create policy "replies_read"   on public.replies for select using (true);
create policy "replies_insert" on public.replies for insert with check (auth.uid()::text is not null);
create policy "replies_modify" on public.replies for update using (author_id = auth.uid()::text or public.is_admin());
create policy "replies_delete" on public.replies for delete using (author_id = auth.uid()::text or public.is_admin());

-- groups / memberships / feed / community resources / products (public read)
drop policy if exists "groups_read" on public.groups; drop policy if exists "groups_write" on public.groups;
create policy "groups_read" on public.groups for select using (true);
create policy "groups_write" on public.groups for all using (created_by = auth.uid()::text or public.is_admin()) with check (auth.uid()::text is not null);
drop policy if exists "group_memberships_rw" on public.group_memberships;
create policy "group_memberships_read" on public.group_memberships for select using (true);
create policy "group_memberships_write" on public.group_memberships for all using (user_id = auth.uid()::text or public.is_admin()) with check (user_id = auth.uid()::text);
drop policy if exists "feed_items_read" on public.feed_items; drop policy if exists "feed_items_write" on public.feed_items;
create policy "feed_items_read" on public.feed_items for select using (true);
create policy "feed_items_insert" on public.feed_items for insert with check (auth.uid()::text is not null);
drop policy if exists "community_resources_read" on public.community_resources; drop policy if exists "community_resources_write" on public.community_resources;
create policy "community_resources_read" on public.community_resources for select using (true);
create policy "community_resources_write" on public.community_resources for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "products_read" on public.products; drop policy if exists "products_write" on public.products;
create policy "products_read" on public.products for select using (true);
create policy "products_write" on public.products for all using (seller_id = auth.uid()::text or public.is_admin()) with check (seller_id = auth.uid()::text or public.is_admin());

-- practitioner availability/blocked/exceptions (public read for booking; owner writes)
do $$ declare t text; begin
  foreach t in array array['practitioner_availability','practitioner_blocked_dates','practitioner_exceptions'] loop
    execute format('drop policy if exists %I on public.%I', t||'_read', t);
    execute format('drop policy if exists %I on public.%I', t||'_write', t);
    execute format('drop policy if exists %I on public.%I', t||'_rw', t);
    execute format('create policy %I on public.%I for select using (true)', t||'_read', t);
    execute format('create policy %I on public.%I for all using (practitioner_id = auth.uid()::text or public.is_admin()) with check (practitioner_id = auth.uid()::text or public.is_admin())', t||'_write', t);
  end loop;
end $$;

-- ---------- Owner-only private ----------
do $$ declare r record; begin
  for r in select * from (values
    ('saved_searches','user_id'), ('favorites','user_id'), ('follows','follower_id'),
    ('orders','user_id')
  ) as x(tbl, col) loop
    execute format('drop policy if exists %I on public.%I', r.tbl||'_rw', r.tbl);
    execute format('drop policy if exists %I on public.%I', r.tbl||'_read', r.tbl);
    execute format('drop policy if exists %I on public.%I', r.tbl||'_write', r.tbl);
    execute format('create policy %I on public.%I for all using (%I = auth.uid()::text or public.is_admin()) with check (%I = auth.uid()::text)', r.tbl||'_owner', r.tbl, r.col, r.col);
  end loop;
end $$;

-- notifications: the OWNER reads/updates/deletes their own, but any authenticated
-- user may INSERT a notification for another user (the app's notify-others pattern —
-- booking notifies the practitioner, a message notifies the recipient, etc.).
-- (Owner-only insert would break every cross-user notification.)
drop policy if exists "notifications_rw" on public.notifications;
drop policy if exists "notifications_owner" on public.notifications;
create policy "notifications_owner_read"   on public.notifications for select using (user_id = auth.uid()::text or public.is_admin());
create policy "notifications_owner_modify" on public.notifications for update using (user_id = auth.uid()::text or public.is_admin()) with check (user_id = auth.uid()::text or public.is_admin());
create policy "notifications_owner_delete" on public.notifications for delete using (user_id = auth.uid()::text or public.is_admin());
create policy "notifications_auth_insert"  on public.notifications for insert with check (auth.uid()::text is not null);

-- ---------- Two-party (client OR practitioner) ----------
-- bookings, consultations, screening_responses, consent_records, client_records,
-- consultation_notes, client_documents, payments  → visible to the client or the practitioner.
do $$ declare r record; begin
  for r in select * from (values
    ('bookings','client_id','practitioner_id'),
    ('consultations','client_id','practitioner_id'),
    ('screening_responses','user_id','practitioner_id'),
    ('consent_records','user_id','practitioner_id'),
    ('client_records','client_id','practitioner_id'),
    ('consultation_notes','client_id','practitioner_id'),
    ('client_documents','client_id','practitioner_id'),
    ('payments','user_id','practitioner_id')
  ) as x(tbl, a, b) loop
    execute format('drop policy if exists %I on public.%I', r.tbl||'_rw', r.tbl);
    execute format('create policy %I on public.%I for all using (%I = auth.uid()::text or %I = auth.uid()::text or public.is_admin()) with check (%I = auth.uid()::text or %I = auth.uid()::text or public.is_admin())',
      r.tbl||'_twoparty', r.tbl, r.a, r.b, r.a, r.b);
  end loop;
end $$;

-- messages (sender or receiver) / conversations (either participant)
drop policy if exists "messages_rw" on public.messages;
create policy "messages_twoparty" on public.messages for all
  using (sender_id = auth.uid()::text or receiver_id = auth.uid()::text or public.is_admin())
  with check (sender_id = auth.uid()::text or receiver_id = auth.uid()::text);
drop policy if exists "conversations_rw" on public.conversations;
create policy "conversations_twoparty" on public.conversations for all
  using (participant_1_id = auth.uid()::text or participant_2_id = auth.uid()::text or public.is_admin())
  with check (participant_1_id = auth.uid()::text or participant_2_id = auth.uid()::text);

-- event_registrations (registrant reads own; authenticated insert)
drop policy if exists "event_registrations_rw" on public.event_registrations;
create policy "event_registrations_rw" on public.event_registrations for all
  using (user_id = auth.uid()::text or public.is_admin()) with check (auth.uid()::text is not null);

-- credentials (practitioner owner + admin)
drop policy if exists "credentials_read" on public.credentials; drop policy if exists "credentials_write" on public.credentials; drop policy if exists "credentials_rw" on public.credentials;
create policy "credentials_owner" on public.credentials for all using (practitioner_id = auth.uid()::text or public.is_admin()) with check (practitioner_id = auth.uid()::text or public.is_admin());

-- ---------- Admin-only moderation ----------
drop policy if exists "reports_rw" on public.reports;
create policy "reports_insert" on public.reports for insert with check (auth.uid()::text is not null);
create policy "reports_admin"  on public.reports for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "moderation_cases_rw" on public.moderation_cases;
create policy "moderation_cases_admin" on public.moderation_cases for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Storage: lock the private documents bucket to owner-prefixed paths ----------
-- Files are uploaded as "<auth.uid()::text>/..."; only the owner (or admin) can read/write.
drop policy if exists "kc_storage_read" on storage.objects;
drop policy if exists "kc_storage_insert" on storage.objects;
drop policy if exists "kc_storage_update" on storage.objects;
drop policy if exists "kc_storage_delete" on storage.objects;
create policy "kc_uploads_public_read" on storage.objects for select using (bucket_id = 'uploads');
create policy "kc_uploads_auth_write"  on storage.objects for insert with check (bucket_id = 'uploads' and auth.uid()::text is not null);
create policy "kc_documents_owner" on storage.objects for all
  using (bucket_id = 'documents' and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text))
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
