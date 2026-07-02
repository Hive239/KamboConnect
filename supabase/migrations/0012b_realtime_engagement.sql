-- 0012 Add engagement tables to the realtime publication so likes, group join
-- requests, and event registrations propagate live across devices/tabs.
do $$
begin
  begin alter publication supabase_realtime add table public.reactions; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.group_memberships; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.event_registrations; exception when duplicate_object then null; end;
end $$;
