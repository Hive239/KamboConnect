/**
 * TypeScript interfaces for every KamboGuide entity.
 * Generated from the Base44 schemas in `_base44_export/entities/*.json`.
 *
 * These are the typed core of the app. The mock data layer (src/data/*) and the
 * entity wrappers (src/entities/*) are authored strictly against them; when we
 * migrate to Supabase these same types map to Postgres tables.
 */

/** Fields the platform adds to every stored record. */
export interface BaseRecord {
  id: string;
  created_date: string;
  updated_date: string;
  created_by?: string;
}

export interface Address {
  street?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
}

export interface EmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
}

/** Result of checking a client's medications against Kambo interaction rules. */
export interface InteractionFlag {
  medication: string;      // medication category key/label the client selected
  severity: 'absolute' | 'caution';
  note: string;
}

export type VerificationLevel = 'pending' | 'basic' | 'advanced' | 'master' | 'rejected';
export type ListingTier = 'basic' | 'preferred' | 'featured';
export type PricingRange = '$' | '$$' | '$$$' | '$$$$';
export type DayOfWeek =
  | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/** Built-in user (Base44 `User`, later Supabase auth user + profile). */
export interface User extends BaseRecord {
  email: string;
  full_name?: string;
  role?: 'admin' | 'practitioner' | 'client';
  auth_id?: string;
  acquisition?: Record<string, any>;
  profile_image_url?: string;
  preferences?: Record<string, unknown>;
  status?: 'active' | 'suspended' | 'banned';
  locale?: string;
  currency?: string;
}

export interface Practitioner extends BaseRecord {
  user_id?: string; // owner auth id (== practitioners.id == profiles.id)
  full_name: string;
  email: string;
  phone?: string;
  address?: Address;
  latitude?: number;
  longitude?: number;
  bio?: string;
  years_experience?: number;
  certifications?: string[];
  specializations?: string[];
  is_verified?: boolean;
  verification_level?: VerificationLevel;
  rejection_reason?: string;
  listing_tier?: ListingTier;
  video_interview_url?: string;
  website_url?: string;
  social_media?: { instagram?: string; facebook?: string };
  profile_image_url?: string;
  image_urls?: string[];
  pricing_range?: PricingRange;
  languages?: string[];
  availability_notes?: string;
  safety_protocols?: string;
  training_background?: string;
  why_practitioner?: string;
  cpr_certification_url?: string;
  cpr_expiration_date?: string;
  kambo_certification_url?: string;
  // Platform extensions
  is_online?: boolean;          // offers remote/online consultations
  modalities?: string[];        // offered practices (Kambo, Sananga, Hapé, …)
  reputation_score?: number;    // cached weighted score (see src/lib/reputation.ts)
  // Trust & lineage (feature #4)
  lineage?: string;             // narrative of who they trained under / their line
  tradition?: string[];         // traditions/lineages they practice within
  disclosed_teachers?: string;  // named teachers/mentors for transparency
}

export interface Review extends BaseRecord {
  practitioner_id: string;
  booking_id: string;
  reviewer_name: string;
  reviewer_id?: string;
  session_date: string;
  overall_rating: number;
  safety_rating?: number;
  communication_rating?: number;
  environment_rating?: number;
  professionalism_rating?: number;
  // Outcome tracking (feature #7) — self-reported well-being 1–10 before/after
  wellbeing_before?: number;
  wellbeing_after?: number;
  review_text: string;
  would_recommend: boolean;
  verified_client?: boolean;
  session_type?: 'Private Session' | 'Group Circle' | 'Consultation';
  // Practitioner reply + moderation
  response_text?: string;
  response_date?: string;
  flagged?: boolean;
}

