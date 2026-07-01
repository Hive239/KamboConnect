-- KamboConnect initial schema (generated). RLS enabled on all tables.
-- Policies are a PRAGMATIC DEV starting point (permissive). Tighten before production.
create extension if not exists "pgcrypto";

drop table if exists public.profiles cascade;
drop table if exists public.practitioners cascade;
drop table if exists public.reviews cascade;
drop table if exists public.events cascade;
drop table if exists public.event_registrations cascade;
drop table if exists public.posts cascade;
drop table if exists public.replies cascade;
drop table if exists public.community_resources cascade;
drop table if exists public.bookings cascade;
drop table if exists public.messages cascade;
drop table if exists public.practitioner_availability cascade;
drop table if exists public.payments cascade;
drop table if exists public.conversations cascade;
drop table if exists public.notifications cascade;
drop table if exists public.favorites cascade;
drop table if exists public.practitioner_blocked_dates cascade;
drop table if exists public.practitioner_exceptions cascade;
drop table if exists public.reports cascade;
drop table if exists public.saved_searches cascade;
drop table if exists public.follows cascade;
drop table if exists public.groups cascade;
drop table if exists public.group_memberships cascade;
drop table if exists public.feed_items cascade;
drop table if exists public.products cascade;
drop table if exists public.orders cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.credentials cascade;
drop table if exists public.screening_responses cascade;
drop table if exists public.consent_records cascade;
drop table if exists public.moderation_cases cascade;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid,
  email text,
  full_name text,
  role text,
  profile_image_url text,
  preferences jsonb,
  status text,
  locale text,
  currency text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_rw" on public.profiles for all to authenticated using (true) with check (true); -- TODO tighten (owner)
create index if not exists idx_profiles_auth_id on public.profiles(auth_id);

