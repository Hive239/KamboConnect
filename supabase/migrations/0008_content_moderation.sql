-- 0008 Content moderation: soft-hide flag for posts and replies.
-- Additive + idempotent. Safe to apply anytime (no policy changes).
-- Admin "Hide" sets is_hidden = true; community read views filter these out.

alter table public.posts   add column if not exists is_hidden boolean not null default false;
alter table public.replies add column if not exists is_hidden boolean not null default false;

-- Partial indexes so the common "visible content" scans stay cheap.
create index if not exists idx_posts_visible   on public.posts(created_date)   where is_hidden = false;
create index if not exists idx_replies_visible on public.replies(post_id)      where is_hidden = false;
