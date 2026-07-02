
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Booking, Review, Practitioner, EventRegistration, Event, Follow } from "@/entities/all";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User as UserIcon, Settings, Briefcase, Star, CalendarCheck, Edit, Loader2, LogIn, Calendar, Heart
} from "@/lib/icons";
import { GradientMesh } from "@/components/ui/GradientMesh";

import AccountSettings from "../components/profile/AccountSettings";
import BookingHistory from "../components/profile/BookingHistory";
import ReviewHistory from "../components/profile/ReviewHistory";
import ProfilePictureUpload from "../components/profile/ProfilePictureUpload"; // New import

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [practitionerInfo, setPractitionerInfo] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "bookings";

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const [userBookings, userReviews, practitionerRecords, allPractitioners, regs, follows] = await Promise.all([
        Booking.filter({ client_id: currentUser.id }),
        // Filter by stable id, not the display name — a rename previously made the
        // user's own review history vanish (denormalized reviewer_name drift).
        Review.filter({ reviewer_id: currentUser.id }),
        Practitioner.filter({ email: currentUser.email }),
        Practitioner.list(),
        currentUser.email ? EventRegistration.filter({ participant_email: currentUser.email }) : Promise.resolve([]),
        Follow.filter({ follower_id: currentUser.id }),
      ]);

      // Resolve each review's practitioner name from its practitioner_id.
      const nameById = new Map(allPractitioners.map(p => [p.id, p.full_name]));
      const enrichedReviews = userReviews.map(r => ({
        ...r,
        practitioner_name: r.practitioner_name || nameById.get(r.practitioner_id) || 'Practitioner',
      }));

      // Join registrations to their events.
      try {
        const allEvents = await Event.list();
        const eventById = Object.fromEntries(allEvents.map((e) => [e.id, e]));
        setMyEvents((regs || []).map((r) => ({ ...r, event: eventById[r.event_id] })).filter((r) => r.event));
      } catch { setMyEvents([]); }
      setFollowing(follows || []);

      setBookings(userBookings);
      setReviews(enrichedReviews);
      if (practitionerRecords.length > 0) {
        setPractitionerInfo(practitionerRecords[0]);
      }

    } catch (error) {
      console.error("User not logged in or data fetch failed:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUserUpdate = () => {
    // Reload user data after profile picture update
    loadData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center p-6 bg-muted">
        <UserIcon className="w-16 h-16 text-muted-foreground/40 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Access Your Profile</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          Please log in to manage your account, view your bookings, and more.
        </p>
        <Button onClick={() => User.login()} className="bg-primary hover:bg-primary/90">
          <LogIn className="w-4 h-4 mr-2" />
          Log In / Sign Up
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-muted min-h-screen p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Profile Header */}
        <Card className="mb-6 overflow-hidden">
          <div className="relative h-24 bg-background grain"><GradientMesh intensity="vivid" /></div>
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
            <ProfilePictureUpload user={user} onUpdate={handleUserUpdate} />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-foreground">{user.full_name}</h1>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Member since {format(new Date(user.created_date), "MMMM yyyy")}
              </p>
            </div>
            <div className="flex flex-col sm:items-end gap-2">
               <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl('MyAccount'))}>
                  <Edit className="w-3 h-3 mr-2" />
                  Edit Profile
                </Button>
              {practitionerInfo && (
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                  <Link to={createPageUrl("PractitionerDashboard")}>
                    <Briefcase className="w-3 h-3 mr-2" />
                    Practitioner Dashboard
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Content — tab is deep-linkable via ?tab= */}
        <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 bg-muted p-1 rounded-xl h-auto">
            <TabsTrigger value="bookings"><CalendarCheck className="w-4 h-4 mr-1.5" /> Bookings</TabsTrigger>
            <TabsTrigger value="events"><Calendar className="w-4 h-4 mr-1.5" /> Events</TabsTrigger>
            <TabsTrigger value="following"><Heart className="w-4 h-4 mr-1.5" /> Following</TabsTrigger>
            <TabsTrigger value="reviews"><Star className="w-4 h-4 mr-1.5" /> Reviews</TabsTrigger>
            <TabsTrigger value="account"><Settings className="w-4 h-4 mr-1.5" /> Account</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="py-6">
            <BookingHistory bookings={bookings} />
          </TabsContent>
          <TabsContent value="events" className="py-6">
            {myEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
                You haven't registered for any events. <Link to={createPageUrl("Events")} className="text-primary hover:underline">Browse events</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myEvents.map((r) => (
                  <Card key={r.id}><CardContent className="flex items-center justify-between gap-3 p-4">
                    <Link to={`${createPageUrl("EventDetail")}?id=${r.event.id}`} className="min-w-0">
                      <p className="font-medium text-foreground hover:underline">{r.event.title}</p>
                      <p className="text-sm text-muted-foreground">{r.event.start_date ? format(new Date(r.event.start_date), "EEE, MMM d, yyyy") : ""}</p>
                    </Link>
                    <Badge variant={r.registration_status === "waitlist" ? "secondary" : "verified"}>{r.registration_status || "confirmed"}</Badge>
                  </CardContent></Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="following" className="py-6">
            {following.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
                You're not following anyone yet. <Link to={createPageUrl("Directory")} className="text-primary hover:underline">Find practitioners</Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {following.map((f) => (
                  <Link key={f.id} to={f.followee_type === "practitioner" ? `${createPageUrl("PractitionerProfile")}?id=${f.followee_id}` : f.followee_type === "group" ? `${createPageUrl("GroupDetail")}?id=${f.followee_id}` : `${createPageUrl("UserProfile")}?id=${f.followee_id}`}>
                    <Card className="transition-shadow hover:shadow-md"><CardContent className="flex items-center gap-3 p-3">
                      <Avatar className="h-10 w-10"><AvatarImage src={f.followee_image_url} /><AvatarFallback>{(f.followee_name || "?")[0]}</AvatarFallback></Avatar>
                      <div><p className="font-medium">{f.followee_name || "Unknown"}</p><p className="text-xs capitalize text-muted-foreground">{f.followee_type}</p></div>
                    </CardContent></Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="reviews" className="py-6">
            <ReviewHistory reviews={reviews} />
          </TabsContent>
          <TabsContent value="account" className="py-6">
            <AccountSettings user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
