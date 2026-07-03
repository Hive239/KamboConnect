
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Booking } from "@/entities/Booking";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, CalendarCheck, User as UserIcon, LogIn } from "@/lib/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import ClientBookingsView from "../components/bookings/ClientBookingsView";
import PractitionerBookingsView from "../components/bookings/PractitionerBookingsView";

export default function BookingsPage() {
  const [user, setUser] = useState(null);
  const [clientBookings, setClientBookings] = useState([]);
  const [practitionerBookings, setPractitionerBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Fetch real data linked to the current user
          const [realClientData, realPractitionerData] = await Promise.all([
            Booking.filter({ client_id: currentUser.id }, "-created_date"),
            Booking.filter({ practitioner_id: currentUser.id }, "-created_date")
          ]);

          // Real bookings for this user only — honest empty state when there are none.
          setClientBookings(realClientData);
          setPractitionerBookings(realPractitionerData);
        } catch (bookingError) {
          // If booking fetch fails, just set empty arrays
          console.log("No booking data found for user or failed to fetch, using empty state:", bookingError);
          setClientBookings([]);
          setPractitionerBookings([]);
        }
      } else {
        // If currentUser is null after User.me() (e.g., not logged in), clear bookings
        setClientBookings([]);
        setPractitionerBookings([]);
      }
    } catch (authError) {
      // User is not logged in or User.me() failed - this is expected if unauthenticated
      console.log("User not authenticated or failed to fetch user, showing login prompt:", authError);
      setUser(null);
      setClientBookings([]);
      setPractitionerBookings([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
  }, []);
  
  const handleBookingUpdate = () => {
    // Reload all data after any booking status change, but debounce it
    setTimeout(() => {
      loadData();
    }, 500); // Add small delay to prevent rapid successive calls
  };

  if (isLoading) {
    return (
        <div className="p-6">
            <div className="h-8 w-1/3 shimmer rounded mb-2"></div>
            <div className="h-6 w-1/2 shimmer rounded mb-6"></div>
            <div className="w-full h-96 shimmer rounded-lg"></div>
        </div>
    );
  }
  
  if (!user) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center p-6 bg-muted">
          <UserIcon className="w-16 h-16 text-muted-foreground/40 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Please Log In</h1>
          <p className="text-muted-foreground max-w-md mb-6">
            You need to be logged in to view your bookings or manage your practice.
          </p>
          <Button onClick={() => User.login()} className="bg-primary hover:bg-primary/90">
            <LogIn className="w-4 h-4 mr-2" />
            Log In
          </Button>
        </div>
      );
  }

  // Determine if the user has practitioner bookings to enable the "My Practice" tab
  // The original code used `practitionerBookings.length > 0`. 
  // It's more accurate to check if the user is *intended* to be a practitioner
  // or if practitioner bookings were successfully loaded.
  // For simplicity, sticking to the existing check, but noting this could be improved if `User` entity had a `is_practitioner` flag.
  const isPractitioner = practitionerBookings.length > 0; 

  return (
    <div className="p-4 sm:p-6">
      <PageHeader icon={Briefcase} kicker="Sessions" title="My Bookings" subtitle="Track your sessions and manage booking requests." className="-mx-4 -mt-4 mb-6 sm:-mx-6 sm:-mt-6" />
      
      <Tabs defaultValue="my-sessions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="my-sessions">
            <CalendarCheck className="w-4 h-4 mr-2" />
            My Sessions
          </TabsTrigger>
          <TabsTrigger value="my-practice" disabled={!isPractitioner}>
            <Briefcase className="w-4 h-4 mr-2" />
            My Practice
          </TabsTrigger>
        </TabsList>
        <TabsContent value="my-sessions" className="py-6">
            <ClientBookingsView bookings={clientBookings} onUpdate={handleBookingUpdate} />
        </TabsContent>
        <TabsContent value="my-practice" className="py-6">
            <PractitionerBookingsView bookings={practitionerBookings} onUpdate={handleBookingUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
