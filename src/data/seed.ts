/**
 * Realistic seed data for offline/local development.
 * IDs are stable and cross-referenced (bookings → practitioners, messages →
 * conversations, etc.) so the app behaves like a populated platform.
 *
 * Demo accounts (switch via the dev Role Switcher, see src/data/session.ts):
 *   - client@demo.test     (role: user, a client)
 *   - maria@demo.test      (role: user, a practitioner — matches Practitioner prac-maria)
 *   - admin@demo.test      (role: admin)
 */
import type { EntityName } from '@/types/entities';

const DAY = 86_400_000;
const base = Date.now();
const iso = (offsetDays: number) => new Date(base + offsetDays * DAY).toISOString();

function stamp<T extends Record<string, any>>(rows: T[], spreadDays = 90): (T & {
  created_date: string;
  updated_date: string;
})[] {
  return rows.map((r, i) => ({
    ...r,
    created_date: r.created_date ?? iso(-(spreadDays - (i % spreadDays))),
    updated_date: r.updated_date ?? iso(-(i % 14)),
  }));
}

const img = (id: string, w = 600) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

// ---- Users -----------------------------------------------------------------
const users = [
  {
    id: 'user-client',
    email: 'client@demo.test',
    full_name: 'Jordan Rivera',
    role: 'user',
    profile_image_url: img('1500648767791-00dcc994a43e', 200),
    preferences: { notify_bookings: true, notify_messages: true, notify_events: true },
  },
  {
    id: 'user-maria',
    email: 'maria@demo.test',
    full_name: 'Grandmother Maria Santos',
    role: 'user',
    profile_image_url: img('1544005313-94ddf0286df2', 200),
    preferences: {},
  },
  {
    id: 'user-admin',
    email: 'admin@demo.test',
    full_name: 'Avery Admin',
    role: 'admin',
    profile_image_url: img('1535713875002-d1d0cf377fde', 200),
    preferences: {},
  },
];

// ---- Practitioners ---------------------------------------------------------
const cities = [
  { city: 'Sedona', state_province: 'AZ', latitude: 34.8697, longitude: -111.761 },
  { city: 'Austin', state_province: 'TX', latitude: 30.2672, longitude: -97.7431 },
  { city: 'Asheville', state_province: 'NC', latitude: 35.5951, longitude: -82.5515 },
  { city: 'Portland', state_province: 'OR', latitude: 45.5152, longitude: -122.6784 },
  { city: 'Boulder', state_province: 'CO', latitude: 40.015, longitude: -105.2705 },
  { city: 'Miami', state_province: 'FL', latitude: 25.7617, longitude: -80.1918 },
  { city: 'Santa Fe', state_province: 'NM', latitude: 35.687, longitude: -105.9378 },
  { city: 'San Diego', state_province: 'CA', latitude: 32.7157, longitude: -117.1611 },
  { city: 'Joshua Tree', state_province: 'CA', latitude: 34.1347, longitude: -116.3131 },
  { city: 'Brooklyn', state_province: 'NY', latitude: 40.6782, longitude: -73.9442 },
  { city: 'Maui', state_province: 'HI', latitude: 20.7984, longitude: -156.3319 },
  { city: 'Taos', state_province: 'NM', latitude: 36.4072, longitude: -105.5731 },
];
const portraits = [
  '1544005313-94ddf0286df2', '1507003211169-0a1dd7228f2d', '1500648767791-00dcc994a43e',
  '1494790108377-be9c29b29330', '1438761681033-6461ffad8d80', '1472099645785-5658abf4ff4e',
  '1517841905240-472988babdf9', '1519085360753-af0119f7cbe7', '1534528741775-53994a69daeb',
  '1506794778202-cad84cf45f1d', '1531123897727-8f129e1688ce', '1502685104226-ee32379fefbe',
];
const names = [
  'Grandmother Maria Santos', 'River Thompson', 'Daniel Okafor', 'Luna Castillo',
  'Sage Whitefeather', 'Aria Nakamura', 'Marcus Bennett', 'Ynez Delgado',
  'Kai Ferreira', 'Tessa Bloom', 'Hana Moana', 'Lobo Trujillo',
];
const tiers = ['premium', 'featured', 'premium', 'verified', 'featured', 'verified',
  'verified', 'featured', 'verified', 'verified', 'premium', 'verified'] as const;
