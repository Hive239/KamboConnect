
import { Notification } from '@/entities/Notification';
import { SendEmail } from '@/integrations/Core';
import { createPageUrl } from '@/utils';

export class NotificationService {
  // Create booking-related notifications
  static async createBookingNotification(userId, bookingData, type) {
    const notifications = {
      confirmed: {
        title: 'Booking Confirmed!',
        message: `Your session with ${bookingData.practitioner_name} has been confirmed for ${new Date(bookingData.requested_date).toLocaleDateString()}.`,
        priority: 'high'
      },
      declined: {
        title: 'Booking Update',
        message: `Unfortunately, ${bookingData.practitioner_name} cannot accommodate your requested session date.`,
        priority: 'normal'
      },
      cancelled: {
        title: 'Booking Cancelled',
        message: `Your session with ${bookingData.practitioner_name} has been cancelled.`,
        priority: 'normal'
      },
      completed: {
        title: 'Session Complete',
        message: `Your session with ${bookingData.practitioner_name} is complete. How was your experience?`,
        priority: 'normal'
      }
    };

    const config = notifications[type];
    if (!config) return;

    return await Notification.create({
      user_id: userId,
      title: config.title,
      message: config.message,
      type: 'booking',
      priority: config.priority,
      related_id: bookingData.id,
      action_url: createPageUrl('Bookings'),
      metadata: {
        practitioner_name: bookingData.practitioner_name,
        booking_status: type
      }
    });
  }

  // Create message notifications
  static async createMessageNotification(receiverId, messageData) {
    return await Notification.create({
      user_id: receiverId,
      title: `New message from ${messageData.sender_name}`,
      message: messageData.content.substring(0, 100) + (messageData.content.length > 100 ? '...' : ''),
      type: 'message',
      priority: 'normal',
      related_id: messageData.conversation_id,
      action_url: `${createPageUrl('Messages')}?conversation_id=${messageData.conversation_id}`,
      metadata: {
        sender_name: messageData.sender_name
      }
    });
  }

  // Create event notifications
  static async createEventNotification(userId, eventData, type) {
    const notifications = {
      registration_confirmed: {
        title: 'Event Registration Confirmed',
        message: `You're registered for "${eventData.title}" on ${new Date(eventData.start_date).toLocaleDateString()}.`,
        priority: 'high'
      },
      reminder_24h: {
        title: 'Event Tomorrow',
        message: `Don't forget: "${eventData.title}" is tomorrow at ${new Date(eventData.start_date).toLocaleTimeString()}.`,
        priority: 'high'
      },
      reminder_1h: {
        title: 'Event Starting Soon',
        message: `"${eventData.title}" begins in 1 hour. Please prepare accordingly.`,
        priority: 'urgent'
      },
      cancelled: {
        title: 'Event Cancelled',
        message: `Unfortunately, "${eventData.title}" has been cancelled. You'll receive a full refund.`,
        priority: 'high'
      }
    };

    const config = notifications[type];
    if (!config) return;

    return await Notification.create({
      user_id: userId,
      title: config.title,
      message: config.message,
      type: 'event',
      priority: config.priority,
      related_id: eventData.id,
      action_url: createPageUrl('Events'),
      metadata: {
        event_title: eventData.title
      }
    });
  }

  // Create community notifications
  static async createCommunityNotification(title, message, priority = 'normal', actionUrl = null) {
    // This would typically be sent to all users or a specific subset
    // For now, we'll create a method that can be called for specific users
    return {
      title,
      message,
      type: 'community',
      priority,
      action_url: actionUrl
    };
  }

  // Create system notifications
  static async createSystemNotification(userId, title, message, priority = 'normal') {
    return await Notification.create({
      user_id: userId,
      title,
      message,
      type: 'system',
      priority,
    });
  }

  // Send email notifications for high-priority items
  static async sendEmailNotification(userEmail, subject, message) {
    try {
      await SendEmail({
        to: userEmail,
        subject: `KamboConnect: ${subject}`,
        body: message
      });
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }
}
