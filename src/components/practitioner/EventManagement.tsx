
import React, { useState } from 'react';
import { Event, Favorite, Notification } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Calendar, MapPin, Users, DollarSign, Edit, Trash2, 
  Clock, Globe, Video 
} from "@/lib/icons";
import { format } from "date-fns";
import { createPageUrl } from '@/utils';

export default function EventManagement({ events, practitioner, onUpdate }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    event_type: "circle",
    start_date: "",
    end_date: "",
    location: "",
    price: 100,
    max_participants: 8,
    is_online: false,
    requirements: [],
    what_to_bring: []
  });

  const resetForm = () => {
    setEventData({
      title: "",
      description: "",
      event_type: "circle",
      start_date: "",
      end_date: "",
      location: "",
      price: 100,
      max_participants: 8,
      is_online: false,
      requirements: [],
      what_to_bring: []
    });
    setEditingEvent(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const eventPayload = {
        ...eventData,
        practitioner_id: practitioner.id,
        start_date: new Date(eventData.start_date).toISOString(),
        end_date: new Date(eventData.end_date).toISOString()
      };

      if (editingEvent) {
        await Event.update(editingEvent.id, eventPayload);
      } else {
        const newEvent = await Event.create(eventPayload);
        
        // Notify users who have favorited this practitioner
        const favorites = await Favorite.filter({ 
            item_id: practitioner.id, 
            item_type: 'practitioner' 
        });

        for (const fav of favorites) {
            await Notification.create({
                user_id: fav.user_id,
                title: `New Event from ${practitioner.full_name}`,
                message: `Check out the new event: "${newEvent.title}"`,
                type: 'event',
                related_id: newEvent.id,
                action_url: createPageUrl(`Events`),
                sender_image_url: practitioner.profile_image_url || null
            });
        }
      }
      
      resetForm();
      onUpdate();
    } catch (error) {
      console.error("Failed to save event:", error);
    }
  };

  const handleEdit = (event) => {
    setEventData({
      title: event.title,
      description: event.description || "",
      event_type: event.event_type,
      start_date: new Date(event.start_date).toISOString().slice(0, 16),
      end_date: new Date(event.end_date).toISOString().slice(0, 16),
      location: event.location,
      price: event.price,
      max_participants: event.max_participants,
      is_online: event.is_online || false,
      requirements: event.requirements || [],
      what_to_bring: event.what_to_bring || []
    });
    setEditingEvent(event);
    setShowCreateForm(true);
  };

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await Event.delete(eventId);
        onUpdate();
      } catch (error) {
        console.error("Failed to delete event:", error);
      }
    }
  };

  const getEventTypeBadge = (type) => {
    const badges = {
      circle: { color: "bg-primary/10 text-primary", text: "Kambo Circle" },
      workshop: { color: "bg-blue-100 text-blue-800", text: "Workshop" },
      retreat: { color: "bg-purple-100 text-purple-800", text: "Retreat" },
      meetup: { color: "bg-orange-100 text-orange-800", text: "Meetup" },
      training: { color: "bg-red-100 text-red-800", text: "Training" }
    };
    return badges[type] || badges.circle;
  };

  const addListItem = (field, value) => {
    if (value.trim()) {
      setEventData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const removeListItem = (field, index) => {
    setEventData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // Mock payment integration - in real app, integrate with Stripe
  const handlePaymentSetup = async (eventId) => {
    // This would integrate with a real payment processor
    console.log("Setting up payment for event:", eventId);
    // For now, just show a success message
    alert("Payment integration would be set up here (Stripe, etc.)");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">My Events ({events.length})</h2>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={eventData.title}
                    onChange={(e) => setEventData(prev => ({...prev, title: e.target.value}))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Event Type</Label>
                  <Select 
                    value={eventData.event_type} 
                    onValueChange={(value) => setEventData(prev => ({...prev, event_type: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circle">Kambo Circle</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="retreat">Retreat</SelectItem>
                      <SelectItem value="meetup">Meetup</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={eventData.description}
                  onChange={(e) => setEventData(prev => ({...prev, description: e.target.value}))}
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date & Time</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={eventData.start_date}
                    onChange={(e) => setEventData(prev => ({...prev, start_date: e.target.value}))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date & Time</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={eventData.end_date}
                    onChange={(e) => setEventData(prev => ({...prev, end_date: e.target.value}))}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={eventData.location}
                    onChange={(e) => setEventData(prev => ({...prev, location: e.target.value}))}
                    placeholder={eventData.is_online ? "Online" : "City, State"}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={eventData.price}
                    onChange={(e) => setEventData(prev => ({...prev, price: parseFloat(e.target.value) || 0}))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="max_participants">Max Participants</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={eventData.max_participants}
                    onChange={(e) => setEventData(prev => ({...prev, max_participants: parseInt(e.target.value) || 8}))}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_online"
                  checked={eventData.is_online}
                  onChange={(e) => setEventData(prev => ({...prev, is_online: e.target.checked}))}
                />
                <Label htmlFor="is_online">This is an online event</Label>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      <div className="grid lg:grid-cols-2 gap-6">
        {events.map(event => {
          const badge = getEventTypeBadge(event.event_type);
          const isUpcoming = new Date(event.start_date) > new Date();
          const spotsLeft = event.max_participants - (event.current_participants || 0);
          
          return (
            <Card key={event.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${badge.color} border`}>
                        {badge.text}
                      </Badge>
                      {event.is_online && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          Online
                        </Badge>
                      )}
                      {!isUpcoming && (
                        <Badge className="bg-muted text-foreground">Past Event</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(event)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(event.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{format(new Date(event.start_date), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{format(new Date(event.start_date), "h:mm a")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.is_online ? (
                      <Globe className="w-4 h-4 text-primary" />
                    ) : (
                      <MapPin className="w-4 h-4 text-primary" />
                    )}
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span>${event.price}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{event.current_participants || 0}/{event.max_participants} spots</span>
                    {spotsLeft <= 2 && spotsLeft > 0 && (
                      <Badge className="bg-orange-100 text-orange-800">
                        {spotsLeft} left!
                      </Badge>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePaymentSetup(event.id)}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Payment Setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {events.length === 0 && !showCreateForm && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Events Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first event to start building your community</p>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Event
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
