-- 0016 Stripe Connect — practitioner connected accounts for marketplace payouts.
alter table public.practitioners add column if not exists stripe_account_id text;
alter table public.practitioners add column if not exists stripe_charges_enabled boolean default false;
-- Track payout destination + platform fee on each payment for reporting.
alter table public.payments add column if not exists application_fee numeric;
alter table public.payments add column if not exists transfer_destination text;
