-- 0011 Engagement: reactions, threaded/Q&A replies, group request-to-join.
-- Additive + idempotent. Permissive-dev RLS (matches 0001); tighten in 0006 at cutover.

-- ---- reactions (likes on posts/replies/feed items/events) -------------------
create table if not exists public.reactions (
  id text primary key default gen_random_uuid()::text,
  target_type text not null,           -- post | reply | feed_item | event
  target_id text not null,
  user_id text not null,
  type text not null default 'like',
  created_by text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.reactions enable row level security;
drop policy if exists "reactions_rw" on public.reactions;
create policy "reactions_rw" on public.reactions for all using (true) with check (true); -- TODO tighten (owner)

create unique index if not exists uq_reactions_one
  on public.reactions (target_type, target_id, user_id, type);
create index if not exists idx_reactions_target
  on public.reactions (target_type, target_id);

-- ---- replies: threading + Q&A accepted answer -------------------------------
alter table public.replies add column if not exists parent_id text;
alter table public.replies add column if not exists is_accepted boolean not null default false;
create index if not exists idx_replies_parent on public.replies (parent_id) where parent_id is not null;

-- ---- group_memberships: request-to-join status ------------------------------
alter table public.group_memberships add column if not exists status text not null default 'active'; -- active | pending
create index if not exists idx_group_memberships_status on public.group_memberships (group_id, status);