const levels = ['master', 'advanced', 'master', 'basic', 'advanced', 'basic',
  'pending', 'advanced', 'basic', 'rejected', 'master', 'basic'] as const;
const allSpecs = ['Traditional Kambo', 'Sananga', 'Hapé / Rapé', 'Integration Coaching',
  'Group Circles', 'Women’s Circles', 'Trauma-Informed', 'Microdosing Guidance'];
const langs = [['English', 'Spanish'], ['English'], ['English', 'French'], ['English', 'Spanish'],
  ['English'], ['English', 'Japanese'], ['English'], ['English', 'Spanish'],
  ['English', 'Portuguese'], ['English'], ['English', 'Hawaiian'], ['English', 'Spanish']];

const practitioners = names.map((full_name, i) => {
  const id = i === 0 ? 'prac-maria' : `prac-${i + 1}`;
  const c = cities[i];
  const level = levels[i];
  return {
    id,
    full_name,
    email: i === 0 ? 'maria@demo.test' : `${full_name.split(' ').slice(-1)[0].toLowerCase()}@demo.test`,
    phone: `+1 (555) 0${100 + i}-20${i}0`,
    address: { city: c.city, state_province: c.state_province, country: 'USA' },
    latitude: c.latitude,
    longitude: c.longitude,
    bio: `${full_name.split(' ')[0]} is a dedicated Kambo practitioner serving the ${c.city} community with reverence, safety, and deep respect for the tradition. Sessions are held in a calm, supportive container.`,
    years_experience: 3 + ((i * 2) % 12),
    certifications: ['IAKP Certified', 'CPR / First Aid', 'Wilderness First Responder'].slice(0, 2 + (i % 2)),
    specializations: allSpecs.slice(i % 3, (i % 3) + 3),
    modalities: allSpecs.slice(i % 3, (i % 3) + 3),
    is_online: i % 2 === 0,
    is_verified: level !== 'pending' && level !== 'rejected',
    verification_level: level,
    rejection_reason: level === 'rejected' ? 'Certification documents could not be verified.' : undefined,
    listing_tier: tiers[i],
    website_url: `https://${full_name.split(' ').slice(-1)[0].toLowerCase()}kambo.example`,
    social_media: { instagram: `@${full_name.split(' ')[0].toLowerCase()}.kambo` },
    profile_image_url: img(portraits[i], 400),
    image_urls: [img('1545389336-cf090694435e', 800), img('1518609878373-06d740f60d8b', 800)],
    pricing_range: (['$$', '$$$', '$$$$', '$$'] as const)[i % 4],
    languages: langs[i],
    availability_notes: 'Weekends and select weekday mornings. Book 1–2 weeks ahead.',
    safety_protocols: 'Full intake screening, hydration protocol, and continuous monitoring throughout the session.',
    training_background: 'Trained in the Matsés and Katukina lineages with ongoing mentorship.',
    why_practitioner: 'I walk this path to hold space for genuine healing and reconnection.',
  };
});

// ---- Reviews ---------------------------------------------------------------
const reviewTexts = [
  'A profoundly safe and grounding experience. I felt held the entire time.',
  'Incredibly knowledgeable and attentive to safety. Highly recommend.',
  'The integration support afterward made all the difference.',
  'Calm, professional, and deeply respectful of the medicine.',
];
const reviews = practitioners.slice(0, 8).flatMap((p, pi) =>
  Array.from({ length: 2 + (pi % 3) }, (_, ri) => ({
    id: `rev-${p.id}-${ri}`,
    practitioner_id: p.id,
    booking_id: `bk-seed-${pi}-${ri}`,
    reviewer_name: ['Sam K.', 'Priya N.', 'Leo M.', 'Dana R.', 'Chris P.'][(pi + ri) % 5],
    reviewer_id: `user-rev-${pi}-${ri}`,
    session_date: iso(-(10 + pi * 3 + ri)),
    overall_rating: 5 - ((pi + ri) % 2),
    safety_rating: 5,
    communication_rating: 5 - (ri % 2),
    environment_rating: 5,
    professionalism_rating: 5,
    review_text: reviewTexts[(pi + ri) % reviewTexts.length],
    would_recommend: true,
    verified_client: true,
    session_type: 'Private Session',
  })),
);

