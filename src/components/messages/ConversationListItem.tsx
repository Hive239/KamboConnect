import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function ConversationListItem({ conversation, isSelected, onSelect, currentUser, unreadCount }) {
  const otherParticipant = conversation.participant_1_id === currentUser.id
    ? { name: conversation.participant_2_name }
    : { name: conversation.participant_1_name };
    
  return (
    <div
      className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
        isSelected ? 'bg-primary/5 border-l-4 border-primary' : 'border-l-4 border-transparent'
      }`}
      onClick={() => onSelect(conversation)}
    >
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarFallback>{otherParticipant.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm truncate">{otherParticipant.name}</span>
            {conversation.last_message_date && (
              <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                {formatDistanceToNow(new Date(conversation.last_message_date), { addSuffix: true })}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
              {conversation.last_message ? (
                <p className="text-xs text-muted-foreground truncate">{conversation.last_message}</p>
              ) : (
                <p className="text-xs text-muted-foreground italic">No messages yet</p>
              )}
              {unreadCount > 0 && (
                <Badge className="bg-primary text-white h-5 px-2 text-xs flex-shrink-0 ml-2">{unreadCount}</Badge>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}