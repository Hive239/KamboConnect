import React, { useState, useEffect } from "react";
import { Event, EventRegistration } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Calendar, List, ChevronLeft, ChevronRight, Loader2 } from "@/lib/icons";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns";

import EventCard from "../components/events/EventCard";
import EventModal from "../components/events/EventModal";
import RegistrationModal from "../components/events/RegistrationModal";
import { getCurrentLocation, sortByDistance } from "../components/utils/locationUtils";

export default function Events() {
  const [viewMode, setViewMode] = useState("list");
  const [currentMonth, setCurrentMonth] = useState(new Date('2025-01-15'));
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registeringEvent, setRegisteringEvent] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [sortBy, setSortBy] = useState("date");
  const [hasFetchedEvents, setHasFetchedEvents] = useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      if (hasFetchedEvents) return; // Prevent multiple fetches
      
      setIsLoading(true);
      setHasFetchedEvents(true);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 250)); // Add delay to prevent rate limiting
        const fetchedEvents = await Event.list("-start_date");
        
        // Add mock participant counts and coordinates for demo
        const eventsWithDetails = fetchedEvents.map(e => ({
          ...e,
          current_participants: Math.floor(Math.random() * e.max_participants),
          // Add mock coordinates based on location if not present
          latitude: e.latitude || (40.7128 + (Math.random() - 0.5) * 2), // NYC area
          longitude: e.longitude || (-74.0060 + (Math.random() - 0.5) * 2)
        }));
        
        setEvents(eventsWithDetails);
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