export interface Event extends BaseRecord {
  title: string;
  description?: string;
  practitioner_id: string;
  event_type?: 'circle' | 'workshop' | 'retreat' | 'meetup' | 'training';
  start_date: string;
  end_date?: string;
  address?: Address;
  location_details?: string;
  price: number;
  currency?: string;
  max_participants?: number;
  current_participants?: number;
  requirements?: string[];
  what_to_bring?: string[];
  image_url?: string;
  is_online?: boolean;
  meeting_link?: string;
  status?: 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface EventRegistration extends BaseRecord {
  event_id: string;
  participant_name: string;
  participant_email: string;
  participant_phone?: string;
  emergency_contact?: string;
  medical_conditions?: string;
  previous_kambo_experience?: boolean;
  special_requirements?: string;
  registration_status?: 'pending' | 'confirmed' | 'cancelled' | 'waitlist';
  payment_status?: 'pending' | 'paid' | 'refunded';
  notes?: string;
}

export interface Post extends BaseRecord {
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  category?: 'General Discussion' | 'Experience Sharing' | 'Q&A' | 'Integration';
  reply_count?: number;
  is_pinned?: boolean;
  is_locked?: boolean;
  last_reply_date?: string;
  group_id?: string;
}

export interface Reply extends BaseRecord {
  post_id: string;
  content: string;
  author_id: string;
  author_name: string;
  parent_id?: string;
  is_accepted?: boolean;
}

export interface CommunityResource extends BaseRecord {
  title: string;
  description?: string;
  url: string;
  category: 'Community Guidelines' | 'Safety Protocols' | 'Integration Practices' | 'Further Reading';
  resource_type?: 'Article' | 'Video' | 'Book' | 'Website';
}

export interface Booking extends BaseRecord {
  practitioner_id: string;
  practitioner_name?: string;
  client_id?: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  service_type?: 'Private Session' | 'Group Circle' | 'Consultation';
  requested_date: string;
  slot_start?: string;          // ISO of the chosen availability slot (feature #1)
  duration_minutes?: number;    // session length used to compute conflicts/slots
  message?: string;
  status?: 'pending' | 'confirmed' | 'declined' | 'completed' | 'cancelled' | 'no_show';
  price?: number;
  payment_status?: 'paid' | 'unpaid' | 'refunded' | 'partially_refunded';
  // Deposits (feature #2 — Stripe-ready, mock until key)
  deposit_amount?: number;
  deposit_status?: 'none' | 'pending' | 'paid' | 'refunded';
  emergency_contact?: EmergencyContact; // captured at booking (feature #9)
  consultation_id?: string;
  waiver_signed?: boolean;
}

export interface Message extends BaseRecord {
  conversation_id: string;
  booking_id?: string;
  sender_id: string;
  receiver_id: string;
  sender_name: string;
  content: string;
  message_type?: 'user' | 'automated' | 'system' | 'file';
  file_url?: string;
  is_read?: boolean;
  read_date?: string;
}

export interface PractitionerAvailability extends BaseRecord {
  practitioner_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  is_available?: boolean;
  notes?: string;
}

export interface Payment extends BaseRecord {
  event_id?: string;
  booking_id?: string;
  user_id: string;
  practitioner_id?: string;
  amount: number;
  currency?: string;
  payment_type?: 'booking' | 'event_registration' | 'cancellation_fee' | 'product' | 'subscription';
  payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  stripe_payment_id?: string;
  payment_date?: string;
}

export interface Conversation extends BaseRecord {
  participant_1_id: string;
  participant_2_id: string;
  participant_1_name: string;
  participant_2_name: string;
  conversation_type?: 'direct' | 'support' | 'community';
  last_message?: string;
  last_message_date?: string;
  is_active?: boolean;
  related_booking_id?: string;
}

export interface Notification extends BaseRecord {
  user_id: string;
  title: string;
  message: string;
  type: 'booking' | 'message' | 'event' | 'community' | 'review' | 'system';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  related_id?: string;
  action_url?: string;
  sender_image_url?: string;
  is_read?: boolean;
  read_date?: string;
  expires_at?: string;
  metadata?: {
    sender_name?: string;
    event_title?: string;
    booking_status?: string;
    practitioner_name?: string;
  };
}

export interface Favorite extends BaseRecord {
  user_id: string;
  item_id: string;
  item_type: 'practitioner' | 'event' | 'post' | 'product' | 'search';
  item_title: string;
  metadata?: {
    practitioner_name?: string;
    event_date?: string;
    post_author?: string;
    image_url?: string;
  };
}

export interface PractitionerBlockedDate extends BaseRecord {
  practitioner_id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  block_type: 'full_day' | 'partial_day' | 'exception';
  reason?: string;
  recurring?: boolean;
  external_calendar_event_id?: string;
}

export interface PractitionerException extends BaseRecord {
  practitioner_id: string;
  date: string;
  day_of_week?: DayOfWeek;
  exception_type: 'override' | 'additional' | 'remove';
  start_time?: string;
  end_time?: string;
  notes?: string;
}

export interface Report extends BaseRecord {
  reported_item_type: 'user' | 'practitioner' | 'post' | 'reply' | 'booking' | 'event';
  reported_item_id: string;
  reporter_id: string;
  reporter_email?: string;
  reason: 'spam' | 'harassment' | 'inappropriate_content' | 'safety_concern' | 'fraud' | 'other';
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  admin_notes?: string;
  resolution_action?: string;
  resolved_date?: string;
}

// ===========================================================================
// Platform feature entities (discovery, social, marketplace, trust/safety)
// ===========================================================================

export interface SavedSearch extends BaseRecord {
  user_id: string;
  name: string;
  search_term?: string;
  filters: Record<string, any>;
  notify?: boolean;
  last_run_date?: string;
}

export interface Follow extends BaseRecord {
  follower_id: string;
  followee_id: string;
  followee_type: 'practitioner' | 'user' | 'group';
  followee_name?: string;
  followee_image_url?: string;
}

export interface Group extends BaseRecord {
  name: string;
  description?: string;
  category?: string;
  image_url?: string;
  member_count?: number;
  created_by?: string;
  is_private?: boolean;
}

export interface GroupMembership extends BaseRecord {
  group_id: string;
  user_id: string;
  user_name?: string;
  role?: 'member' | 'moderator' | 'owner';
  status?: 'active' | 'pending';
}

export interface FeedItem extends BaseRecord {
  actor_id: string;
  actor_name: string;
  actor_image_url?: string;
  verb: 'posted' | 'hosted_event' | 'reviewed' | 'joined_group' | 'verified' | 'listed_product';
  object_type: 'post' | 'event' | 'review' | 'group' | 'practitioner' | 'product';
  object_id: string;
  summary?: string;
  image_url?: string;
  action_url?: string;
}

export interface Product extends BaseRecord {
  seller_id: string;
  seller_name?: string;
  title: string;
  description?: string;
  category?: 'Rapé' | 'Tepi' | 'Tools' | 'Apparel' | 'Books' | 'Digital' | 'Other';
  price: number;
  currency?: string;
  image_urls?: string[];
  stock?: number;
  status?: 'active' | 'sold_out' | 'draft';
  tags?: string[];
  rating?: number;
}

export interface OrderItem {
  product_id: string;
  title: string;
  quantity: number;
  price: number;
}

export interface Order extends BaseRecord {
  user_id: string;
  items: OrderItem[];
  total: number;
  currency?: string;
  status?: 'pending' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded';
  payment_id?: string;
  shipping_address?: Address;
}

export interface Subscription extends BaseRecord {
  practitioner_id: string;
  tier: ListingTier;
  status: 'active' | 'cancelled' | 'past_due';
  price: number;
  currency?: string;
  period?: 'monthly' | 'yearly';
  current_period_end?: string;
  payment_id?: string;
}

export interface Credential extends BaseRecord {
  practitioner_id: string;
  type: 'cpr' | 'kambo' | 'first_aid' | 'insurance' | 'training' | 'other';
  title: string;
  file_uri?: string;
  issuer?: string;
  issued_date?: string;
  expiry_date?: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  reviewer_id?: string;
  notes?: string;
}

export interface ScreeningAnswer {
  key: string;
  question: string;
  answer: string | boolean;
  flag?: boolean;
}

export interface ScreeningResponse extends BaseRecord {
  booking_id?: string;
  user_id: string;
  practitioner_id: string;
  answers: ScreeningAnswer[];
  flagged?: boolean;
  notes?: string;
  // Safety/compliance engine (feature #9)
  medications?: string[];
  interaction_flags?: InteractionFlag[];
  emergency_contact?: EmergencyContact;
}

export interface ConsentRecord extends BaseRecord {
  booking_id?: string;
  user_id: string;
  practitioner_id: string;
  document_version: string;
  agreed: boolean;
  signature_name: string;
  agreed_at: string;
  document_url?: string;
  waiver_version?: string;
}

export interface ModerationCase extends BaseRecord {
  subject_type: 'post' | 'reply' | 'review' | 'user' | 'product' | 'message';
  subject_id: string;
  source: 'ai' | 'report' | 'manual';
  score?: number;
  reasons?: string[];
  status: 'open' | 'reviewing' | 'actioned' | 'dismissed';
  assignee_id?: string;
  notes?: string;
  resolution?: string;
  snippet?: string;
}

/** Maps every entity name to its record type — used by the generic store. */
export interface Consultation extends BaseRecord {
  client_id?: string;
  client_name?: string;
  client_email?: string;
  practitioner_id: string;
  practitioner_name?: string;
  requested_time?: string;
  status?: 'requested' | 'scheduled' | 'completed' | 'declined' | 'converted';
  message?: string;
  notes?: string;
  booking_id?: string;
}

export interface ClientRecord extends BaseRecord {
  practitioner_id: string;
  client_id?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  tags?: string[];
  notes?: string;
  first_seen?: string;
  last_seen?: string;
}

export interface ConsultationNote extends BaseRecord {
  practitioner_id: string;
  client_id?: string;
  booking_id?: string;
  consultation_id?: string;
  body: string;
}

export interface ClientDocument extends BaseRecord {
  practitioner_id: string;
  client_id?: string;
  booking_id?: string;
  kind?: 'waiver' | 'intake' | 'id' | 'other';
  title?: string;
  file_url?: string;
}

export interface ActivityEvent extends BaseRecord {
  user_id?: string;
  type?: string;
  path?: string;
}

export interface Reaction extends BaseRecord {
  target_type: 'post' | 'reply' | 'feed_item' | 'event';
  target_id: string;
  user_id: string;
  type?: string;
}

/** Integration & aftercare journaling (feature #6). */
export interface JournalEntry extends BaseRecord {
  user_id: string;
  booking_id?: string;
  practitioner_id?: string;
  kind: 'intention' | 'reflection' | 'checkin';
  mood?: string;
  wellbeing_rating?: number; // 1–10 self-report, powers the trend chart
  prompt?: string;           // the guided prompt this entry answers
  body: string;
}

/** Web-push subscription (feature #5). */
export interface PushSubscription extends BaseRecord {
  user_id: string;
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
  user_agent?: string;
}

export interface EntityTypeMap {
  User: User;
  Practitioner: Practitioner;
  Review: Review;
  Event: Event;
  EventRegistration: EventRegistration;
  Post: Post;
  Reply: Reply;
  CommunityResource: CommunityResource;
  Booking: Booking;
  Message: Message;
  PractitionerAvailability: PractitionerAvailability;
  Payment: Payment;
  Conversation: Conversation;
  Notification: Notification;
  Favorite: Favorite;
  PractitionerBlockedDate: PractitionerBlockedDate;
  PractitionerException: PractitionerException;
  Report: Report;
  SavedSearch: SavedSearch;
  Follow: Follow;
  Group: Group;
  GroupMembership: GroupMembership;
  FeedItem: FeedItem;
  Product: Product;
  Order: Order;
  Subscription: Subscription;
  Credential: Credential;
  ScreeningResponse: ScreeningResponse;
  ConsentRecord: ConsentRecord;
  ModerationCase: ModerationCase;
  Consultation: Consultation;
  ClientRecord: ClientRecord;
  ConsultationNote: ConsultationNote;
  ClientDocument: ClientDocument;
  ActivityEvent: ActivityEvent;
  Reaction: Reaction;
  JournalEntry: JournalEntry;
  PushSubscription: PushSubscription;
  Course: Course;
  CourseworkEnrollment: CourseworkEnrollment;
}

/** A user's paid enrollment + progress in a built-in coursework track. */
export interface CourseworkEnrollment extends BaseRecord {
  user_id: string;
  track: 'practitioner' | 'client';
  status?: 'active';
  price?: number;
  paid_at?: string;
  progress?: Record<string, { completed?: boolean; score?: number }>;
  completed_at?: string;
}

/** A practitioner training program listed in the course directory. */
export interface Course extends BaseRecord {
  title: string;
  provider?: string;
  description?: string;
  url?: string;
  location?: string;
  format?: 'online' | 'in_person' | 'hybrid';
  duration?: string;
  price?: number;
  currency?: string;
  image_url?: string;
  lineage?: string;
  is_featured?: boolean;
  status?: 'published' | 'draft';
}

export type EntityName = keyof EntityTypeMap;
