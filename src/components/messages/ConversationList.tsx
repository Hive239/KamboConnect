import React from 'react';
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, MessageSquarePlus } from "@/lib/icons";
import ConversationListItem from './ConversationListItem';
import { Button } from '@/components/ui/button';

export default function ConversationList({
  conversations, selectedConversation, onConversationSelect, currentUser,
  searchTerm, setSearchTerm, unreadCounts, onNewConversation,
}) {
  const filtered = conversations.filter((conv) => {
    const name = conv.participant_1_id === currentUser?.id ? conv.participant_2_name : conv.participant_1_name;
    return (name || "").toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex h-full flex-col border-r border-border bg-card/60 backdrop-blur">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Messages</h2>
          <Button variant="ghost" size="icon" aria-label="New conversation" onClick={onNewConversation}>
            <MessageSquarePlus className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search conversations…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-10 rounded-full pl-9" />
        </div>
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="p-6 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"><MessageSquare className="h-7 w-7 text-primary" weight="duotone" /></span>
            <h3 className="mb-1 font-semibold">No conversations yet</h3>
            <p className="text-sm text-muted-foreground">Start a conversation with a practitioner.</p>
          </div>
        ) : (
          filtered.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversation?.id === conversation.id}
              onSelect={onConversationSelect}
              currentUser={currentUser}
              unreadCount={unreadCounts?.[conversation.id] || 0}
            />
          ))
        )}
      </div>
    </div>
  );
}