create table public.practitioners (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text,
  phone text,
  address jsonb,
  latitude numeric,
  longitude numeric,
  bio text,
  years_experience numeric,
  certifications jsonb,
  specializations jsonb,
  is_verified boolean,
  verification_level text,
  rejection_reason text,
  listing_tier text,
  video_interview_url text,
  website_url text,
  social_media jsonb,
  profile_image_url text,
  image_urls jsonb,
  pricing_range text,
  languages jsonb,
  availability_notes text,
  safety_protocols text,
  training_background text,
  why_practitioner text,
  cpr_certification_url text,
  cpr_expiration_date text,
  kambo_certification_url text,
  is_online boolean,
  modalities jsonb,
  reputation_score numeric,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.practitioners enable row level security;
create policy "practitioners_read" on public.practitioners for select using (true);
create policy "practitioners_write" on public.practitioners for all to authenticated using (true) with check (true);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid,
  booking_id uuid,
  reviewer_name text,
  reviewer_id uuid,
  session_date text,
  overall_rating numeric,
  safety_rating numeric,
  communication_rating numeric,
  environment_rating numeric,
  professionalism_rating numeric,
  review_text text,
  would_recommend boolean,
  verified_client boolean,
  session_type text,
  response_text text,
  response_date text,
  flagged boolean,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.reviews enable row level security;
create policy "reviews_read" on public.reviews for select using (true);
create policy "reviews_write" on public.reviews for all to authenticated using (true) with check (true);
create index if not exists idx_reviews_practitioner_id on public.reviews(practitioner_id);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  practitioner_id uuid,
  event_type text,
  start_date text,
  end_date text,
  address jsonb,
  location_details text,
  price numeric,
  currency text,
  max_participants numeric,
  current_participants numeric,
  requirements jsonb,
  what_to_bring jsonb,
  image_url text,
  is_online boolean,
  meeting_link text,
  status text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.events enable row level security;
create policy "events_read" on public.events for select using (true);
create policy "events_write" on public.events for all to authenticated using (true) with check (true);
create index if not exists idx_events_practitioner_id on public.events(practitioner_id);

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid,
  participant_name text,
  participant_email text,
  participant_phone text,
  emergency_contact text,
  medical_conditions text,
  previous_kambo_experience boolean,
  special_requirements text,
  registration_status text,
  payment_status text,
  notes text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.event_registrations enable row level security;
create policy "event_registrations_rw" on public.event_registrations for all to authenticated using (true) with check (true); -- TODO tighten (owner)
create index if not exists idx_event_registrations_event_id on public.event_registrations(event_id);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text,
  content text,
  author_id uuid,
  author_name text,
  category text,
  reply_count numeric,
  is_pinned boolean,
  is_locked boolean,
  last_reply_date text,
  group_id uuid,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.posts enable row level security;
create policy "posts_read" on public.posts for select using (true);
create policy "posts_write" on public.posts for all to authenticated using (true) with check (true);
create index if not exists idx_posts_author_id on public.posts(author_id);

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid,
  content text,
  author_id uuid,
  author_name text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.replies enable row level security;
create policy "replies_read" on public.replies for select using (true);
create policy "replies_write" on public.replies for all to authenticated using (true) with check (true);
create index if not exists idx_replies_post_id on public.replies(post_id);

create table public.community_resources (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  url text,
  category text,
  resource_type text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.community_resources enable row level security;
create policy "community_resources_read" on public.community_resources for select using (true);
create policy "community_resources_write" on public.community_resources for all to authenticated using (true) with check (true);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid,
  practitioner_name text,
  client_id uuid,
  client_name text,
  client_email text,
  client_phone text,
  service_type text,
  requested_date text,
  message text,
  status text,
  price numeric,
  payment_status text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.bookings enable row level security;
create policy "bookings_rw" on public.bookings for all to authenticated using (true) with check (true); -- TODO tighten (owner)
create index if not exists idx_bookings_practitioner_id on public.bookings(practitioner_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid,
  booking_id uuid,
  sender_id uuid,
  receiver_id uuid,
  sender_name text,
  content text,
  message_type text,
  file_url text,
  is_read boolean,
  read_date text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.messages enable row level security;
create policy "messages_rw" on public.messages for all to authenticated using (true) with check (true); -- TODO tighten (owner)
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);

create table public.practitioner_availability (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid,
  day_of_week text,
  start_time text,
  end_time text,
  is_available boolean,
  notes text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.practitioner_availability enable row level security;
create policy "practitioner_availability_read" on public.practitioner_availability for select using (true);
create policy "practitioner_availability_write" on public.practitioner_availability for all to authenticated using (true) with check (true);
create index if not exists idx_practitioner_availability_practitioner_id on public.practitioner_availability(practitioner_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid,
  booking_id uuid,
  user_id uuid,
  practitioner_id uuid,
  amount numeric,
  currency text,
  payment_type text,
  payment_status text,
  payment_method text,
  stripe_payment_id text,
  payment_date text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.payments enable row level security;
create policy "payments_rw" on public.payments for all to authenticated using (true) with check (true); -- TODO tighten (owner)
create index if not exists idx_payments_event_id on public.payments(event_id);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_1_id uuid,
  participant_2_id uuid,
  participant_1_name text,
  participant_2_name text,
  conversation_type text,
  last_message text,
  last_message_date text,
  is_active boolean,
  related_booking_id uuid,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.conversations enable row level security;
create policy "conversations_rw" on public.conversations for all to authenticated using (true) with check (true); -- TODO tighten (owner)
create index if not exists idx_conversations_participant_1_id on public.conversations(participant_1_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  title text,
  message text,
  type text,
  priority text,
  related_id text,
  action_url text,
  sender_image_url text,
  is_read boolean,
  read_date text,
  expires_at text,
  metadata jsonb,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "notifications_rw" on public.notifications for all to authenticated using (true) with check (true); -- TODO tighten (owner)
create index if not exists idx_notifications_user_id on public.notifications(user_id);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  item_id text,
  item_type text,
  item_title text,
  metadata jsonb,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.favorites enable row level security;
create policy "favorites_rw" on public.favorites for all to authenticated using (true) with check (true); -- TODO tighten (owner)
create index if not exists idx_favorites_user_id on public.favorites(user_id);

create table public.practitioner_blocked_dates (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid,
  date text,
  start_time text,
  end_time text,
  block_type text,
  reason text,
  recurring boolean,
  external_calendar_event_id text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.practitioner_blocked_dates enable row level security;
create policy "practitioner_blocked_dates_read" on public.practitioner_blocked_dates for select using (true);
create policy "practitioner_blocked_dates_write" on public.practitioner_blocked_dates for all to authenticated using (true) with check (true);
create index if not exists idx_practitioner_blocked_dates_practitioner_id on public.practitioner_blocked_dates(practitioner_id);

create table public.practitioner_exceptions (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid,
  date text,
  day_of_week text,
  exception_type text,
  start_time text,
  end_time text,
  notes text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.practitioner_exceptions enable row level security;
create policy "practitioner_exceptions_read" on public.practitioner_exceptions for select using (true);
create policy "practitioner_exceptions_write" on public.practitioner_exceptions for all to authenticated using (true) with check (true);
create index if not exists idx_practitioner_exceptions_practitioner_id on public.practitioner_exceptions(practitioner_id);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reported_item_type text,
  reported_item_id text,
  reporter_id uuid,
  reporter_email text,
  reason text,
  description text,
  priority text,
  status text,
  admin_notes text,
  resolution_action text,
  resolved_date text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "reports_rw" on public.reports for all to authenticated using (true) with check (true); -- TODO tighten (admin)
create index if not exists idx_reports_reported_item_id on public.reports(reported_item_id);

create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text,
  search_term text,
  filters jsonb,
  notify boolean,
  last_run_date text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.saved_searches enable row level security;
create policy "saved_searches_rw" on public.saved_searches for all to authenticated using (true) with check (true); -- TODO tighten (owner)
create index if not exists idx_saved_searches_user_id on public.saved_searches(user_id);

create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid,
  followee_id text,
  followee_type text,
  followee_name text,
  followee_image_url text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.follows enable row level security;
create policy "follows_rw" on public.follows for all to authenticated using (true) with check (true); -- TODO tighten (owner)
create index if not exists idx_follows_follower_id on public.follows(follower_id);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text,
  description text,
  category text,
  image_url text,
  member_count numeric,
  is_private boolean,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.groups enable row level security;
create policy "groups_read" on public.groups for select using (true);
create policy "groups_write" on public.groups for all to authenticated using (true) with check (true);

create table public.group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid,
  user_id uuid,
  user_name text,
  role text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.group_memberships enable row level security;
create policy "group_memberships_rw" on public.group_memberships for all to authenticated using (true) with check (true); -- TODO tighten (owner)
create index if not exists idx_group_memberships_group_id on public.group_memberships(group_id);

create table public.feed_items (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  actor_image_url text,
  verb text,
  object_type text,
  object_id text,
  summary text,
  image_url text,
  action_url text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.feed_items enable row level security;
create policy "feed_items_read" on public.feed_items for select using (true);
create policy "feed_items_write" on public.feed_items for all to authenticated using (true) with check (true);
create index if not exists idx_feed_items_actor_id on public.feed_items(actor_id);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid,
  seller_name text,
  title text,
  description text,
  category text,
  price numeric,
  currency text,
  image_urls jsonb,
  stock numeric,
  status text,
  tags jsonb,
  rating numeric,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "products_read" on public.products for select using (true);
create policy "products_write" on public.products for all to authenticated using (true) with check (true);
create index if not exists idx_products_seller_id on public.products(seller_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  items jsonb,
  total numeric,
  currency text,
  status text,
  payment_id text,
  shipping_address jsonb,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "orders_rw" on public.orders for all to authenticated using (true) with check (true); -- TODO tighten (owner)
create index if not exists idx_orders_user_id on public.orders(user_id);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid,
  tier text,
  status text,
  price numeric,
  currency text,
  period text,
  current_period_end text,
  payment_id text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "subscriptions_rw" on public.subscriptions for all to authenticated using (true) with check (true); -- TODO tighten (owner)
create index if not exists idx_subscriptions_practitioner_id on public.subscriptions(practitioner_id);

create table public.credentials (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid,
  type text,
  title text,
  file_uri text,
  issuer text,
  issued_date text,
  expiry_date text,
  status text,
  reviewer_id uuid,
  notes text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.credentials enable row level security;
create policy "credentials_read" on public.credentials for select using (true);
create policy "credentials_write" on public.credentials for all to authenticated using (true) with check (true);
create index if not exists idx_credentials_practitioner_id on public.credentials(practitioner_id);

create table public.screening_responses (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid,
  user_id uuid,
  practitioner_id uuid,
  answers jsonb,
  flagged boolean,
  notes text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.screening_responses enable row level security;
create policy "screening_responses_rw" on public.screening_responses for all to authenticated using (true) with check (true); -- TODO tighten (owner)
create index if not exists idx_screening_responses_booking_id on public.screening_responses(booking_id);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid,
  user_id uuid,
  practitioner_id uuid,
  document_version text,
  agreed boolean,
  signature_name text,
  agreed_at text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.consent_records enable row level security;
create policy "consent_records_rw" on public.consent_records for all to authenticated using (true) with check (true); -- TODO tighten (owner)
create index if not exists idx_consent_records_booking_id on public.consent_records(booking_id);

create table public.moderation_cases (
  id uuid primary key default gen_random_uuid(),
  subject_type text,
  subject_id text,
  source text,
  score numeric,
  reasons jsonb,
  status text,
  assignee_id uuid,
  notes text,
  resolution text,
  snippet text,
  created_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.moderation_cases enable row level security;
create policy "moderation_cases_rw" on public.moderation_cases for all to authenticated using (true) with check (true); -- TODO tighten (admin)
create index if not exists idx_moderation_cases_subject_id on public.moderation_cases(subject_id);

