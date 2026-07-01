import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, MessageSquarePlus } from "@/lib/icons";
import ConversationListItem from './ConversationListItem';
import { Button } from '@/components/ui/button';

export default function ConversationList({
  conversations,
  selectedConversation,
  onConversationSelect,
  currentUser,
  searchTerm,
  setSearchTerm,
  unreadCounts,
  onNewConversation
}) {

  const filteredConversations = conversations.filter(conv => {
    const otherParticipantName = conv.participant_1_id === currentUser?.id
      ? conv.participant_2_name
      : conv.participant_1_name;
    return otherParticipantName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Card className="h-full flex flex-col border-0 rounded-none">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <MessageSquare className="w-5 h-5" />
            Chats
          </CardTitle>
          <Button variant="ghost" size="icon" aria-label="New conversation" onClick={onNewConversation}>
              <MessageSquarePlus className="w-5 h-5 text-muted-foreground"/>
            </Button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Conversations Yet
            </h3>
            <p className="text-muted-foreground text-sm">
              Start a conversation with a practitioner to get support.
            </p>
          </div>
        ) : (
          <div>
            {filteredConversations.map(conversation => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedConversation?.id === conversation.id}
                onSelect={onConversationSelect}
                currentUser={currentUser}
                unreadCount={unreadCounts?.[conversation.id] || 0}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}