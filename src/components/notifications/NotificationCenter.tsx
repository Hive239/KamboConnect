import React, { useState, useEffect, useCallback } from "react";
import { User, Notification } from "@/entities/all";
import { subscribe } from "@/data/store";
import { Bell, MessageSquare, CalendarCheck, Star, Users, Info, Loader2, X } from "@/lib/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const NOTIFICATION_CHECK_INTERVAL = 120000; // Check every 2 minutes (reduced frequency)

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFailing, setIsFailing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async (currentUser, force = false) => {
    if (!currentUser || isFailing) return;
    
    // Prevent rapid successive calls - enforce minimum 30 second delay
    const now = Date.now();
    if (!force && now - lastFetchTime < 30000) {
      return;
    }
    
    setIsLoading(true);
    setLastFetchTime(now);
    
    try {
      const fetchedNotifications = await Notification.filter(
        { user_id: currentUser.id },
        "-created_date",
        20
      );
      setNotifications(fetchedNotifications);
      setIsFailing(false); // Reset failure state on success
    } catch (err) {
      console.warn("Could not fetch notifications. Pausing automatic checks.", err.message);
      setIsFailing(true);
      setNotifications([]);
      // Retry after 10 minutes on failure
      setTimeout(() => setIsFailing(false), 600000);
    } finally {
      setIsLoading(false);
    }
  }, [isFailing, lastFetchTime]);

  const dismissNotification = useCallback(async (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    try {
      await Notification.delete(notificationId);
    } catch (error) {
      console.warn("Failed to dismiss notification silently.", error.message);
    }
  }, []);

  const handleNotificationClick = useCallback(async (notification) => {
    if (!notification.is_read) {
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
      try {
        await Notification.update(notification.id, { is_read: true });
      } catch (error) {
        console.warn("Failed to mark notification as read silently.", error.message);
      }
    }
    // Only follow internal, path-relative targets — action_url comes from a
    // world-writable table, so never navigate to absolute/external/scheme URLs.
    const target = notification.action_url?.trim();
    if (target && target !== "#" && target.startsWith("/") && !target.startsWith("//")) {
      setIsOpen(false);
      navigate(target);
    }
  }, [navigate]);

  useEffect(() => {
    // Cleanup handles must live in the effect scope — an async function's return
    // value is NOT received by React, so returning cleanup from inside `init`
    // leaked a setInterval + store subscription on every mount.
    let intervalId: any;
    let unsub: () => void = () => {};
    const init = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        if (currentUser) {
          await fetchNotifications(currentUser, true); // Force initial fetch
          intervalId = setInterval(() => {
            if (!isFailing) {
              fetchNotifications(currentUser);
            }
          }, NOTIFICATION_CHECK_INTERVAL);
          // Live refresh on realtime notification changes (cross-device)
          unsub = subscribe('Notification', (change: any) => {
            fetchNotifications(currentUser, true);
            // Fire a native browser notification for new ones (if the user opted in).
            if (change?.op === 'create' && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              const n = change.record || {};
              if (n.user_id === currentUser.id) {
                try { new Notification(n.title || 'KamboGuide', { body: n.message || '', icon: '/icon.svg' }); } catch { /* ignore */ }
              }
            }
          });
        }
      } catch (e) {
        setUser(null);
      }
    };
    init();
    return () => { if (intervalId) clearInterval(intervalId); unsub(); };
  }, []); // Remove fetchNotifications from dependencies to prevent re-initialization

  const getNotificationIcon = (type) => {
    const icons = {
      booking: <CalendarCheck className="w-5 h-5 text-primary" />,
      message: <MessageSquare className="w-5 h-5 text-blue-500" />,
      event: <CalendarCheck className="w-5 h-5 text-purple-500" />,
      review: <Star className="w-5 h-5 text-warning" />,
      community: <Users className="w-5 h-5 text-orange-500" />,
      system: <Info className="w-5 h-5 text-muted-foreground" />,
    };
    return icons[type] || <Bell className="w-5 h-5 text-muted-foreground" />;
  };
  
  const getNotificationBorder = (type) => {
      const borders = {
          booking: 'border-l-emerald-500',
          message: 'border-l-blue-500',
          event: 'border-l-purple-500',
          review: 'border-l-yellow-500',
          community: 'border-l-orange-500',
          system: 'border-l-gray-500',
      };
      return borders[type] || 'border-l-gray-500';
  };

  const getNotificationBg = (type, isRead) => {
      if (isRead) return 'bg-card hover:bg-accent';
      const backgrounds = {
          booking: 'bg-primary/5 hover:bg-primary/10',
          message: 'bg-blue-50 hover:bg-blue-100',
          event: 'bg-purple-50 hover:bg-purple-100',
          review: 'bg-yellow-50 hover:bg-yellow-100',
          community: 'bg-orange-50 hover:bg-orange-100',
          system: 'bg-muted hover:bg-accent',
      };
      return backgrounds[type] || 'bg-muted hover:bg-accent';
  };

  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}>
          <Bell className="w-5 h-5" weight="duotone" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {unreadCount} new
            </Badge>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
              <p className="font-medium">No notifications</p>
              <p className="text-xs">New updates will appear here.</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`flex gap-3 p-3 border-b border-l-4 transition-colors cursor-pointer ${getNotificationBorder(notification.type)} ${getNotificationBg(notification.type, notification.is_read)}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex-shrink-0 pt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                  </p>
                </div>
                <Button variant="ghost" size="icon" aria-label="Dismiss notification" className="h-8 w-8 self-center" onClick={(e) => { e.stopPropagation(); dismissNotification(notification.id); }}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}