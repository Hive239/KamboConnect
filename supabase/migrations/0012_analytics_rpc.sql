-- 0012 Server-side analytics aggregation. Heavy counts/sums computed in-DB so the
-- client doesn't pull whole tables. Returns a single JSON blob for a time window.
create or replace function public.kg_analytics_overview(since timestamptz, until timestamptz)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'usersTotal',   (select count(*) from profiles),
    'usersNew',     (select count(*) from profiles where created_date >= since and created_date < until),
    'clients',      (select count(*) from profiles where coalesce(role,'client') in ('client','user')),
    'practitioners',(select count(*) from profiles where role = 'practitioner'),
    'admins',       (select count(*) from profiles where role = 'admin'),

    'bookingsTotal',    (select count(*) from bookings where created_date >= since and created_date < until),
    'bookingsPaid',     (select count(*) from bookings where payment_status = 'paid' and created_date >= since and created_date < until),
    'bookingsCompleted',(select count(*) from bookings where status = 'completed' and created_date >= since and created_date < until),
    'gmv',              (select coalesce(sum(price),0) from bookings where payment_status = 'paid' and created_date >= since and created_date < until),

    'subscriptionMRR',  (select coalesce(sum(coalesce(price, case tier when 'preferred' then 29 when 'featured' then 49 else 0 end)),0) from subscriptions where status = 'active'),
    'courseRevenue',    (select coalesce(sum(amount),0) from payments where payment_type = 'course' and coalesce(payment_status,'') not in ('refunded','failed') and created_date >= since and created_date < until),
    'enrollments',      (select count(*) from coursework_enrollments where coalesce(status,'') <> 'pending' and created_date >= since and created_date < until),
    'refunds',          (select coalesce(sum(amount),0) from payments where payment_status = 'refunded' and created_date >= since and created_date < until),

    'dau', (select count(distinct user_id) from activity_events where created_date >= until - interval '1 day'),
    'wau', (select count(distinct user_id) from activity_events where created_date >= until - interval '7 days'),
    'mau', (select count(distinct user_id) from activity_events where created_date >= until - interval '30 days'),

    'evSearch',   (select count(*) from activity_events where type = 'search_performed'  and created_date >= since and created_date < until),
    'evView',     (select count(*) from activity_events where type = 'profile_viewed'    and created_date >= since and created_date < until),
    'evBookStart',(select count(*) from activity_events where type = 'booking_started'   and created_date >= since and created_date < until),
    'evBookDone', (select count(*) from activity_events where type = 'booking_submitted' and created_date >= since and created_date < until),

    'errors7d', (select count(*) from error_logs where created_date >= until - interval '7 days'),
    'emailSent',   (select count(*) from email_events where type = 'sent'    and created_date >= since and created_date < until),
    'emailFailed', (select count(*) from email_events where type = 'failed'  and created_date >= since and created_date < until),
    'emailOpened', (select count(*) from email_events where type = 'opened'  and created_date >= since and created_date < until),
    'emailClicked',(select count(*) from email_events where type = 'clicked' and created_date >= since and created_date < until)
  );
$$;

grant execute on function public.kg_analytics_overview(timestamptz, timestamptz) to anon, authenticated, service_role;
