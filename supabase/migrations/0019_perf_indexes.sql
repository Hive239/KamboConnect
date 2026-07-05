-- Performance indexes for hot query paths that were doing sequential scans.
-- All additive/non-breaking.

-- Community feed: FeedItem.list("-created_date", 50) — was seq scan + sort.
create index if not exists idx_feed_items_created_date on public.feed_items (created_date desc);

-- Messages unread badge: Message.filter({ receiver_id, is_read:false }) — hot per
-- page-open query, previously unindexed on receiver_id/is_read.
create index if not exists idx_messages_receiver_unread on public.messages (receiver_id, is_read);

-- Notifications: filtered by user_id and (for mark-all-read) is_read.
create index if not exists idx_notifications_user_read on public.notifications (user_id, is_read);
