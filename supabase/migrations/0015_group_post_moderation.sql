-- 0015 Let a group's owner moderate posts in their group (delete on group teardown,
-- and pin/lock/hide). Under 0013 posts were author-or-admin only, so deleting a group
-- with other members' posts left them orphaned. Adds the group-owner path.

begin;

drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts for delete using (
  author_id = auth.uid()::text or created_by = auth.uid()::text
  or group_id in (select id from public.groups where created_by = auth.uid()::text)
  or public.is_admin()
);

drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts for update using (
  author_id = auth.uid()::text or created_by = auth.uid()::text
  or group_id in (select id from public.groups where created_by = auth.uid()::text)
  or public.is_admin()
) with check (
  author_id = auth.uid()::text or created_by = auth.uid()::text
  or group_id in (select id from public.groups where created_by = auth.uid()::text)
  or public.is_admin()
);

commit;
