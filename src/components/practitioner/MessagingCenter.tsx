
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
    <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversation List */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Conversations ({bookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {bookings.map(booking => {
                const unreadCount = getUnreadCount(booking.id);
                const lastMessage = getBookingMessages(booking.id)
                  .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
                
                return (
                  <div
                    key={booking.id}
                    className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
                      selectedBooking?.id === booking.id ? 'bg-primary/5 border-primary/20' : ''
                    }`}
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{booking.client_name}</span>
                          {unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs">{unreadCount}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {booking.service_type} - {new Date(booking.requested_date).toLocaleDateString()}
                        </p>
                        {lastMessage && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {lastMessage.content.substring(0, 50)}...
                          </p>
                        )}
                      </div>
                      {lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(lastMessage.created_date), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Thread */}
      <div className="lg:col-span-2">
        <Card className="h-full flex flex-col">
          {selectedBooking ? (
            <>
              <CardHeader>
                <CardTitle className="text-lg">
                  Chat with {selectedBooking.client_name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedBooking.service_type} - {new Date(selectedBooking.requested_date).toLocaleDateString()}
                </p>
              </CardHeader>
              
              {/* Messages */}
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 space-y-4 max-h-[350px] overflow-y-auto mb-4">
                  {getBookingMessages(selectedBooking.id)
                    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                    .map(message => (
                    <div 
                      key={message.id}
                      className={`flex ${
                        message.sender_id === practitioner.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div 
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.sender_id === practitioner.id
                            ? 'bg-primary text-white'
                            : message.message_type === 'automated'
                            ? 'bg-muted text-muted-foreground border-l-4 border-blue-400'
                            : 'bg-muted text-foreground'
                        }`}
                        // Mark as read only if the message is from the other party and is unread
                        onClick={() => !message.is_read && message.sender_id !== practitioner.id && markAsRead(message.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">
                            {message.sender_name}
                          </span>
                          <span className={`text-xs ${
                            message.sender_id === practitioner.id ? 'text-primary/80' : 'text-muted-foreground'
                          }`}>
                            {formatDistanceToNow(new Date(message.created_date), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        {/* Only show unread indicator for messages sent by others to the practitioner */}
                        {!message.is_read && message.sender_id !== practitioner.id && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 ml-auto"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Message Input */}
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={2}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={isSending || !newMessage.trim()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Select a Conversation</h3>
                <p className="text-muted-foreground">Choose a booking to start messaging with your client</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
