import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AddToCalendar from "@/components/AddToCalendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, MapPin, Users, DollarSign, Clock, 
  Globe, Video, CheckCircle, AlertTriangle, User
} from "@/lib/icons";
import { format } from "date-fns";

export default function EventModal({ event, practitioner, onClose, onRegister }) {
  if (!event) return null;

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

  const cap = Number(event.max_participants) || 0;
  const taken = Number(event.current_participants) || 0;
  const isFull = cap > 0 && taken >= cap;
  const spotsLeft = cap > 0 ? cap - taken : null;
  const badge = getEventTypeBadge(event.event_type);

  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const isMultiDay = format(startDate, 'yyyy-MM-dd') !== format(endDate, 'yyyy-MM-dd');

  return (
    <Dialog open={!!event} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-4">
            {/* Event Image */}
            {event.image_url && (
              <div className="w-full h-48 rounded-lg overflow-hidden">
                <img loading="lazy" 
                  src={event.image_url} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Header Info */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <DialogTitle className="text-2xl font-bold text-foreground pr-4">
                  {event.title}
                </DialogTitle>
                <div className="flex gap-2 flex-shrink-0">
                  <Badge className={`${badge.color} border`}>
                    {badge.text}
                  </Badge>
                  {event.is_online && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      Online
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span>
                  Hosted by{" "}
                  {practitioner?.id ? (
                    <Link
                      to={`${createPageUrl("PractitionerProfile")}?id=${practitioner.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {practitioner.full_name}
                    </Link>
                  ) : (
                    practitioner?.full_name || "Practitioner"
                  )}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">
                    {format(startDate, "EEEE, MMMM d, yyyy")}
                  </p>
                  {isMultiDay && (
                    <p className="text-sm text-muted-foreground">
                      to {format(endDate, "EEEE, MMMM d, yyyy")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">
                    {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {event.is_online ? (
                  <>
                    <Globe className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Online Event</p>
                      <p className="text-sm text-muted-foreground">Link provided after registration</p>
                    </div>
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{event.location}</p>
                      {event.address && (
                        <p className="text-sm text-muted-foreground">{event.address}</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">
                    {cap > 0 ? `${taken} / ${cap} participants` : `${taken} registered`}
                  </p>
                  {spotsLeft !== null && spotsLeft > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {spotsLeft} spots remaining
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-primary">
                ${event.price}
              </span>
              <span className="text-muted-foreground">{event.currency}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <AddToCalendar
                event={{
                  title: event.title,
                  details: event.description,
                  location: event.is_online ? "Online" : event.location,
                  start: event.start_date,
                  end: event.end_date,
                }}
              />
              <Button
                onClick={() => onRegister(event)}
                disabled={isFull}
                className={`px-8 ${
                  isFull
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90"
                }`}
              >
                {isFull ? "Event Full" : "Register Now"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="font-semibold text-lg mb-3">About This Event</h3>
              <p className="text-foreground leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}

          {/* Requirements */}
          {event.requirements && event.requirements.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Requirements
              </h3>
              <ul className="space-y-2">
                {event.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What to Bring */}
          {event.what_to_bring && event.what_to_bring.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">What to Bring</h3>
              <ul className="space-y-2">
                {event.what_to_bring.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isFull && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">
                This event is currently full. You can still register to join the waitlist.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}