// ---- Events ----------------------------------------------------------------
const events = [
  {
    id: 'evt-1', title: 'New Moon Kambo Circle', practitioner_id: 'prac-maria',
    description: 'A supportive group circle held under the new moon. Beginners welcome.',
    event_type: 'circle', start_date: iso(7), end_date: iso(7), price: 150, currency: 'USD',
    address: { city: 'Sedona', state_province: 'AZ', country: 'USA' },
    max_participants: 8, current_participants: 5, status: 'upcoming',
    what_to_bring: ['Yoga mat', 'Water bottle', 'Journal'], image_url: img('1518611012118-696072aa579a', 800),
  },
  {
    id: 'evt-2', title: 'Integration Weekend Retreat', practitioner_id: 'prac-3',
    description: 'A two-day retreat blending Kambo, breathwork, and integration practices.',
    event_type: 'retreat', start_date: iso(21), end_date: iso(23), price: 650, currency: 'USD',
    address: { city: 'Asheville', state_province: 'NC', country: 'USA' },
    max_participants: 12, current_participants: 9, status: 'upcoming',
    what_to_bring: ['Comfortable clothing', 'Sleeping bag'], image_url: img('1500530855697-b586d89ba3ee', 800),
  },
  {
    id: 'evt-3', title: 'Intro to Kambo Workshop (Online)', practitioner_id: 'prac-5',
    description: 'Learn the history, safety, and science of Kambo in this live online workshop.',
    event_type: 'workshop', start_date: iso(3), price: 45, currency: 'USD',
    is_online: true, meeting_link: 'https://meet.example/kambo-intro',
    max_participants: 100, current_participants: 38, status: 'upcoming',
  },
];

// ---- Community -------------------------------------------------------------
const posts = [
  {
    id: 'post-1', title: 'First Kambo experience — what to expect?', author_id: 'user-client',
    author_name: 'Jordan Rivera', category: 'Q&A',
    content: 'I have my first session next week and would love to hear how others prepared.',
    reply_count: 2, is_pinned: false, is_locked: false, last_reply_date: iso(-1),
  },
  {
    id: 'post-2', title: 'Integration practices that helped me', author_id: 'user-maria',
    author_name: 'Grandmother Maria Santos', category: 'Integration',
    content: 'Sharing a few grounding practices that supported my clients after their sessions.',
    reply_count: 1, is_pinned: true, is_locked: false, last_reply_date: iso(-2),
  },
];
const replies = [
  { id: 'rep-1', post_id: 'post-1', author_id: 'user-maria', author_name: 'Grandmother Maria Santos', content: 'Hydrate well the day before and keep the day after open for rest.' },
  { id: 'rep-2', post_id: 'post-1', author_id: 'user-admin', author_name: 'Avery Admin', content: 'Welcome! Check the Learn section for a full preparation guide.' },
  { id: 'rep-3', post_id: 'post-2', author_id: 'user-client', author_name: 'Jordan Rivera', content: 'Thank you for sharing — the journaling prompt was perfect.' },
];
const communityResources = [
  { id: 'res-1', title: 'Kambo Safety Protocols', url: '/Education', category: 'Safety Protocols', resource_type: 'Article', description: 'Core safety standards every practitioner should follow.' },
  { id: 'res-2', title: 'Community Guidelines', url: '/Disclaimer', category: 'Community Guidelines', resource_type: 'Article', description: 'How we keep this space respectful and safe.' },
  { id: 'res-3', title: 'Integration Practices', url: '/Education', category: 'Integration Practices', resource_type: 'Video', description: 'Practices to support post-session integration.' },
];

