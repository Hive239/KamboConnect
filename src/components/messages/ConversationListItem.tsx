import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ConversationListItem({ conversation, isSelected, onSelect, currentUser, unreadCount = 0 }) {
  const other = conversation.participant_1_id === currentUser.id
    ? { name: conversation.participant_2_name, image: conversation.participant_2_image }
    : { name: conversation.participant_1_name, image: conversation.participant_1_image };
  const initial = (other.name || '?').charAt(0).toUpperCase();
  const unread = unreadCount > 0;

  return (
    <button
      onClick={() => onSelect(conversation)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
        isSelected ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-accent",
      )}
    >
      <span className="relative shrink-0">
        {other.image
          ? <img src={other.image} alt={other.name} className="h-11 w-11 rounded-full object-cover" />
          : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-clay/25 font-semibold text-primary">{initial}</span>}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className={cn("truncate text-sm", unread ? "font-semibold text-foreground" : "font-medium")}>{other.name}</span>
          {conversation.last_message_date && (
            <span className="shrink-0 text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(conversation.last_message_date), { addSuffix: false })}</span>
          )}
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span className={cn("truncate text-xs", unread ? "text-foreground" : "text-muted-foreground")}>{conversation.last_message || "No messages yet"}</span>
          {unread && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </span>
      </span>
    </button>
  );
}
