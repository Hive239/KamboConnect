
import React, { useState } from 'react';
import { Message, Conversation } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, User as UserIcon } from "@/lib/icons";
import { formatDistanceToNow } from "date-fns";
import { NotificationService } from '../notifications/NotificationService';

export default function MessagingCenter({ messages, practitioner, bookings, onUpdate }) {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Group messages by booking
  const messagesByBooking = messages.reduce((acc, message) => {
    if (!acc[message.booking_id]) {
      acc[message.booking_id] = [];
    }
    acc[message.booking_id].push(message);
    return acc;
  }, {});

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedBooking) return;
    
    setIsSending(true);
    try {
      // Find or create conversation for this booking
      let conversations = await Conversation.filter({ related_booking_id: selectedBooking.id });
      let conversation;
      
      if (conversations.length === 0) {
        // Create conversation if it doesn't exist
        conversation = await Conversation.create({
          participant_1_id: practitioner.id,
          // If the client_id is not available or for self-messaging, default to practitioner's ID for participant_2
          participant_2_id: selectedBooking.client_id || practitioner.id, 
          participant_1_name: practitioner.full_name,
          participant_2_name: selectedBooking.client_name,
          related_booking_id: selectedBooking.id,
          last_message: newMessage.trim(),
          last_message_date: new Date().toISOString()
        });
      } else {
        conversation = conversations[0];
      }

      // 1. Create the message
      const createdMessage = await Message.create({
        conversation_id: conversation.id,
        booking_id: selectedBooking.id,
        sender_id: practitioner.id,
        // If the client_id is not available or for self-messaging, default to practitioner's ID for receiver
        receiver_id: selectedBooking.client_id || practitioner.id, 
        sender_name: practitioner.full_name,
        content: newMessage.trim(),
        // Auto-mark as read if the sender is also the effective receiver (self-messaging)
        is_read: selectedBooking.client_id === practitioner.id 
      });

      // 2. Update the conversation
      await Conversation.update(conversation.id, {
        last_message: newMessage.trim(),
        last_message_date: new Date().toISOString()
      });
      
      // 3. Create notification (only if not self-messaging)
      if (selectedBooking.client_id && selectedBooking.client_id !== practitioner.id) {
        await NotificationService.createMessageNotification(selectedBooking.client_id, {
            sender_name: practitioner.full_name,
            content: newMessage.trim(),
            conversation_id: conversation.id
        });
      }

      setNewMessage("");
      onUpdate(); // This should trigger a refresh of messages
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await Message.update(messageId, { is_read: true });
      onUpdate();
    } catch (error) {
      console.error("Failed to mark message as read:", error);
    }
  };

  const getBookingMessages = (bookingId) => {
    return messagesByBooking[bookingId] || [];
  };

  const getUnreadCount = (bookingId) => {
    // Count unread messages that were sent TO the practitioner (i.e., practitioner is receiver or sender is not practitioner)
    return getBookingMessages(bookingId).filter(m => !m.is_read && m.sender_id !== practitioner.id).length;
  };

  return (
    <div className="grid h-[640px] gap-4 lg:grid-cols-3">
      {/* Conversation list */}
      <div className="lg:col-span-1">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur">
          <div className="border-b border-border p-4">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><MessageSquare className="h-4 w-4 text-primary" weight="duotone" /></span>
              Conversations
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{bookings.length}</span>
            </h3>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {bookings.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No client bookings yet.</div>
            ) : bookings.map((booking) => {
              const unreadCount = getUnreadCount(booking.id);
              const lastMessage = getBookingMessages(booking.id).sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
              const active = selectedBooking?.id === booking.id;
              const initial = (booking.client_name || "?").charAt(0).toUpperCase();
              return (
                <button
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors ${active ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-accent"}`}
                >
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-clay text-sm font-semibold text-primary-foreground">
                    {initial}
                    {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">{unreadCount}</span>}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm text-foreground ${unreadCount > 0 ? "font-semibold" : "font-medium"}`}>{booking.client_name}</span>
                      {lastMessage && <span className="shrink-0 text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(lastMessage.created_date), { addSuffix: true })}</span>}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{lastMessage ? lastMessage.content : `${booking.service_type} · ${new Date(booking.requested_date).toLocaleDateString()}`}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Thread */}
      <div className="lg:col-span-2">
        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur">
          {selectedBooking ? (
            <>
              <div className="flex items-center gap-3 border-b border-border bg-card/80 p-4 backdrop-blur">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-clay text-sm font-semibold text-primary-foreground">{(selectedBooking.client_name || "?").charAt(0).toUpperCase()}</span>
                <div>
                  <p className="font-semibold leading-tight">{selectedBooking.client_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedBooking.service_type} · {new Date(selectedBooking.requested_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-4">
                {getBookingMessages(selectedBooking.id).sort((a, b) => new Date(a.created_date) - new Date(b.created_date)).map((message) => {
                  const own = message.sender_id === practitioner.id;
                  const system = message.message_type === "automated" || message.message_type === "system";
                  if (system) {
                    return <div key={message.id} className="mx-auto max-w-[80%] rounded-full bg-muted px-3 py-1 text-center text-xs text-muted-foreground">{message.content}</div>;
                  }
                  return (
                    <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`} onClick={() => !message.is_read && !own && markAsRead(message.id)}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${own ? "rounded-br-md bg-gradient-to-br from-primary to-[hsl(var(--primary)/0.82)] text-primary-foreground" : "rounded-bl-md border border-border bg-card text-foreground"}`}>
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <p className={`mt-1 text-[10px] ${own ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{formatDistanceToNow(new Date(message.created_date), { addSuffix: true })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border bg-card/80 p-3 backdrop-blur">
                <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 focus-within:ring-2 focus-within:ring-primary/40">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message…"
                    rows={1}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    className="max-h-32 min-h-[40px] flex-1 resize-none border-0 bg-transparent p-2 focus-visible:ring-0"
                  />
                  <Button onClick={sendMessage} disabled={isSending || !newMessage.trim()} size="icon" className="h-10 w-10 shrink-0 rounded-xl">
                    <Send className="h-4 w-4" weight="fill" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"><MessageSquare className="h-8 w-8 text-primary" weight="duotone" /></span>
              <h3 className="mb-1 font-display text-lg font-semibold">Select a conversation</h3>
              <p className="text-sm text-muted-foreground">Choose a client booking to start messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
