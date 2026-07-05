-- Storage hardening. The live DB still had the DEV-PERMISSIVE policies from
-- 0003_storage.sql (any role could read/write/delete ANY object in uploads AND
-- documents) — the tightening intended in 0006_rls.sql was never applied to prod.
-- That exposed private waiver PDFs (health/PII) in the `documents` bucket to
-- anyone. This migration replaces those policies with owner-scoped ones.
--
-- Path convention: private docs are uploaded as `<auth.uid()>/<file>` (see
-- src/lib/storage.ts), so ownership = first path segment equals the caller's uid.

drop policy if exists kc_storage_read on storage.objects;
drop policy if exists kc_storage_insert on storage.objects;
drop policy if exists kc_storage_update on storage.objects;
drop policy if exists kc_storage_delete on storage.objects;

-- uploads: PUBLIC bucket — world-readable by design (avatars, product/event
-- images, message attachments), but writes require an authenticated user.
create policy kc_uploads_read on storage.objects
  for select using (bucket_id = 'uploads');
create policy kc_uploads_insert on storage.objects
  for insert with check (bucket_id = 'uploads' and auth.uid() is not null);
create policy kc_uploads_update on storage.objects
  for update using (bucket_id = 'uploads' and auth.uid() is not null);
create policy kc_uploads_delete on storage.objects
  for delete using (bucket_id = 'uploads' and auth.uid() is not null);

-- documents: PRIVATE — only the owner (path prefixed with their uid) or an admin
-- may read/write/update/delete. auth.uid() is null for anon → fully denied.
create policy kc_documents_owner on storage.objects
  for all
  using (
    bucket_id = 'documents' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.profiles p where p.id = auth.uid()::text and p.role = 'admin')
    )
  )
  with check (
    bucket_id = 'documents' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.profiles p where p.id = auth.uid()::text and p.role = 'admin')
    )
  );
