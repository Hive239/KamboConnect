-- 0014 Real practitioner-set session price (replaces fabricated $150/$200/$250).
alter table public.practitioners add column if not exists session_price numeric;
