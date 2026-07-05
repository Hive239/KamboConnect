-- 0020 Per-user tokenized ICS calendar feed (keyless calendar subscribe URL).
alter table public.profiles add column if not exists calendar_token uuid default gen_random_uuid();
update public.profiles set calendar_token = gen_random_uuid() where calendar_token is null;
create unique index if not exists idx_profiles_calendar_token on public.profiles(calendar_token);
