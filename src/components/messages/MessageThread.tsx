import React, { useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronLeft } from "@/lib/icons";
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

const dayLabel = (d) => isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'EEEE, MMM d');

export default function MessageThread({ conversation, messages, currentUser, onSendMessage, isSending, onBack }) {
  const messagesEndRef = useRef(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (!conversation) {
    return (
      <Card className="hidden h-full flex-col rounded-none border-0 lg:flex lg:rounded-2xl">
        <CardContent className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"><MessageSquare className="h-8 w-8 text-primary" weight="duotone" /></span>
            <h3 className="mb-1 text-lg font-semibold">Select a conversation</h3>
            <p className="text-muted-foreground">Choose a chat from the list to start messaging.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const other = conversation.participant_1_id === currentUser.id
    ? { name: conversation.participant_2_name, image: conversation.participant_2_image }
    : { name: conversation.participant_1_name, image: conversation.participant_1_image };
  const initial = (other.name || '?').charAt(0).toUpperCase();

  return (
    <Card className="flex h-full flex-col rounded-none border-0 lg:rounded-2xl lg:border">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack} aria-label="Back to conversations"><ChevronLeft className="h-5 w-5" /></Button>
        <span className="relative">
          {other.image
            ? <img src={other.image} alt={other.name} className="h-10 w-10 rounded-full object-cover" />
            : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-clay/25 font-semibold text-primary">{initial}</span>}
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-success" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{other.name}</p>
          <p className="text-xs text-success">Active recently</p>
        </div>
      </div>

      {/* Messages */}
      <CardContent className="flex flex-1 flex-col overflow-y-hidden p-0">
        <div className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-4">
          {messages.length === 0 ? (
            <div className="py-10 text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"><MessageSquare className="h-7 w-7 text-primary" weight="duotone" /></span>
              <h3 className="mb-1 font-semibold">Start the conversation</h3>
              <p className="text-sm text-muted-foreground">Send your first message to begin.</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const prev = messages[index - 1];
              const showAvatar = index === 0 || prev.sender_id !== message.sender_id;
              const showDay = index === 0 || !isSameDay(new Date(prev.created_date), new Date(message.created_date));
              return (
                <React.Fragment key={message.id || `msg-${index}`}>
                  {showDay && (
                    <div className="my-2 flex justify-center">
                      <span className="rounded-full bg-card/80 px-3 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur">{dayLabel(new Date(message.created_date))}</span>
                    </div>
                  )}
                  <MessageBubble
                    message={message}
                    isSender={message.sender_id === currentUser.id}
                    senderName={message.sender_name}
                    senderImage={message.sender_id === currentUser.id ? currentUser.profile_image_url : other.image}
                    showAvatar={showAvatar}
                  />
                </React.Fragment>
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
