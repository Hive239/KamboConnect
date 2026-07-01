import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { User, Notification, Conversation } from '@/entities/all';
import { BellPlus, Loader2, Check } from '@/lib/icons';
import { createPageUrl } from '@/utils';

export default function DemoNotificationGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const generateNotifications = async () => {
    setIsLoading(true);
    setIsSuccess(false);
    try {
      const user = await User.me();
      if (!user) {
        console.error("User not found. Please log in to generate notifications.");
        return;
      }
      
      // Find or create a dummy conversation to link to
      let conversations = await Conversation.filter({ participant_1_id: user.id, participant_2_name: "Demo Bot" });
      let demoConversation;

      if (conversations.length > 0) {
        demoConversation = conversations[0];
      } else {
        demoConversation = await Conversation.create({
          participant_1_id: user.id,
          participant_2_id: 'system_demo_bot',
          participant_1_name: user.full_name,
          participant_2_name: "Demo Bot",
          last_message: "This is a demo conversation.",
          last_message_date: new Date().toISOString()
        });
      }

      const notificationsToCreate = [
        {
          user_id: user.id,
          title: "Booking Confirmed!",
          message: "Your session with Jane Doe for next Tuesday has been confirmed.",
          type: "booking",
          priority: "high",
          action_url: createPageUrl('Bookings')
        },
        {
          user_id: user.id,
          title: "New Message from Demo Bot",
          message: "This is a sample message to test notifications. Click to view.",
          type: "message",
          priority: "normal",
          related_id: demoConversation.id,
          action_url: `${createPageUrl('Messages')}?conversation_id=${demoConversation.id}`
        },
        {
          user_id: user.id,
          title: "Event Reminder: Kambo Workshop",
          message: "Your workshop starts in 24 hours. Don't forget to prepare!",
          type: "event",
          priority: "urgent",
          action_url: createPageUrl('Events')
        },
        {
          user_id: user.id,
          title: "New Review on your Profile",
          message: "A client has left a new 5-star review. Great job!",
          type: "review",
          priority: "normal",
          action_url: createPageUrl('Profile') // Assuming a practitioner might see reviews on their main profile
        }
      ];

      // Use Promise.all to create all notifications concurrently
      await Promise.all(notificationsToCreate.map(n => Notification.create(n)));
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        // Maybe trigger a refresh of notifications in the UI
        window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      }, 3000);

    } catch (error) {
      console.error("Failed to generate notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted">
      <div>
        <h4 className="font-semibold text-foreground">Generate Sample Notifications</h4>
        <p className="text-sm text-muted-foreground">Click to add 4 sample notifications to your account for demonstration.</p>
      </div>
      <Button onClick={generateNotifications} disabled={isLoading || isSuccess} className="w-32">
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : isSuccess ? (
          <Check className="w-4 h-4 mr-2" />
        ) : (
          <BellPlus className="w-4 h-4 mr-2" />
        )}
        {isLoading ? "Generating..." : isSuccess ? "Done!" : "Generate"}
      </Button>
    </div>
  );
}