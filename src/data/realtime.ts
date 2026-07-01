import { supabase } from '@/lib/supabase';
import { emit } from './events';
import type { EntityName } from '@/types/entities';

/**
 * Bridges Supabase Realtime (postgres_changes) into the shared event bus so
 * existing subscribe() consumers (Messages, FeedView, NotificationCenter) get
 * live cross-client/cross-device updates — not just same-tab.
 */
const TABLE_TO_ENTITY: Record<string, EntityName> = {
  messages: 'Message',
  notifications: 'Notification',
  feed_items: 'FeedItem',
  conversations: 'Conversation',
  follows: 'Follow', // FeedView listens for Follow changes to refresh the "Following" feed
};

let started = false;

export function startRealtime() {
  if (started || !supabase) return;
  started = true;
  const channel = supabase.channel('kc-realtime');
  for (const [table, entity] of Object.entries(TABLE_TO_ENTITY)) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload: any) => {
        const op = payload.eventType === 'INSERT' ? 'create' : payload.eventType === 'UPDATE' ? 'update' : 'delete';
        emit(entity, op as any, payload.new ?? payload.old ?? null);
      },
    );
  }
  channel.subscribe();
}