// ---- Bookings / payments ---------------------------------------------------
const bookings = [
  {
    id: 'bk-1', practitioner_id: 'prac-maria', practitioner_name: 'Grandmother Maria Santos',
    client_id: 'user-client', client_name: 'Jordan Rivera', client_email: 'client@demo.test',
    client_phone: '+1 (555) 010-0101', service_type: 'Private Session',
    requested_date: iso(5), message: 'Looking forward to my first session.',
    status: 'confirmed', price: 200, payment_status: 'paid',
  },
  {
    id: 'bk-2', practitioner_id: 'prac-maria', practitioner_name: 'Grandmother Maria Santos',
    client_id: 'user-rev-1', client_name: 'Priya N.', client_email: 'priya@demo.test',
    service_type: 'Group Circle', requested_date: iso(2), status: 'pending', price: 150, payment_status: 'unpaid',
  },
  {
    id: 'bk-3', practitioner_id: 'prac-3', practitioner_name: 'Daniel Okafor',
    client_id: 'user-client', client_name: 'Jordan Rivera', client_email: 'client@demo.test',
    service_type: 'Consultation', requested_date: iso(-9), status: 'completed', price: 80, payment_status: 'paid',
  },
];
const payments = [
  { id: 'pay-1', booking_id: 'bk-1', user_id: 'user-client', practitioner_id: 'prac-maria', amount: 200, currency: 'USD', payment_type: 'booking', payment_status: 'completed', payment_date: iso(-3) },
  { id: 'pay-2', booking_id: 'bk-3', user_id: 'user-client', practitioner_id: 'prac-3', amount: 80, currency: 'USD', payment_type: 'booking', payment_status: 'completed', payment_date: iso(-9) },
];

// ---- Messaging -------------------------------------------------------------
const conversations = [
  {
    id: 'conv-1', participant_1_id: 'user-client', participant_1_name: 'Jordan Rivera',
    participant_2_id: 'user-maria', participant_2_name: 'Grandmother Maria Santos',
    conversation_type: 'direct', related_booking_id: 'bk-1', is_active: true,
    last_message: 'See you on the day — rest well beforehand.', last_message_date: iso(-1),
  },
];
const messages = [
  { id: 'msg-1', conversation_id: 'conv-1', booking_id: 'bk-1', sender_id: 'user-client', receiver_id: 'user-maria', sender_name: 'Jordan Rivera', content: 'Hi Maria! Anything I should do to prepare?', message_type: 'user', is_read: true },
  { id: 'msg-2', conversation_id: 'conv-1', booking_id: 'bk-1', sender_id: 'user-maria', receiver_id: 'user-client', sender_name: 'Grandmother Maria Santos', content: 'Hydrate well and eat lightly the day before. 💚', message_type: 'user', is_read: true },
  { id: 'msg-3', conversation_id: 'conv-1', booking_id: 'bk-1', sender_id: 'user-maria', receiver_id: 'user-client', sender_name: 'Grandmother Maria Santos', content: 'See you on the day — rest well beforehand.', message_type: 'user', is_read: false },
];

// ---- Notifications / favorites / scheduling --------------------------------
const notifications = [
  { id: 'ntf-1', user_id: 'user-client', title: 'Booking confirmed', message: 'Your session with Maria Santos is confirmed.', type: 'booking', priority: 'normal', is_read: false, related_id: 'bk-1' },
  { id: 'ntf-2', user_id: 'user-client', title: 'New message', message: 'Maria Santos sent you a message.', type: 'message', priority: 'normal', is_read: false, related_id: 'conv-1' },
  { id: 'ntf-3', user_id: 'user-maria', title: 'New booking request', message: 'Priya N. requested a Group Circle.', type: 'booking', priority: 'high', is_read: false, related_id: 'bk-2' },
];
const favorites = [
  { id: 'fav-1', user_id: 'user-client', item_id: 'prac-maria', item_type: 'practitioner', item_title: 'Grandmother Maria Santos', metadata: { practitioner_name: 'Grandmother Maria Santos', image_url: img(portraits[0], 400) } },
  { id: 'fav-2', user_id: 'user-client', item_id: 'evt-1', item_type: 'event', item_title: 'New Moon Kambo Circle', metadata: { event_date: iso(7) } },
];
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const practitionerAvailability = ['tuesday', 'thursday', 'saturday'].map((d, i) => ({
  id: `avail-${i}`, practitioner_id: 'prac-maria', day_of_week: d, start_time: '09:00', end_time: '15:00', is_available: true,
}));
const practitionerBlockedDates = [
  { id: 'blk-1', practitioner_id: 'prac-maria', date: iso(10).slice(0, 10), block_type: 'full_day', reason: 'Personal retreat' },
];
const practitionerExceptions = [
  { id: 'exc-1', practitioner_id: 'prac-maria', date: iso(14).slice(0, 10), day_of_week: days[(new Date(base + 14 * DAY).getDay() + 6) % 7], exception_type: 'additional', start_time: '17:00', end_time: '20:00', notes: 'Evening availability added' },
];
const eventRegistrations = [
  { id: 'reg-1', event_id: 'evt-1', participant_name: 'Jordan Rivera', participant_email: 'client@demo.test', registration_status: 'confirmed', payment_status: 'paid', previous_kambo_experience: false },
];
const reports = [
  { id: 'rpt-1', reported_item_type: 'post', reported_item_id: 'post-1', reporter_id: 'user-admin', reporter_email: 'admin@demo.test', reason: 'spam', description: 'Possible off-topic content.', priority: 'low', status: 'pending' },
];

