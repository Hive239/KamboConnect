import React, { useState, useEffect } from "react";
import { Event, EventRegistration, Practitioner, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import AddToCalendar from "@/components/AddToCalendar";
import { Calendar, List, ChevronLeft, ChevronRight, Loader2 } from "@/lib/icons";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns";

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
  const [hasFetchedEvents, setHasFetchedEvents] = useState(false);
  const [myRegistrations, setMyRegistrations] = useState([]);

  useEffect(() => {
    const loadEvents = async () => {
      if (hasFetchedEvents) return; // Prevent multiple fetches
      
      setIsLoading(true);
      setHasFetchedEvents(true);
      
      try {
        const fetchedEvents = await Event.list("-start_date");

        // Respect stored values; only fill missing coordinates for the map demo.
        const eventsWithDetails = fetchedEvents.map(e => ({
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
        console.log("User location for events:", location);
      } catch (error) {
        console.warn("Could not get user location for events:", error.message);
        setUserLocation(null);
      }
    };

    getUserLocation();
  }, [sortBy]);

  const handleRegistrationSubmit = async (registrationData) => {
    // In a real app, you'd probably want to show a success/error toast
    await EventRegistration.create(registrationData);
    setRegisteringEvent(null);
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
    let sorted = [...events];
    
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
  }, [events, sortBy, userLocation]);

  return (
    <div className="bg-muted min-h-screen">
      <div className="relative h-72 sm:h-80 bg-gradient-to-br from-primary/5 via-white to-clay/10 flex flex-col items-center justify-center text-center p-6">
         <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"></div>
         <div className="absolute inset-0 bg-cover bg-center opacity-5" style={{backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop')"}}></div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 z-10">Events & Circles</h1>
        <p className="text-lg text-muted-foreground z-10">Discover upcoming Kambo ceremonies and workshops</p>
      </div>

      <div className="p-6">
        {myRegistrations.length > 0 && (
          <div className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Your Registrations</h2>
            <div className="space-y-2">
              {myRegistrations.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/60 px-4 py-3">
                  <div>
                    <p className="font-medium text-foreground">{r.event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.event.start_date ? format(new Date(r.event.start_date), "EEE, MMM d, yyyy · h:mm a") : ""}
                      {r.event.is_online ? " · Online" : r.event.location ? ` · ${r.event.location}` : ""}
                    </p>
                  </div>
                  <AddToCalendar
                    event={{
                      title: r.event.title,
                      details: r.event.description,
                      location: r.event.is_online ? "Online" : r.event.location,
                      start: r.event.start_date,
                      end: r.event.end_date,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          {/* Sort Controls */}
          <div className="flex flex-wrap gap-3">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-card border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="date">Sort by Date</option>
              <option value="distance">Sort by Distance</option>
              <option value="price">Sort by Price</option>
            </select>
            
            {sortBy === "distance" && (
              <div className="text-sm text-muted-foreground flex items-center">
                {userLocation ? (
                  <span className="text-primary">✓ Location detected</span>
                ) : (
                  <span className="text-orange-600">⚠ Location needed</span>
                )}
              </div>
            )}
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center bg-card rounded-2xl p-1 shadow-sm border border-border">
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('list')}
              className="rounded-xl"
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
            <Button 
              variant={viewMode === 'calendar' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('calendar')}
              className="rounded-xl"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </Button>
          </div>
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
                            event.event_type === 'workshop' ? 'bg-blue-500 hover:bg-blue-600' : 
                            event.event_type === 'meetup' ? 'bg-yellow-500 hover:bg-yellow-600' :
                            'bg-purple-500 hover:bg-purple-600'
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
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-muted-foreground">Workshops</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-muted-foreground">Retreats</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
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