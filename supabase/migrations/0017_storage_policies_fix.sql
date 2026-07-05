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

-- documents: PRIVATE. Path is `<owner_uid>/<file>`. auth.uid() is null for anon
-- → fully denied. READ is allowed to the owner, an admin, OR a practitioner who
-- has a booking with the owning client (so they can review that client's signed
-- waiver — see ClientsManagement "View PDF"). WRITES stay owner/admin only.
create policy kc_documents_read on storage.objects
  for select using (
    bucket_id = 'documents' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.profiles p where p.id = auth.uid()::text and p.role = 'admin')
      or exists (
        select 1 from public.bookings b
        join public.practitioners pr on pr.id = b.practitioner_id
        where b.client_id = (storage.foldername(name))[1] and pr.user_id = auth.uid()::text
      )
    )
  );
create policy kc_documents_insert on storage.objects
  for insert with check (
    bucket_id = 'documents' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.profiles p where p.id = auth.uid()::text and p.role = 'admin')
    )
  );
create policy kc_documents_update on storage.objects
  for update using (
    bucket_id = 'documents' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.profiles p where p.id = auth.uid()::text and p.role = 'admin')
    )
  );
create policy kc_documents_delete on storage.objects
  for delete using (
    bucket_id = 'documents' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.profiles p where p.id = auth.uid()::text and p.role = 'admin')
    )
  );