// ---- Platform feature seed data --------------------------------------------
const products = [
  { id: 'prod-1', seller_id: 'prac-maria', seller_name: 'Grandmother Maria Santos', title: 'Ceremonial Rapé — Forest Blend', description: 'Hand-prepared, ethically sourced rapé for grounding and intention setting.', category: 'Rapé', price: 38, currency: 'USD', image_urls: [img('1604908176997-125f25cc6f3d', 600)], stock: 24, status: 'active', tags: ['ethically-sourced', 'handmade'], rating: 4.8 },
  { id: 'prod-2', seller_id: 'prac-3', seller_name: 'Daniel Okafor', title: 'Hardwood Tepi (Applicator)', description: 'Traditional kuripe/tepi carved from sustainable hardwood.', category: 'Tepi', price: 65, currency: 'USD', image_urls: [img('1591871937573-74dbba515c4c', 600)], stock: 12, status: 'active', tags: ['handmade'], rating: 4.9 },
  { id: 'prod-3', seller_id: 'prac-maria', seller_name: 'Grandmother Maria Santos', title: 'Integration Journal', description: 'A guided journal for post-ceremony integration.', category: 'Books', price: 22, currency: 'USD', image_urls: [img('1517842645767-c639042777db', 600)], stock: 50, status: 'active', tags: ['integration'], rating: 4.7 },
  { id: 'prod-4', seller_id: 'prac-5', seller_name: 'Sage Whitefeather', title: 'Sacred Space Kit', description: 'Palo santo, sage, and a ceramic bowl for preparing your space.', category: 'Tools', price: 48, currency: 'USD', image_urls: [img('1602928298849-325cec8771c6', 600)], stock: 0, status: 'sold_out', tags: ['bundle'], rating: 4.6 },
  { id: 'prod-5', seller_id: 'prac-8', seller_name: 'Ynez Delgado', title: 'Kambo Aftercare Guide (Digital)', description: 'Downloadable PDF: hydration, rest, and integration protocols.', category: 'Digital', price: 12, currency: 'USD', image_urls: [img('1456513080510-7bf3a84b82f8', 600)], stock: 999, status: 'active', tags: ['digital', 'aftercare'], rating: 4.5 },
  { id: 'prod-6', seller_id: 'prac-11', seller_name: 'Hana Moana', title: 'Organic Cotton Ceremony Shawl', description: 'Soft, natural-dyed shawl for warmth during ceremony.', category: 'Apparel', price: 54, currency: 'USD', image_urls: [img('1620799140408-edc6dcb6d633', 600)], stock: 18, status: 'active', tags: ['organic'], rating: 4.8 },
];

const groups = [
  { id: 'grp-1', name: 'First-Timers Circle', description: 'A welcoming space for those new to Kambo to ask questions and prepare.', category: 'Support', image_url: img('1518609878373-06d740f60d8b', 600), member_count: 128, created_by: 'user-maria', is_private: false },
  { id: 'grp-2', name: 'Integration & Aftercare', description: 'Share practices and support for the days after a session.', category: 'Integration', image_url: img('1500530855697-b586d89ba3ee', 600), member_count: 86, created_by: 'user-admin', is_private: false },
  { id: 'grp-3', name: 'Practitioners Guild', description: 'A private space for verified practitioners to share protocols and ethics.', category: 'Professional', image_url: img('1545389336-cf090694435e', 600), member_count: 34, created_by: 'user-maria', is_private: true },
];
const groupMemberships = [
  { id: 'gm-1', group_id: 'grp-1', user_id: 'user-client', user_name: 'Jordan Rivera', role: 'member' },
  { id: 'gm-2', group_id: 'grp-1', user_id: 'user-maria', user_name: 'Grandmother Maria Santos', role: 'owner' },
  { id: 'gm-3', group_id: 'grp-3', user_id: 'user-maria', user_name: 'Grandmother Maria Santos', role: 'owner' },
];

