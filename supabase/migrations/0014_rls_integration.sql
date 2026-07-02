-- 0014 Reconcile the app's cross-owner writes with strict RLS (0013).
--
-- Under strict RLS a registering client can't UPDATE the event, a joining member
-- can't UPDATE the group, and a non-author replier can't UPDATE the post — so the
-- denormalized counters (current_participants, member_count, reply_count) would go
-- stale. Fix: maintain those counters with SECURITY DEFINER *recalculation* triggers
-- (authoritative, idempotent, self-healing) so they're correct regardless of who
-- writes. Recalc (not increment) is safe alongside the app's optimistic client-side
-- updates and can't double-count.
--
-- Also: let a post's author moderate replies on their post (Q&A "mark as answer"),
-- which strict RLS (reply-author-only) otherwise blocks.

begin;

-- ---------- events.current_participants = # confirmed registrations ----------
create or replace function public.recalc_event_participants() returns trigger
language plpgsql security definer set search_path = public as $$
declare eid text;
begin
  eid := coalesce(new.event_id, old.event_id);
  update public.events e
    set current_participants = (
      select count(*) from public.event_registrations r
      where r.event_id = eid and coalesce(r.registration_status,'confirmed') = 'confirmed')
    where e.id = eid;
  return null;
end $$;
drop trigger if exists trg_recalc_event_participants on public.event_registrations;
create trigger trg_recalc_event_participants
  after insert or update or delete on public.event_registrations
  for each row execute function public.recalc_event_participants();

-- ---------- groups.member_count = # active memberships ----------
create or replace function public.recalc_group_members() returns trigger
language plpgsql security definer set search_path = public as $$
declare gid text;
begin
  gid := coalesce(new.group_id, old.group_id);
  update public.groups g
    set member_count = (
      select count(*) from public.group_memberships m
      where m.group_id = gid and coalesce(m.status,'active') = 'active')
    where g.id = gid;
  return null;
end $$;
drop trigger if exists trg_recalc_group_members on public.group_memberships;
create trigger trg_recalc_group_members
  after insert or update or delete on public.group_memberships
  for each row execute function public.recalc_group_members();

-- ---------- posts.reply_count / last_reply_date from replies ----------
create or replace function public.recalc_post_replies() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid text;
begin
  pid := coalesce(new.post_id, old.post_id);
  if pid is null then return null; end if;
  update public.posts p
    set reply_count = (select count(*) from public.replies r where r.post_id = pid),
        last_reply_date = coalesce(
          (select max(r.created_date) from public.replies r where r.post_id = pid),
          p.created_date)
    where p.id = pid;
  return null;
end $$;
drop trigger if exists trg_recalc_post_replies on public.replies;
create trigger trg_recalc_post_replies
  after insert or delete on public.replies
  for each row execute function public.recalc_post_replies();

-- ---------- replies: a post's author may moderate replies on their post ----------
-- (Q&A accepted-answer, and future pin/hide) — in addition to the reply's own author.
drop policy if exists replies_update on public.replies;
create policy replies_update on public.replies for update using (
  author_id = auth.uid()::text or created_by = auth.uid()::text
  or post_id in (select id from public.posts where author_id = auth.uid()::text)
  or public.is_admin()
) with check (
  author_id = auth.uid()::text or created_by = auth.uid()::text
  or post_id in (select id from public.posts where author_id = auth.uid()::text)
  or public.is_admin()
);

commit;
