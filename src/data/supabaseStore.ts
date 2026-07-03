/**
 * Supabase-backed implementation of the entity store (the swap target for the
 * mock in store.ts). Same EntityClient contract, so pages/components are unchanged.
 */
import { supabase } from '@/lib/supabase';
import { emit } from './events';
import type { BaseRecord, EntityName, EntityTypeMap } from '@/types/entities';
import type { EntityClient } from './store';

/** Entity name → Postgres table name (snake_case plural). */
const TABLE: Record<EntityName, string> = {
  User: 'profiles',
  Practitioner: 'practitioners',
  Review: 'reviews',
  Event: 'events',
  EventRegistration: 'event_registrations',
  Post: 'posts',
  Reply: 'replies',
  CommunityResource: 'community_resources',
  Booking: 'bookings',
  Message: 'messages',
  PractitionerAvailability: 'practitioner_availability',
  Payment: 'payments',
  Conversation: 'conversations',
  Notification: 'notifications',
  Favorite: 'favorites',
  PractitionerBlockedDate: 'practitioner_blocked_dates',
  PractitionerException: 'practitioner_exceptions',
  Report: 'reports',
  SavedSearch: 'saved_searches',
  Follow: 'follows',
  Group: 'groups',
  GroupMembership: 'group_memberships',
  FeedItem: 'feed_items',
  Product: 'products',
  Order: 'orders',
  Subscription: 'subscriptions',
  Credential: 'credentials',
  ScreeningResponse: 'screening_responses',
  ConsentRecord: 'consent_records',
  ModerationCase: 'moderation_cases',
  Consultation: 'consultations',
  ClientRecord: 'client_records',
  ConsultationNote: 'consultation_notes',
  ClientDocument: 'client_documents',
  Reaction: 'reactions',
  ActivityEvent: 'activity_events',
  Course: 'courses',
  CourseworkEnrollment: 'coursework_enrollments',
  ErrorLog: 'error_logs',
  EmailEvent: 'email_events',
  JournalEntry: 'journal_entries',
  PushSubscription: 'push_subscriptions',
};

function applySort<T>(q: any, sort?: string) {
  if (!sort) return q;
  const desc = sort.startsWith('-');
  return q.order(desc ? sort.slice(1) : sort, { ascending: !desc });
}

export function makeSupabaseEntity<K extends EntityName>(name: K): EntityClient<EntityTypeMap[K]> {
  type T = EntityTypeMap[K];
  const table = TABLE[name];
  const sb = () => {
    if (!supabase) throw new Error('Supabase not configured');
    return supabase.from(table);
  };
  return {
    async list(sort, limit) {
      let q = sb().select('*');
      q = applySort(q, sort);
      if (typeof limit === 'number') q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as T[];
    },
    async filter(query, sort, limit) {
      let q = sb().select('*');
      for (const [k, v] of Object.entries(query || {})) if (v !== undefined) q = q.eq(k, v as any);
      q = applySort(q, sort);
      if (typeof limit === 'number') q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as T[];
    },
    async get(id) {
      const { data, error } = await sb().select('*').eq('id', id).single();
      if (error) throw new Error(`${name} ${id} not found`);
      return data as T;
    },
    async create(data) {
      const { id, created_date, updated_date, ...rest } = data as any;
      const payload: any = { ...rest };
      if (id) payload.id = id; // preserve explicit ids (seeded cross-refs)
      const { data: row, error } = await sb().insert(payload).select().single();
      if (error) throw error;
      emit(name, 'create', row);
      return row as T;
    },
    async update(id, data) {
      const { id: _omit, ...rest } = data as any;
      const { data: row, error } = await sb().update({ ...rest, updated_date: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      emit(name, 'update', row);
      return row as T;
    },
    async delete(id) {
      const { error } = await sb().delete().eq('id', id);
      if (error) throw error;
      emit(name, 'delete', { id });
      return { success: true as const };
    },
  };
}
