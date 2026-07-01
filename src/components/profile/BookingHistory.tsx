
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Calendar, Briefcase } from "@/lib/icons";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-primary/10 text-primary",
  declined: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};

export default function BookingHistory({ bookings }) {
  if (!bookings || bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-xl font-semibold text-foreground">No Bookings Yet</h3>
          <p className="text-muted-foreground mt-2 mb-4">You haven't made any bookings. When you do, they'll appear here.</p>
          <Button asChild>
            <Link to={createPageUrl("Directory")}>Browse Practitioners</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const upcomingBookings = bookings.filter(b => new Date(b.requested_date) >= new Date() && b.status !== 'completed' && b.status !== 'declined');
  const pastBookings = bookings.filter(b => new Date(b.requested_date) < new Date() || b.status === 'completed' || b.status === 'declined');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Upcoming Sessions</h2>
        {upcomingBookings.length > 0 ? (
          <div className="grid gap-4">
            {upcomingBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)}
          </div>
        ) : (
          <p className="text-muted-foreground">No upcoming sessions scheduled.</p>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Past Sessions</h2>
        {pastBookings.length > 0 ? (
          <div className="grid gap-4">
            {pastBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)}
          </div>
        ) : (
          <p className="text-muted-foreground">No past sessions found.</p>
        )}
      </div>
    </div>
  );
}

const BookingCard = ({ booking }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
           <Link to={createPageUrl(`PractitionerProfile?id=${booking.practitioner_id}`)} className="font-semibold text-lg hover:underline">{booking.practitioner_name}</Link>
           <Badge className={statusColors[booking.status]}>{booking.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {format(new Date(booking.requested_date), "EEEE, MMMM d, yyyy")}
        </p>
        <p className="text-sm text-muted-foreground">{booking.service_type}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <Button variant="outline" size="sm" asChild>
            <Link to={createPageUrl(`PractitionerProfile?id=${booking.practitioner_id}`)}>View Practitioner</Link>
        </Button>
        {['pending', 'confirmed'].includes(booking.status) && (
            <Button size="sm" asChild>
                <Link to={createPageUrl('Bookings')}>
                  <Briefcase className="w-4 h-4 mr-2" />
                  Manage Booking
                </Link>
            </Button>
        )}
        {booking.status === 'completed' && (
            <Button size="sm">Leave a Review</Button>
        )}
      </div>
    </CardContent>
  </Card>
);