const follows = [
  { id: 'fol-1', follower_id: 'user-client', followee_id: 'prac-maria', followee_type: 'practitioner', followee_name: 'Grandmother Maria Santos', followee_image_url: img(portraits[0], 200) },
  { id: 'fol-2', follower_id: 'user-client', followee_id: 'prac-3', followee_type: 'practitioner', followee_name: 'Daniel Okafor', followee_image_url: img(portraits[2], 200) },
  { id: 'fol-3', follower_id: 'user-client', followee_id: 'grp-1', followee_type: 'group', followee_name: 'First-Timers Circle' },
];

const credentials = [
  { id: 'cred-1', practitioner_id: 'prac-maria', type: 'kambo', title: 'IAKP Practitioner Certification', issuer: 'IAKP', file_uri: '#', issued_date: iso(-800), expiry_date: iso(400), status: 'verified', reviewer_id: 'user-admin' },
  { id: 'cred-2', practitioner_id: 'prac-maria', type: 'cpr', title: 'CPR / First Aid', issuer: 'Red Cross', file_uri: '#', issued_date: iso(-300), expiry_date: iso(20), status: 'verified', reviewer_id: 'user-admin' },
  { id: 'cred-3', practitioner_id: 'prac-7', type: 'kambo', title: 'Kambo Training Certificate', issuer: 'Independent', file_uri: '#', issued_date: iso(-100), status: 'pending' },
];

const subscriptions = [
  { id: 'sub-1', practitioner_id: 'prac-maria', tier: 'premium', status: 'active', price: 49, currency: 'USD', period: 'monthly', current_period_end: iso(20), payment_id: 'pay-sub-1' },
];

const feedItems = [
  { id: 'feed-1', actor_id: 'prac-maria', actor_name: 'Grandmother Maria Santos', actor_image_url: img(portraits[0], 200), verb: 'hosted_event', object_type: 'event', object_id: 'evt-1', summary: 'is hosting a New Moon Kambo Circle', image_url: img('1518611012118-696072aa579a', 600), action_url: '/Events' },
  { id: 'feed-2', actor_id: 'prac-3', actor_name: 'Daniel Okafor', actor_image_url: img(portraits[2], 200), verb: 'posted', object_type: 'post', object_id: 'post-2', summary: 'shared integration practices that helped clients', action_url: '/Post?id=post-2' },
  { id: 'feed-3', actor_id: 'prac-maria', actor_name: 'Grandmother Maria Santos', actor_image_url: img(portraits[0], 200), verb: 'listed_product', object_type: 'product', object_id: 'prod-1', summary: 'listed Ceremonial Rapé — Forest Blend', image_url: img('1604908176997-125f25cc6f3d', 600), action_url: '/Market' },
];

const moderationCases = [
  { id: 'mod-1', subject_type: 'post', subject_id: 'post-1', source: 'ai', score: 0.22, reasons: ['possible-off-topic'], status: 'open', snippet: 'First Kambo experience — what to expect?' },
];

/** Build a fresh seeded database (called on first load or on reset). */
export function buildSeed(): Record<EntityName, any[]> {
  return {
    User: stamp(users),
    Practitioner: stamp(practitioners),
    Review: stamp(reviews),
    Event: stamp(events),
    EventRegistration: stamp(eventRegistrations),
    Post: stamp(posts),
    Reply: stamp(replies),
    CommunityResource: stamp(communityResources),
    Booking: stamp(bookings),
    Message: stamp(messages, 7),
    PractitionerAvailability: stamp(practitionerAvailability),
    Payment: stamp(payments),
    Conversation: stamp(conversations, 7),
    Notification: stamp(notifications, 7),
    Favorite: stamp(favorites),
    PractitionerBlockedDate: stamp(practitionerBlockedDates),
    PractitionerException: stamp(practitionerExceptions),
    Report: stamp(reports),
    SavedSearch: stamp([]),
    Follow: stamp(follows),
    Group: stamp(groups),
    GroupMembership: stamp(groupMemberships),
    FeedItem: stamp(feedItems, 14),
    Product: stamp(products),
    Order: stamp([]),
    Subscription: stamp(subscriptions),
    Credential: stamp(credentials),
    ScreeningResponse: stamp([]),
    ConsentRecord: stamp([]),
    ModerationCase: stamp(moderationCases),
  };
}
