-- Enable Supabase Realtime for live messaging / notifications / feed.
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.feed_items;
alter publication supabase_realtime add table public.conversations;
