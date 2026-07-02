import React, { useState, useEffect } from "react";
import { Event, EventRegistration, Practitioner, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddToCalendar from "@/components/AddToCalendar";
import { toast } from "sonner";
import { submitRegistration, cancelAndPromote } from "@/lib/eventRegistration";
import { Calendar, List, ChevronLeft, ChevronRight, Loader2, Search, Crosshair } from "@/lib/icons";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Input } from "@/components/ui/input";

import EventCard from "../components/events/EventCard";
import EventModal from "../components/events/EventModal";
import RegistrationModal from "../components/events/RegistrationModal";
import { getCurrentLocation, sortByDistance } from "../components/utils/locationUtils";

export default function Events() {
  const [viewMode, setViewMode] = useState("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [practitionerMap, setPractitionerMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registeringEvent, setRegisteringEvent] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [sortBy, setSortBy] = useState("date");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all"); // all | online | inperson
  const [priceFilter, setPriceFilter] = useState("all"); // all | free | paid
  const [hasFetchedEvents, setHasFetchedEvents] = useState(false);
  const [myRegistrations, setMyRegistrations] = useState([]);

  useEffect(() => {
    const loadEvents = async () => {
      if (hasFetchedEvents) return; // Prevent multiple fetches
      
      setIsLoading(true);
      setHasFetchedEvents(true);
      
      try {
        const fetchedEvents = await Event.list("-start_date");

        // Public listing excludes host drafts and cancelled events.
        const publicEvents = fetchedEvents.filter((e) => e.status !== "draft" && e.status !== "cancelled");

        // Respect stored values; only fill missing coordinates for the map demo.
        const eventsWithDetails = publicEvents.map(e => ({
          ...e,
          current_participants: e.current_participants ?? 0,
          latitude: e.latitude ?? (40.7128 + (Math.random() - 0.5) * 2),
          longitude: e.longitude ?? (-74.0060 + (Math.random() - 0.5) * 2),
        }));

        setEvents(eventsWithDetails);

        // Resolve hosts so events show "hosted by <practitioner>".
        try {
          const pracs = await Practitioner.list();
          setPractitionerMap(Object.fromEntries(pracs.map((p) => [p.id, p])));
        } catch { /* non-fatal */ }

        // Load the current user's own registrations (for "Your Registrations").
        try {
          const me = await User.me().catch(() => null);
          if (me) {
            const regs = await EventRegistration.filter({ participant_email: me.email });
            const eventById = Object.fromEntries(eventsWithDetails.map((e) => [e.id, e]));
            setMyRegistrations(
              regs.map((r) => ({ ...r, event: eventById[r.event_id] })).filter((r) => r.event)
            );
          }
        } catch { /* non-fatal */ }

        // If the current month has no events, jump to the next upcoming event's month.
        const now = new Date();
        const upcoming = eventsWithDetails
          .filter(e => e.start_date && new Date(e.start_date) >= now)
          .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        const inThisMonth = eventsWithDetails.some(e => e.start_date && isSameMonth(new Date(e.start_date), now));
        if (!inThisMonth && upcoming[0]) setCurrentMonth(new Date(upcoming[0].start_date));
      } catch (error) {
        console.error("Failed to load events:", error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadEvents();
  }, []); // Empty dependency array to run only once

  // Get user location when sorting by distance
  useEffect(() => {
    const getUserLocation = async () => {
      if (sortBy !== "distance") return;
      
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
      } catch (error) {
        console.warn("Could not get user location for events:", error.message);
        setUserLocation(null);
      }
    };

    getUserLocation();
  }, [sortBy]);

  const cancelRegistration = async (reg) => {
    if (!window.confirm(`Cancel your registration for "${reg.event.title}"?`)) return;
    try {
      const { current_participants } = await cancelAndPromote(reg, reg.event);
      if (reg.event) setEvents((prev) => prev.map((e) => (e.id === reg.event.id ? { ...e, current_participants } : e)));
      setMyRegistrations((prev) => prev.filter((r) => r.id !== reg.id));
      toast.success("Registration cancelled");
    } catch (e) {
      console.error("Failed to cancel registration:", e);
      toast.error("Couldn't cancel. Please try again.");
    }
  };

  const handleRegistrationSubmit = async (registrationData) => {
    const ev = events.find((e) => e.id === registrationData.event_id);
    // dedup + capacity → confirmed or waitlist (throws "already registered").
    const { status, current_participants } = await submitRegistration(ev || { id: registrationData.event_id }, registrationData);
    if (ev) setEvents((prev) => prev.map((e) => (e.id === ev.id ? { ...e, current_participants } : e)));
    if (status === "waitlist") toast.info("This event is full — you've been added to the waitlist.");
    // Do NOT close here — RegistrationModal shows its own success + Add-to-Calendar
    // screen and closes via its Done button / onClose.
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      try {
        return isSameDay(new Date(event.start_date), date);
      } catch (error) {
        console.error("Date parsing error:", error, event.start_date);
        return false;
      }
    });
  };

  // Sort events based on selected criteria
  const sortedEvents = React.useMemo(() => {
    const filtered = events.filter((e) => {
      if (query && !`${e.title} ${e.description || ""} ${e.location || ""}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (typeFilter !== "all" && e.event_type !== typeFilter) return false;
      if (modeFilter === "online" && !e.is_online) return false;
      if (modeFilter === "inperson" && e.is_online) return false;
      if (priceFilter === "free" && (e.price || 0) > 0) return false;
      if (priceFilter === "paid" && !(e.price > 0)) return false;
      return true;
    });
    let sorted = [...filtered];

    switch (sortBy) {
      case "date":
        sorted.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        break;
      case "distance":
        if (userLocation) {
          sorted = sortByDistance(
            sorted,
            userLocation,
            (event) => event.latitude && event.longitude ? {
              latitude: event.latitude,
              longitude: event.longitude
            } : null
          );
        } else {
          // If no user location, distance sort might fall back to date or no sort
          // For now, keep as is, potentially add a message to user
        }
        break;
      case "price":
        sorted.sort((a, b) => (a.price || Infinity) - (b.price || Infinity)); // Handle events without price by pushing them to the end
        break;
      default:
        // Default to date if sortBy is unrecognized
        sorted.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        break;
    }
    
    return sorted;
  }, [events, sortBy, userLocation, query, typeFilter, modeFilter, priceFilter]);

  return (
    <div className="bg-muted min-h-screen">
      <div className="grain relative flex h-64 flex-col items-center justify-center overflow-hidden bg-background p-6 text-center sm:h-72">
        <GradientMesh intensity="vivid" />
        <h1 className="relative z-10 font-display text-display font-semibold tracking-tight">Events &amp; Circles</h1>
        <p className="relative z-10 mt-1 text-lg text-muted-foreground">Discover upcoming Kambo ceremonies and workshops</p>
      </div>

      <div className="p-6">
        {myRegistrations.length > 0 && (
          <div className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Your Registrations</h2>
            <div className="space-y-2">
              {myRegistrations.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/60 px-4 py-3">
                  <div>
                    <p className="flex items-center gap-2 font-medium text-foreground">
                      {r.event.title}
                      {r.registration_status === "waitlist"
                        ? <Badge variant="secondary" className="text-[10px]">Waitlist</Badge>
                        : <Badge variant="verified" className="text-[10px]">Confirmed</Badge>}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {r.event.start_date ? format(new Date(r.event.start_date), "EEE, MMM d, yyyy · h:mm a") : ""}
                      {r.event.is_online ? " · Online" : r.event.location ? ` · ${r.event.location}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AddToCalendar
                      event={{
                        title: r.event.title,
                        details: r.event.description,
                        location: r.event.is_online ? "Online" : r.event.location,
                        start: r.event.start_date,
                        end: r.event.end_date,
                      }}
                    />
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => cancelRegistration(r)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Search + filters */}
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events…" className="h-10 rounded-full pl-9" />
          </div>
          <div className="grid gap-2 lg:grid-cols-3">
            <SegmentedControl value={typeFilter} onChange={setTypeFilter} scroll options={[
              { value: "all", label: "All" }, { value: "circle", label: "Circle" }, { value: "workshop", label: "Workshop" },
              { value: "retreat", label: "Retreat" }, { value: "meetup", label: "Meetup" }, { value: "training", label: "Training" }]} />
            <SegmentedControl value={modeFilter} onChange={setModeFilter} options={[{ value: "all", label: "Anywhere" }, { value: "online", label: "Online" }, { value: "inperson", label: "In person" }]} />
            <SegmentedControl value={priceFilter} onChange={setPriceFilter} options={[{ value: "all", label: "Any price" }, { value: "free", label: "Free" }, { value: "paid", label: "Paid" }]} />
          </div>
        </div>

        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="w-60"><SegmentedControl value={sortBy} onChange={setSortBy} options={[{ value: "date", label: "Date" }, { value: "distance", label: "Distance" }, { value: "price", label: "Price" }]} /></div>
            {sortBy === "distance" && (
              <span className={`inline-flex items-center gap-1 text-sm ${userLocation ? "text-success" : "text-warning"}`}>
                <Crosshair className="h-4 w-4" /> {userLocation ? "Location on" : "Location needed"}
              </span>
            )}
          </div>
          <div className="w-52 shrink-0"><SegmentedControl value={viewMode} onChange={setViewMode} options={[{ value: "list", label: "List", icon: List }, { value: "calendar", label: "Calendar", icon: Calendar }]} /></div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          </div>
        ) : viewMode === 'list' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                practitioner={practitionerMap[event.practitioner_id]}
                onViewDetails={() => setSelectedEvent(event)}
                onRegister={() => setRegisteringEvent(event)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))} className="rounded-xl">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} className="rounded-xl">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-3 text-center font-medium text-muted-foreground text-sm">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {eachDayOfInterval({ 
                start: (() => {
                  const monthStart = startOfMonth(currentMonth);
                  const startDate = new Date(monthStart);
                  startDate.setDate(startDate.getDate() - monthStart.getDay());
                  return startDate;
                })(),
                end: (() => {
                  const monthEnd = endOfMonth(currentMonth);
                  const endDate = new Date(monthEnd);
                  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
                  return endDate;
                })()
              }).map(day => {
                const dayEvents = getEventsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[100px] p-2 border border-border rounded-lg ${
                      isCurrentMonth ? 'bg-card' : 'bg-muted'
                    } ${isToday ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                    } ${isToday ? 'text-primary font-bold' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded text-white text-center cursor-pointer truncate ${
                            event.event_type === 'circle' ? 'bg-primary hover:bg-primary/90' :
                            event.event_type === 'workshop' ? 'bg-info hover:bg-info/90' : 
                            event.event_type === 'meetup' ? 'bg-warning hover:bg-warning/90' :
                            'bg-clay hover:bg-clay/90'
                          }`}
                          title={`${event.title} - ${format(new Date(event.start_date), 'p')} in ${event.location}`}
                          onClick={() => setSelectedEvent(event)}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center flex-wrap gap-6 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded"></div>
                <span className="text-muted-foreground">Circles</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-info rounded"></div>
                <span className="text-muted-foreground">Workshops</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-clay rounded"></div>
                <span className="text-muted-foreground">Retreats</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-warning rounded"></div>
                <span className="text-muted-foreground">Meetups</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          practitioner={practitionerMap[selectedEvent.practitioner_id]}
          onClose={() => setSelectedEvent(null)}
          onRegister={() => {
            setRegisteringEvent(selectedEvent);
            setSelectedEvent(null);
          }}
        />
      )}
      
      {registeringEvent && (
        <RegistrationModal 
          event={registeringEvent}
          onClose={() => setRegisteringEvent(null)}
          onSubmitRegistration={handleRegistrationSubmit}
        />
      )}
    </div>
  );
}