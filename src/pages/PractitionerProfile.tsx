
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Practitioner } from "@/entities/Practitioner";
import { Review } from "@/entities/Review";
import { User } from "@/entities/User";
import { Conversation } from "@/entities/Conversation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Star, MapPin, CheckCircle, Mail, Globe, Phone, MessageSquare, ArrowLeft,
  Users, Loader2, Calendar as CalendarIcon, ShareIcon
} from "@/lib/icons";
import { createPageUrl } from "@/utils";
import { format } from 'date-fns';
import { toast } from "sonner";
import FollowButton from "@/components/social/FollowButton";
import { useSeo } from "@/lib/useSeo";

// Helper function to get embed URL for YouTube or Vimeo
const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  let videoId = null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1);
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (urlObj.hostname.includes('vimeo.com')) {
      // For Vimeo, extract video ID from path, e.g., https://vimeo.com/123456789
      const pathParts = urlObj.pathname.split('/');
      videoId = pathParts[pathParts.length - 1];
      if (videoId && !isNaN(videoId)) { // Ensure it's a number
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }
  } catch (e) {
    return null; // Invalid URL
  }
  return null;
};


export default function PractitionerProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const practitionerId = new URLSearchParams(location.search).get("id");

  const [practitioner, setPractitioner] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // This useCallback is kept to provide default/mock data if fetched data is sparse
  const enrichPractitionerData = useCallback((practitionerData) => {
    const defaultSpecializations = ["Chronic Pain Management", "Emotional Healing", "Detoxification", "Spiritual Awakening", "Stress Relief"];
    const defaultCertifications = ["Kambo Practitioner Certified", "CPR/First Aid Certified", "Safety Protocols Training"];
    const defaultLanguages = ["English"];

    const enrichedData = {
      ...practitionerData,
      is_verified: practitionerData.is_verified !== false,
      listing_tier: practitionerData.listing_tier || 'basic',
      years_experience: practitionerData.years_experience || 5,
      pricing_range: practitionerData.pricing_range || '$$',
      profile_image_url: practitionerData.profile_image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800',
      phone: practitionerData.phone || "(555) 123-4567",
      people_served: practitionerData.people_served || 75,
      specializations: practitionerData.specializations && practitionerData.specializations.length > 0
        ? practitionerData.specializations
        : defaultSpecializations,
      languages: practitionerData.languages && practitionerData.languages.length > 0
        ? practitionerData.languages
        : defaultLanguages,
      certifications: practitionerData.certifications && practitionerData.certifications.length > 0
        ? practitionerData.certifications
        : defaultCertifications,
      training_background: practitionerData.training_background || "Completed comprehensive Kambo training with experienced practitioners. Certified through established Kambo training institutes with ongoing education in safety protocols and plant medicine ethics.",
      why_practitioner: practitionerData.why_practitioner || "After experiencing profound healing through Kambo, I felt called to share this sacred medicine with others. I'm passionate about creating safe spaces for transformation and honoring the traditional origins of this powerful healing practice.",
      safety_protocols: practitionerData.safety_protocols || "Comprehensive health screening, sterile application techniques, continuous monitoring during sessions, emergency protocols in place, and CPR certified.",
      image_urls: practitionerData.image_urls || [
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800'
      ],
      // For demo, ensure full_name and bio
      full_name: practitionerData.full_name || 'Kambo Practitioner',
      location: practitionerData.location || 'Online / Global'
    };

    if (!enrichedData.bio) {
      enrichedData.bio = "A dedicated Kambo practitioner committed to providing safe and transformative healing experiences. Specializing in traditional applications with modern safety standards.";
    }

    return enrichedData;
  }, []);

  useEffect(() => {
    if (!practitionerId) {
      // If no ID is provided, navigate to directory (removes 'My Profile' fallback)
      navigate(createPageUrl("Directory"));
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const user = await User.me().catch(() => null);
        setCurrentUser(user);

        // Fetch practitioner data by ID
        const practitionerRecord = await Practitioner.get(practitionerId).catch(() => null);

        if (!practitionerRecord) {
          // If practitioner not found, navigate to directory
          navigate(createPageUrl("Directory"));
          return;
        }

        // IMPORTANT FIX: Ensure the ID from the record is passed through
        const practitionerWithId = { ...practitionerRecord, id: practitionerId };
        const enrichedPractitioner = enrichPractitionerData(practitionerWithId);
        setPractitioner(enrichedPractitioner);

        // Fetch all reviews and filter by practitioner_id
        const allReviews = await Review.list();
        const practitionerReviews = allReviews.filter(r => r.practitioner_id === practitionerId);
        setReviews(practitionerReviews);

        if (practitionerReviews.length > 0) {
          const totalRating = practitionerReviews.reduce((sum, review) => sum + (review.overall_rating ?? review.rating ?? 0), 0);
          setAverageRating((totalRating / practitionerReviews.length).toFixed(1));
        } else {
          setAverageRating(0); // Set to 0 if no reviews
        }

      } catch (error) {
        console.error("Failed to fetch practitioner data:", error);
        // On error, navigate to directory
        navigate(createPageUrl("Directory"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [practitionerId, navigate, enrichPractitionerData]);

  // SEO + JSON-LD for the public profile (shareable social cards).
  useSeo(practitioner ? {
    title: `${practitioner.full_name} — Kambo Practitioner | KamboConnect`,
    description: (practitioner.bio || `Book a Kambo session with ${practitioner.full_name}.`).slice(0, 155),
    image: practitioner.profile_image_url,
    type: "profile",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Person",
      name: practitioner.full_name,
      description: practitioner.bio,
      image: practitioner.profile_image_url,
      address: practitioner.address ? {
        "@type": "PostalAddress",
        addressLocality: practitioner.address.city,
        addressRegion: practitioner.address.state_province,
      } : undefined,
      aggregateRating: reviews.length ? {
        "@type": "AggregateRating", ratingValue: averageRating, reviewCount: reviews.length,
      } : undefined,
    },
  } : {});

  const handleShare = async () => {
    const url = window.location.href;
    const title = practitioner ? `${practitioner.full_name} — KamboConnect` : "KamboConnect";
    try {
      if (navigator.share) await navigator.share({ title, url });
      else { await navigator.clipboard.writeText(url); toast.success("Profile link copied"); }
    } catch { /* user cancelled */ }
  };

  const handleRequestBooking = () => {
    navigate(createPageUrl(`BookingRequest?practitionerId=${practitioner.id}`));
  };

  const handleSendMessage = async () => {
    console.log("=== SEND MESSAGE CLICKED ===");
    console.log("currentUser:", currentUser);
    console.log("practitioner:", practitioner);
    
    if (!currentUser) {
      console.log("No current user - redirecting to login");
      await User.login();
      return;
    }
    console.log("Current user exists:", currentUser.id, currentUser.email);

    if (!practitioner) {
      console.log("ERROR: No practitioner found");
      alert("Error: Practitioner data not loaded");
      return;
    }
    console.log("Practitioner exists:", practitioner.id, practitioner.email);
    
    if (practitioner.email === currentUser.email) {
      console.log("Same user - cannot message self");
      alert("You cannot send a message to yourself.");
      return;
    }

    setIsSendingMessage(true);
    console.log("Starting message creation process...");
    
    try {
      console.log("Step 1: Fetching all conversations");
      const allConversations = await Conversation.list();
      console.log("Found conversations:", allConversations.length);
      
      console.log("Step 2: Looking for existing conversation");
      const existing = allConversations.find(c => {
        const match = (c.participant_1_id === currentUser.id && c.participant_2_id === practitioner.id) ||
                     (c.participant_2_id === currentUser.id && c.participant_1_id === practitioner.id);
        if (match) {
          console.log("Found existing conversation:", c.id);
        }
        return match;
      });

      let convoId = existing?.id;
      console.log("Existing conversation ID:", convoId);

      if (!convoId) {
        console.log("Step 3: Creating new conversation");
        const conversationData = {
          participant_1_id: currentUser.id,
          participant_2_id: practitioner.id,
          participant_1_name: currentUser.full_name,
          participant_2_name: practitioner.full_name,
          last_message: "Conversation started",
          last_message_date: new Date().toISOString()
        };
        console.log("Conversation data to create:", conversationData);
        
        const newConvo = await Conversation.create(conversationData);
        console.log("Created new conversation:", newConvo);
        convoId = newConvo.id;
      }
      
      console.log("Step 4: Navigating to messages");
      const messagesUrl = createPageUrl(`Messages?conversation_id=${convoId}`);
      console.log("Navigating to:", messagesUrl);
      navigate(messagesUrl);
      console.log("Navigation called");

    } catch (error) {
      console.error("ERROR in handleSendMessage:", error);
      console.error("Error stack:", error.stack);
      alert(`Error: ${error.message}`);
    } finally {
      console.log("Cleaning up...");
      setIsSendingMessage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-muted min-h-screen">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-48 bg-muted rounded-2xl animate-pulse"></div>
          <div className="flex flex-col md:flex-row gap-6 mt-8">
            <div className="md:w-2/3 space-y-6">
              <div className="h-64 bg-muted rounded-2xl animate-pulse"></div>
              <div className="h-48 bg-muted rounded-2xl animate-pulse"></div>
            </div>
            <div className="md:w-1/3 space-y-6">
              <div className="h-40 bg-muted rounded-2xl animate-pulse"></div>
              <div className="h-32 bg-muted rounded-2xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!practitioner) {
    // If practitioner is null after loading, it means it wasn't found or an error occurred.
    // The useEffect already navigates away in these cases, so this block might be less reachable,
    // but kept as a fallback for unexpected states.
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center p-6 bg-muted">
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Practitioner Not Found</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          We couldn't find a profile for this practitioner. They may have moved or the link is incorrect.
        </p>
        <Link to={createPageUrl("Directory")}>
          <Button className="bg-primary hover:bg-primary/90">
            Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(practitioner.video_interview_url);
  const canShowGallery = practitioner.image_urls && practitioner.image_urls.length > 0;

  return (
    <div className="bg-muted min-h-screen">
      <div className="w-full h-48 md:h-64 bg-gradient-to-br from-primary/5 to-clay/20 relative">
        <img loading="lazy"
          src={practitioner.image_urls?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop'}
          alt="Cover"
          className="w-full h-full object-cover opacity-20"
        />
         <div className="absolute top-4 left-4">
            <Button variant="secondary" onClick={() => navigate(createPageUrl('Directory'))} className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2"/>
              Back to Directory
            </Button>
          </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Header Section */}
        <div className="relative -mt-16 sm:-mt-24">
          <div className="flex flex-col sm:flex-row items-center bg-card p-6 rounded-2xl shadow-lg border">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-white shadow-md flex-shrink-0">
              <AvatarImage src={practitioner.profile_image_url} alt={practitioner.full_name} />
              <AvatarFallback><Users className="w-12 h-12 text-muted-foreground"/></AvatarFallback>
            </Avatar>
            <div className="flex-1 mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-3xl font-bold text-foreground">{practitioner.full_name}</h1>
                {practitioner.is_verified && <CheckCircle className="w-6 h-6 text-primary" title="Verified Practitioner" />}
              </div>
              <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-2">
                <MapPin className="w-4 h-4" />
                {practitioner.location}
              </p>
              {reviews.length > 0 && (
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <Star className="w-5 h-5 text-warning fill-warning" />
                  <span className="font-bold text-lg">{averageRating}</span>
                  <span className="text-muted-foreground">({reviews.length} reviews)</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
              <Button onClick={handleRequestBooking} className="w-full bg-primary hover:bg-primary/90">
                  <CalendarIcon className="w-4 h-4 mr-2"/>
                  Request Booking
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSendMessage}
                disabled={isSendingMessage || (currentUser && practitioner && currentUser.email === practitioner.email)}
              >
                {isSendingMessage ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                ) : (
                  <MessageSquare className="w-4 h-4 mr-2"/>
                )}
                Send Message
              </Button>
              <div className="flex gap-2">
                <FollowButton
                  followeeId={practitioner.id}
                  followeeType="practitioner"
                  followeeName={practitioner.full_name}
                  followeeImage={practitioner.profile_image_url}
                  size="default"
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleShare} aria-label="Share profile">
                  <ShareIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid (replaces Tabs) */}
        <div className="grid md:grid-cols-3 gap-8 mt-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>About {practitioner.full_name}</CardTitle></CardHeader>
              <CardContent className="text-foreground prose prose-sm max-w-none">
                <p>{practitioner.bio}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>My Journey with Kambo</CardTitle></CardHeader>
              <CardContent className="text-foreground prose prose-sm max-w-none">
                <p>{practitioner.why_practitioner}</p>
              </CardContent>
            </Card>
            {embedUrl && (
              <Card>
                <CardHeader><CardTitle>Video Interview</CardTitle></CardHeader>
                <CardContent>
                  <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
                    <iframe
                      src={embedUrl}
                      title="Video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader><CardTitle>Training & Background</CardTitle></CardHeader>
              <CardContent className="text-foreground prose prose-sm max-w-none">
                <p>{practitioner.training_background}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Safety Protocols</CardTitle></CardHeader>
              <CardContent className="text-foreground prose prose-sm max-w-none">
                <p>{practitioner.safety_protocols}</p>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader><CardTitle>Specializations</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {practitioner.specializations && practitioner.specializations.length > 0 ? (
                  practitioner.specializations.map(spec => (
                    <Badge key={spec} variant="secondary" className="bg-primary/10 text-primary">
                      {spec}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No specializations listed</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Certifications</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {practitioner.certifications && practitioner.certifications.length > 0 ? (
                  practitioner.certifications.map(cert => (
                    <div key={cert} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span className="text-sm">{cert}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No certifications listed</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Languages</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {practitioner.languages && practitioner.languages.length > 0 ? (
                  practitioner.languages.map(lang => (
                    <Badge key={lang} variant="outline" className="border-input">
                      {lang}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No languages listed</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {practitioner.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground"/>{practitioner.phone}</div>}
                {practitioner.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground"/>{practitioner.email}</div>}
                {practitioner.website_url && <a href={practitioner.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline"><Globe className="w-4 h-4 text-muted-foreground"/>Website</a>}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Client Reviews ({reviews.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <div key={review.id} className="p-4 border-b border-border last:border-b-0">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarFallback>{review.reviewer_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground">{review.reviewer_name}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(review.created_date), "MMM d, yyyy")}</p>
                        </div>
                        <div className="flex items-center gap-1 my-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < (review.overall_rating ?? review.rating ?? 0) ? 'text-warning fill-warning' : 'text-muted-foreground/40'}`} />
                          ))}
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{review.review_text || review.comment}</p>
                        {review.response_text && (
                          <div className="mt-3 rounded-lg border-l-2 border-primary bg-muted/60 p-3">
                            <p className="text-xs font-semibold text-primary">
                              Response from {practitioner.full_name}
                              {review.response_date && (
                                <span className="ml-2 font-normal text-muted-foreground">
                                  {format(new Date(review.response_date), "MMM d, yyyy")}
                                </span>
                              )}
                            </p>
                            <p className="mt-1 text-sm text-foreground leading-relaxed">{review.response_text}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <p>This practitioner doesn't have any reviews yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gallery Section */}
        {canShowGallery && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {practitioner.image_urls.map((url, index) => (
                    <div key={index} className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden cursor-pointer group" onClick={() => setSelectedImage(url)}>
                      <img loading="lazy" src={url} alt={`Gallery image ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {!canShowGallery && (
          <div className="mt-8">
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p>No gallery images have been added yet.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 bg-transparent border-0 shadow-none">
            <img loading="lazy" src={selectedImage} alt="Gallery view" className="w-full h-auto rounded-lg" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
