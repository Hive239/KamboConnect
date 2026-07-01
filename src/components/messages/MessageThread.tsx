import React, { useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronLeft } from "@/lib/icons";
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

export default function MessageThread({ conversation, messages, currentUser, onSendMessage, isSending, onBack }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!conversation) {
    return (
      <Card className="h-full flex-col hidden lg:flex border-0 rounded-none lg:rounded-lg">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Select a Conversation</h3>
            <p className="text-muted-foreground">Choose a conversation from the list to start messaging.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const otherParticipant = conversation.participant_1_id === currentUser.id
    ? { name: conversation.participant_2_name }
    : { name: conversation.participant_1_name };

  return (
    <Card className="h-full flex flex-col border-0 lg:border rounded-none lg:rounded-lg">
      <CardHeader className="pb-3 border-b flex-row items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack} aria-label="Back to conversations">
            <ChevronLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-10 h-10">
          <AvatarFallback>{otherParticipant.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg">{otherParticipant.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {conversation.conversation_type === 'direct' ? 'Direct Message' : 'Support Chat'}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-y-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Start the Conversation</h3>
              <p className="text-muted-foreground text-sm">Send your first message to begin.</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
              return (
                <MessageBubble
                  key={message.id || `msg-${index}`}
                  message={message}
                  isSender={message.sender_id === currentUser.id}
                  senderName={message.sender_name}
                  showAvatar={showAvatar}
                />
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        <MessageInput onSendMessage={onSendMessage} isSending={isSending} />
      </CardContent>
    </Card>
  );
}