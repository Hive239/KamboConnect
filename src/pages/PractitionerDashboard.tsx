
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom"; // Added Link and useNavigate
import { createPageUrl } from "@/utils"; // Added createPageUrl
import { User, Practitioner, Booking, Event, Message } from "@/entities/all";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  User as UserIcon,
  Calendar,
  MessageSquare,
  AlertCircle,
  Loader2,
  Home,
  Clock,
  CalendarDays,
  Star,
  ShieldCheck,
  Storefront,
  Users as UsersIcon,
  LogIn
} from "@/lib/icons";

import { resolvePractitionerForUser } from "@/lib/practitionerForUser";
import ProfileManagement from "../components/practitioner/ProfileManagement";
import ReviewsManagement from "../components/practitioner/ReviewsManagement";
import CredentialManagement from "../components/practitioner/CredentialManagement";
import ClientsManagement from "../components/practitioner/ClientsManagement";
import ConsultationsManager from "../components/practitioner/ConsultationsManager";
import ProductsManagement from "../components/practitioner/ProductsManagement";
import BookingCalendar from "../components/practitioner/BookingCalendar";
import MessagingCenter from "../components/practitioner/MessagingCenter";
import EventManagement from "../components/practitioner/EventManagement";
import AvailabilitySettings from "../components/practitioner/AvailabilitySettings";
import BlockedDatesManager from "../components/practitioner/BlockedDatesManager";
import ExceptionManager from "../components/practitioner/ExceptionManager";

