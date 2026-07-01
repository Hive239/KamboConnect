-- KamboConnect storage: buckets + policies.
-- 'uploads' = public (avatars, product images, message attachments);
-- 'documents' = private (certifications) served via signed URLs.
-- Policies are dev-permissive (anon) for now; tighten with Supabase Auth later.

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true), ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "kc_storage_read" on storage.objects;
create policy "kc_storage_read" on storage.objects
  for select using (bucket_id in ('uploads', 'documents'));

drop policy if exists "kc_storage_insert" on storage.objects;
create policy "kc_storage_insert" on storage.objects
  for insert with check (bucket_id in ('uploads', 'documents'));

drop policy if exists "kc_storage_update" on storage.objects;
create policy "kc_storage_update" on storage.objects
  for update using (bucket_id in ('uploads', 'documents'));

drop policy if exists "kc_storage_delete" on storage.objects;
create policy "kc_storage_delete" on storage.objects
  for delete using (bucket_id in ('uploads', 'documents'));
