import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Calendar, Globe, Mail, Send, MapPin, UserCircle, X, CheckCircle
} from "@/lib/icons";
import DirectBookingModal from "../booking/DirectBookingModal";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FollowButton from "@/components/social/FollowButton";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { requestConsultation } from "@/lib/consultations";
import { User } from "@/entities/all";
import { toast } from "sonner";

// Helper to extract video ID from YouTube/Vimeo URL
const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    let videoId;
    if (url.includes("youtube.com/watch?v=")) {
        videoId = url.split('v=')[1].split('&')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtu.be/")) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("vimeo.com/")) {
        videoId = url.split('vimeo.com/')[1].split('?')[0];
        return `https://player.vimeo.com/video/${videoId}`;
    }
    return null;
};

export default function PractitionerModal({
  practitioner,
  reviews,
  averageRating,
  onClose,
  onRequestBooking
}) {
  const [showVideo, setShowVideo] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);
  const [showDirectBooking, setShowDirectBooking] = useState(false);
  const [requestingConsult, setRequestingConsult] = useState(false);
  const { data: currentUser } = useCurrentUser();
  const handleRequestConsultation = async () => {
    if (!currentUser) { await User.login(); return; }
    setRequestingConsult(true);
    try { await requestConsultation(practitioner, currentUser); toast.success("Consultation requested."); }
    catch { toast.error("Could not request consultation."); }
    finally { setRequestingConsult(false); }
  };
  const embedUrl = getYouTubeEmbedUrl(practitioner.video_interview_url);

  const canShowReviews = practitioner.listing_tier === 'preferred' || practitioner.listing_tier === 'featured';
  const canShowGallery = practitioner.listing_tier === 'preferred' || practitioner.listing_tier === 'featured';
  const canShowVideo = practitioner.listing_tier === 'featured';
  const isFeatured = practitioner.listing_tier === 'preferred' || practitioner.listing_tier === 'featured';
  const isPremium = practitioner.listing_tier === 'featured';

  const fullProfileUrl = createPageUrl(`PractitionerProfile?id=${practitioner.id}`);
  
  return (
    <Dialog open={!!practitioner} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-card">
        {/* Header with Back Button */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-card/80 backdrop-blur-sm">
            <h2 className="text-lg font-semibold">{practitioner.full_name}</h2>
            <Button
                variant="ghost"
                size="icon"
                aria-label="Close"
                onClick={onClose}
                className="text-muted-foreground hover:bg-accent hover:text-foreground"
            >
                <X className="w-5 h-5" />
            </Button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left Column - Profile Summary */}
            <div className="md:col-span-1 space-y-4">
              <Avatar className="w-32 h-32 mx-auto border-4 border-white shadow-lg">
                <AvatarImage src={practitioner.profile_image_url} alt={practitioner.full_name} />
                <AvatarFallback>
                  <UserCircle className="w-full h-full text-muted-foreground"/>
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-xl font-bold">{practitioner.full_name}</h3>
                  {practitioner.is_verified && <CheckCircle className="w-5 h-5 text-primary" />}
                </div>
                <p className="text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {practitioner.location}
                </p>
              </div>

              {canShowReviews && reviews.length > 0 && (
                <div className="flex items-center justify-center gap-2">
                  <Star className="w-5 h-5 text-warning fill-warning" />
                  <span className="font-bold text-lg">{averageRating}</span>
                  <span className="text-muted-foreground">({reviews.length} reviews)</span>
                </div>
              )}
              
              <div className="space-y-2">
                <Button asChild className="w-full">
                    <Link to={fullProfileUrl} onClick={onClose}>View Full Profile</Link>
                </Button>
                <Button onClick={() => setShowDirectBooking(true)} className="w-full bg-primary hover:bg-primary/90">
                    <Calendar className="w-4 h-4 mr-2"/>
                    Book Now
                </Button>
                <Button onClick={handleRequestConsultation} disabled={requestingConsult} variant="outline" className="w-full">
                    <Mail className="w-4 h-4 mr-2"/>
                    {requestingConsult ? "Requesting…" : "Request Consultation"}
                </Button>
                <Button onClick={onRequestBooking} variant="ghost" className="w-full">
                    <Send className="w-4 h-4 mr-2"/>
                    Request Booking
                </Button>
                <FollowButton
                  followeeId={practitioner.id}
                  followeeType="practitioner"
                  followeeName={practitioner.full_name}
                  followeeImage={practitioner.profile_image_url}
                  size="default"
                  className="w-full"
                />
              </div>
              
              <div className="text-sm space-y-2 pt-4 border-t">
                  {practitioner.website_url && <a href={practitioner.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary"><Globe className="w-4 h-4"/> Visit Website</a>}
                  {practitioner.email && <a href={`mailto:${practitioner.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary"><Mail className="w-4 h-4"/> Contact via Email</a>}
              </div>

            </div>

            {/* Right Column - Details */}
            <div className="md:col-span-2 space-y-6">
                <div>
                    <h4 className="font-semibold text-foreground mb-2">About</h4>
                    <p className="text-muted-foreground leading-relaxed line-clamp-4">{practitioner.bio}</p>
                </div>
                
                {(isFeatured || isPremium) && practitioner.specializations?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Healing Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {practitioner.specializations.map((spec, i) => <Badge key={i} variant="secondary">{spec}</Badge>)}
                    </div>
                  </div>
                )}
                
                {isPremium && embedUrl && (
                    <div>
                        <h4 className="font-semibold text-foreground mb-2">Video Interview</h4>
                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                            <iframe
                              src={embedUrl}
                              className="w-full h-full"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title="Practitioner Interview"
                            />
                        </div>
                    </div>
                )}

                {canShowReviews && reviews.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-foreground mb-2">Latest Review</h4>
                        <div className="bg-muted rounded-lg p-4">
                            <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < reviews[0].rating ? 'text-warning fill-warning' : 'text-muted-foreground/40'}`} />
                                ))}
                            </div>
                            <p className="text-muted-foreground italic">"{reviews[0].comment || reviews[0].review_text}"</p>
                            <p className="text-right text-sm font-medium text-foreground mt-2">- {reviews[0].reviewer_name}</p>
                        </div>
                    </div>
                )}
                
                {/* REMOVED generic review form trigger */}
            </div>
          </div>
        </div>

        {/* Gallery Modal */}
        {selectedGalleryImage && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedGalleryImage(null)}
          >
            <img loading="lazy"
              src={selectedGalleryImage}
              alt="Ceremony space"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-card/20"
              onClick={() => setSelectedGalleryImage(null)}
              aria-label="Close image"
            >
              <X />
            </Button>
          </div>
        )}
        
        {/* Direct Booking Modal */}
        {showDirectBooking && (
          <DirectBookingModal
            practitioner={practitioner}
            onClose={() => setShowDirectBooking(false)}
            onBookingComplete={() => {
              // Optionally refresh bookings or show success message
              setShowDirectBooking(false); // Close modal on completion
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}