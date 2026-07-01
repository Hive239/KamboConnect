
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { Check, X, Mail, Phone, MoreHorizontal, Briefcase } from "@/lib/icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Booking } from '@/entities/Booking';

const StatusBadge = ({ status }) => {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-primary/10 text-primary border-primary/20",
      declined: "bg-red-100 text-red-800 border-red-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
      cancelled: "bg-muted text-foreground border-border",
    };
    return <Badge className={statusStyles[status] || statusStyles.pending}>{status}</Badge>;
};

const PractitionerBookingsView = ({ bookings, onUpdate }) => {

  const updateBookingStatus = async (bookingId, status) => {
    await Booking.update(bookingId, { status });
    onUpdate();
  };

  const BookingRow = ({ booking }) => (
    <TableRow>
      <TableCell>
        <div className="font-medium">{booking.client_name}</div>
        <div className="text-sm text-muted-foreground">{booking.client_email}</div>
      </TableCell>
      <TableCell>{format(new Date(booking.requested_date), "PP")}</TableCell>
      <TableCell>{booking.service_type}</TableCell>
      <TableCell><StatusBadge status={booking.status} /></TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4"/></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
             <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'confirmed')}>
                <Check className="w-4 h-4 mr-2"/>Confirm
             </DropdownMenuItem>
             <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'declined')}>
                <X className="w-4 h-4 mr-2"/>Decline
             </DropdownMenuItem>
             <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'completed')}>
                <Check className="w-4 h-4 mr-2"/>Mark as Completed
             </DropdownMenuItem>
             <DropdownMenuItem asChild>
                <a href={`mailto:${booking.client_email}`} className="w-full">
                    <Mail className="w-4 h-4 mr-2"/>Email Client
                </a>
             </DropdownMenuItem>
             {booking.client_phone && (
                <DropdownMenuItem asChild>
                    <a href={`tel:${booking.client_phone}`} className="w-full">
                       <Phone className="w-4 h-4 mr-2"/>Call Client
                    </a>
                </DropdownMenuItem>
             )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  if (!bookings || bookings.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardHeader>
          <Briefcase className="w-12 h-12 mx-auto text-muted-foreground/40" />
          <CardTitle className="mt-4">You have no client bookings</CardTitle>
          <CardDescription>
            When clients request to book with you, their requests will appear here.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const filteredBookings = (status) => {
    if (status === 'archived') {
      return bookings.filter(b => b.status === 'declined' || b.status === 'cancelled' || b.status === 'completed');
    }
    return bookings.filter(b => b.status === status);
  };

  return (
    <Tabs defaultValue="pending">
      <TabsList>
        <TabsTrigger value="pending">Pending ({filteredBookings('pending').length})</TabsTrigger>
        <TabsTrigger value="confirmed">Confirmed ({filteredBookings('confirmed').length})</TabsTrigger>
        <TabsTrigger value="archived">Archived ({filteredBookings('archived').length})</TabsTrigger>
      </TabsList>
      
      {['pending', 'confirmed', 'archived'].map(status => (
        <TabsContent key={status} value={status} className="mt-4">
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Requested Date</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBookings(status).map(b => <BookingRow key={b.id} booking={b}/>)}
                    </TableBody>
                </Table>
                {filteredBookings(status).length === 0 && <p className="p-6 text-center text-muted-foreground">No {status} bookings.</p>}
            </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default PractitionerBookingsView;
