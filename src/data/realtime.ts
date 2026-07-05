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
  journal_entries: 'JournalEntry',
  reactions: 'Reaction', // likes propagate across tabs/devices
  group_memberships: 'GroupMembership', // join requests / approvals live-update
  event_registrations: 'EventRegistration', // capacity counts live-update
};

let started = false;

function bindTables(channel: any) {
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
}

export function startRealtime() {
  if (started || !supabase) return;
  started = true;
  const sb = supabase;
  let channel: any = null;
  let authedToken: string | null = null;

  // postgres_changes on RLS-protected tables (messages, notifications, …) only
  // delivers events when the realtime socket is authenticated as the user AND the
  // channel is subscribed after that. Boot runs before the session is restored, so
  // we (re)subscribe once a token is available and whenever it changes (refresh/sign-in).
  const connect = (token?: string | null) => {
    if (!token || authedToken === token) return;
    sb.realtime.setAuth(token);
    if (channel) sb.removeChannel(channel);
    channel = sb.channel('kc-realtime');
    bindTables(channel);
    channel.subscribe();
    authedToken = token;
  };

  sb.auth.getSession().then(({ data }) => connect(data.session?.access_token));
  sb.auth.onAuthStateChange((_e, session) => connect(session?.access_token));
}