export default function PractitionerDashboard() {
  const [user, setUser] = useState(null);
  const [practitionerProfile, setPractitionerProfile] = useState(null); // Renamed 'practitioner' to 'practitionerProfile'
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Replaced 'practitionerStatus' with 'isLoading'
  const [activeTab, setActiveTab] = useState("overview"); // Add this state

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);

    try {
      const currentUser = await User.me();
      setUser(currentUser);

      if (!currentUser) {
        setPractitionerProfile(null); // No user logged in, so no practitioner profile can be found
        setIsLoading(false);
        return;
      }

      // Unified identity: resolve the practitioner listing by user id (email fallback).
      const profile = await resolvePractitionerForUser(currentUser);

      if (profile) {
        setPractitionerProfile(profile);

        // Load practitioner-specific data
        try {
          const practitionerBookings = await Booking.filter({ practitioner_id: profile.id }, "-created_date");
          const practitionerEvents = await Event.filter({ practitioner_id: profile.id }, "-start_date");

          // Fetch ALL messages related to this practitioner's bookings (both sent and received)
          const bookingIds = practitionerBookings.map(b => b.id);
          let practitionerMessages = [];
          if (bookingIds.length > 0) {
              const allMessages = await Message.list('-created_date', 1000);
              practitionerMessages = allMessages.filter(m => {
                // Include message if:
                // 1. It's related to one of our bookings, OR
                // 2. We are the sender, OR
                // 3. We are the receiver
                return bookingIds.includes(m.booking_id) ||
                       m.sender_id === profile.id ||
                       m.receiver_id === profile.id;
              });
          }

          setBookings(practitionerBookings);
          setEvents(practitionerEvents);
          setMessages(practitionerMessages);
        } catch (error) {
          console.error("Failed to load practitioner data:", error);
          // Data loading failure shouldn't prevent showing the dashboard if profile is found
        }
      } else {
        setPractitionerProfile(null); // No practitioner profile found for the current user
      }

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setPractitionerProfile(null); // Treat general errors as no profile found or an issue
    } finally {
      setIsLoading(false); // Always set loading to false after attempt
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // 1. Central Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
      </div>
    );
  }

  // 2. Not Logged In
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center p-6 bg-muted">
        <UserIcon className="w-16 h-16 text-muted-foreground/40 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Please Log In</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          You need to be logged in to access your practitioner dashboard.
        </p>
        <Button onClick={() => User.login()} className="bg-primary hover:bg-primary/90">
          <LogIn className="w-4 h-4 mr-2" />
          Log In
        </Button>
      </div>
    );
  }

  // 3. No practitioner profile found
  if (!practitionerProfile) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              Practitioner Profile Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You need to complete your practitioner profile to access the dashboard.
            </p>
            <Button asChild>
              <Link to={createPageUrl("PractitionerApplication")}>
                Complete Profile Setup
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If a practitioner profile is found, display the dashboard
  const unreadMessages = messages.filter(m => !m.is_read).length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const upcomingEvents = events.filter(e => new Date(e.start_date) > new Date()).length;

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader icon={Storefront} kicker="Your practice" title="Practitioner Dashboard" subtitle="Manage your practice and connect with clients." className="-mx-4 -mt-4 mb-6 sm:-mx-6 sm:-mt-6" />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-10 gap-1 h-auto bg-muted p-1 rounded-xl">
            <TabsTrigger value="overview" className="flex flex-col sm:flex-row items-center gap-1 p-2 text-xs sm:text-sm">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex flex-col sm:flex-row items-center gap-1 p-2 text-xs sm:text-sm">
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex flex-col sm:flex-row items-center gap-1 p-2 text-xs sm:text-sm">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex flex-col sm:flex-row items-center gap-1 p-2 text-xs sm:text-sm">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex flex-col sm:flex-row items-center gap-1 p-2 text-xs sm:text-sm">
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex flex-col sm:flex-row items-center gap-1 p-2 text-xs sm:text-sm">
              <UsersIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Clients</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex flex-col sm:flex-row items-center gap-1 p-2 text-xs sm:text-sm">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="credentials" className="flex flex-col sm:flex-row items-center gap-1 p-2 text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Credentials</span>
            </TabsTrigger>
            <TabsTrigger value="shop" className="flex flex-col sm:flex-row items-center gap-1 p-2 text-xs sm:text-sm">
              <Storefront className="w-4 h-4" />
              <span className="hidden sm:inline">Shop</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex flex-col sm:flex-row items-center gap-1 p-2 text-xs sm:text-sm">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
              {unreadMessages > 0 && (
                <Badge className="bg-destructive text-white text-xs ml-1 px-1 py-0 min-w-[16px] h-4 rounded-full hidden sm:flex items-center justify-center">
                  {unreadMessages}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="py-6">
            {/* Quick Stats */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard icon={Calendar} label="Pending Bookings" value={pendingBookings} color="primary" onClick={() => setActiveTab("bookings")} sub={pendingBookings > 0 ? "Click to review →" : undefined} />
              <StatCard icon={MessageSquare} label="Unread Messages" value={unreadMessages} color="info" onClick={() => setActiveTab("messages")} sub={unreadMessages > 0 ? "Click to view →" : undefined} />
              <StatCard icon={CalendarDays} label="Upcoming Events" value={upcomingEvents} color="warning" onClick={() => setActiveTab("events")} sub={upcomingEvents > 0 ? "Click to manage →" : undefined} />
            </div>
          </TabsContent>

          <TabsContent value="profile" className="py-6">
            <ProfileManagement
              practitioner={practitionerProfile} // Pass renamed prop
              user={user}
              onUpdate={loadDashboardData} // Call loadDashboardData on update
            />
          </TabsContent>

          <TabsContent value="bookings" className="py-6">
            <ConsultationsManager practitioner={practitionerProfile} />
            <BookingCalendar
              bookings={bookings}
              practitioner={practitionerProfile} // Pass renamed prop
              onUpdate={loadDashboardData} // Call loadDashboardData on update
            />
          </TabsContent>

          <TabsContent value="messages" className="py-6">
            <MessagingCenter
              messages={messages}
              practitioner={practitionerProfile} // Pass renamed prop
              bookings={bookings}
              onUpdate={loadDashboardData} // Call loadDashboardData on update
            />
          </TabsContent>

          <TabsContent value="events" className="py-6">
            <EventManagement
              events={events}
              practitioner={practitionerProfile} // Pass renamed prop
              onUpdate={loadDashboardData} // Call loadDashboardData on update
            />
          </TabsContent>

          <TabsContent value="clients" className="py-6">
            <ClientsManagement practitioner={practitionerProfile} />
          </TabsContent>

          <TabsContent value="reviews" className="py-6">
            <ReviewsManagement practitioner={practitionerProfile} />
          </TabsContent>

          <TabsContent value="credentials" className="py-6">
            <CredentialManagement practitioner={practitionerProfile} />
          </TabsContent>

          <TabsContent value="shop" className="py-6">
            <ProductsManagement practitioner={practitionerProfile} />
          </TabsContent>

          <TabsContent value="availability" className="py-6">
            <div className="space-y-6">
              <AvailabilitySettings
                practitioner={practitionerProfile} // Pass renamed prop
                onUpdate={loadDashboardData} // Call loadDashboardData on update
              />
              <BlockedDatesManager
                practitioner={practitionerProfile} // Pass renamed prop
                onUpdate={loadDashboardData} // Call loadDashboardData on update
              />
              <ExceptionManager
                practitioner={practitionerProfile} // Pass renamed prop
                onUpdate={loadDashboardData} // Call loadDashboardData on update
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
