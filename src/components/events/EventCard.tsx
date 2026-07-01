
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, MapPin, Users, DollarSign, Clock,
  Globe, Video 
} from "@/lib/icons";
import { format } from "date-fns";
import FavoriteButton from "../favorites/FavoriteButton";
import { formatDistance } from "../utils/locationUtils"; // Changed path

export default function EventCard({ event, practitioner, onViewDetails, onRegister }) {
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

  const isAlmostFull = event.current_participants >= (event.max_participants * 0.8);
  const isFull = event.current_participants >= event.max_participants;
  const spotsLeft = event.max_participants - event.current_participants;

  const badge = getEventTypeBadge(event.event_type);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="cursor-pointer relative group"
    >
      <Card className="overflow-hidden border-border shadow-sm hover:shadow-md transition-all">
        {/* Event Image */}
        <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-clay/30 relative overflow-hidden">
          {event.image_url ? (
            <img loading="lazy" 
              src={event.image_url} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-16 h-16 text-primary/30" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge className={`${badge.color} border`}>
              {badge.text}
            </Badge>
          </div>
          {event.is_online && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                <Video className="w-3 h-3" />
                Online
              </Badge>
            </div>
          )}
          
          {/* Distance badge */}
          {event.distance !== null && event.distance !== undefined && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-card/90 text-foreground border-border">
                {formatDistance(event.distance)} away
              </Badge>
            </div>
          )}
          
          {/* Favorite button */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <FavoriteButton
              itemId={event.id}
              itemType="event"
              itemTitle={event.title}
              metadata={{
                event_date: event.start_date,
                practitioner_name: practitioner?.full_name
              }}
              size="sm"
              className="bg-card/90 hover:bg-card shadow-sm"
            />
          </div>
        </div>

        <CardContent className="p-4">
          {/* Event Title & Practitioner */}
          <div className="mb-3">
            <h3 className="font-semibold text-lg text-foreground mb-1 line-clamp-2">
              {event.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              with{" "}
              {practitioner?.id ? (
                <Link
                  to={`${createPageUrl("PractitionerProfile")}?id=${practitioner.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-medium text-primary hover:underline"
                >
                  {practitioner.full_name}
                </Link>
              ) : (
                practitioner?.full_name || "Practitioner"
              )}
            </p>
          </div>

          {/* Event Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(event.start_date), "MMM d, yyyy")}
              </span>
              <Clock className="w-4 h-4 ml-2" />
              <span>
                {format(new Date(event.start_date), "h:mm a")}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {event.is_online ? (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Online Event</span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  <span className="truncate flex-1">{event.location}</span>
                  {event.distance !== null && event.distance !== undefined && (
                    <span className="text-blue-600 font-medium ml-auto">
                      {formatDistance(event.distance)}
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>
                  {event.current_participants}/{event.max_participants} spots
                </span>
              </div>
              <div className="flex items-center gap-1 font-semibold text-primary">
                <DollarSign className="w-4 h-4" />
                <span>{event.price}</span>
              </div>
            </div>
          </div>

          {/* Availability Status */}
          {isFull ? (
            <Badge className="bg-red-100 text-red-800 border-red-200 w-full justify-center mb-3">
              Event Full
            </Badge>
          ) : isAlmostFull ? (
            <Badge className="bg-orange-100 text-orange-800 border-orange-200 w-full justify-center mb-3">
              Only {spotsLeft} spots left!
            </Badge>
          ) : null}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onViewDetails(event)}
              className="flex-1"
            >
              View Details
            </Button>
            <Button 
              size="sm" 
              onClick={() => onRegister(event)}
              disabled={isFull}
              className={`flex-1 ${
                isFull 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-primary hover:bg-primary/90"
              }`}
            >
              {isFull ? "Full" : "Register"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
