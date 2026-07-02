-- 0016 Cascade cleanup on delete. There are no FK constraints, and client-side
-- cleanup is inconsistent (deleting an event/post/group leaves orphaned
-- registrations, replies, reactions, and feed items). These AFTER DELETE triggers
-- (SECURITY DEFINER so they can remove other users' child rows) make deletes clean
-- regardless of which code path issued them.

begin;

-- ---- event deleted → its registrations, reactions, and feed item ----
create or replace function public.cascade_delete_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.event_registrations where event_id = old.id;
  delete from public.reactions where target_type = 'event' and target_id = old.id;
  delete from public.feed_items where object_type = 'event' and object_id = old.id;
  return old;
end $$;
drop trigger if exists trg_cascade_delete_event on public.events;
create trigger trg_cascade_delete_event after delete on public.events
  for each row execute function public.cascade_delete_event();

-- ---- reply deleted → its reactions ----
create or replace function public.cascade_delete_reply() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.reactions where target_type = 'reply' and target_id = old.id;
  return old;
end $$;
drop trigger if exists trg_cascade_delete_reply on public.replies;
create trigger trg_cascade_delete_reply after delete on public.replies
  for each row execute function public.cascade_delete_reply();

-- ---- post deleted → its replies (which cascade to their reactions), reactions, feed item ----
create or replace function public.cascade_delete_post() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.replies where post_id = old.id;      -- fires reply cascade
  delete from public.reactions where target_type = 'post' and target_id = old.id;
  delete from public.feed_items where object_type = 'post' and object_id = old.id;
  return old;
end $$;
drop trigger if exists trg_cascade_delete_post on public.posts;
create trigger trg_cascade_delete_post after delete on public.posts
  for each row execute function public.cascade_delete_post();

-- ---- group deleted → memberships, its posts (cascade), feed item ----
create or replace function public.cascade_delete_group() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.group_memberships where group_id = old.id;
  delete from public.posts where group_id = old.id;       -- fires post cascade
  delete from public.feed_items where object_type = 'group' and object_id = old.id;
  return old;
end $$;
drop trigger if exists trg_cascade_delete_group on public.groups;
create trigger trg_cascade_delete_group after delete on public.groups
  for each row execute function public.cascade_delete_group();

commit;
