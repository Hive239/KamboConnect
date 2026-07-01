import React, { useState, useEffect } from "react";
import { Review, User, Notification, ModerationCase } from "@/entities/all";
import { moderateContent } from "@/integrations/Moderation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Star, CheckCircle, XCircle, Loader2, Calendar } from "@/lib/icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from 'date-fns';

const StarRating = ({ rating, onRatingChange, label, description, required = false }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <span className="text-sm text-muted-foreground">{rating > 0 ? `${rating}/5` : 'Not rated'}</span>
    </div>
    {description && <p className="text-xs text-muted-foreground">{description}</p>}
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className="focus:outline-none transition-all hover:scale-110"
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              star <= rating
                ? "text-warning fill-warning"
                : "text-muted-foreground/40 hover:text-yellow-300"
            }`}
          />
        </button>
      ))}
    </div>
  </div>
);

export default function BookingReviewModal({ booking, onClose, onSubmit }) {
  const [user, setUser] = useState(null);
  const [reviewData, setReviewData] = useState({
    overall_rating: 0,
    safety_rating: 0,
    communication_rating: 0,
    environment_rating: 0,
    professionalism_rating: 0,
    review_text: "",
    would_recommend: null,
    session_date: booking?.requested_date ? format(new Date(booking.requested_date), 'yyyy-MM-dd') : ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (e) {
        setError("You must be logged in to leave a review");
      }
    };
    fetchUser();
  }, []);

  const validateForm = () => {
    if (reviewData.overall_rating === 0) {
      return "Please provide an overall rating";
    }
    if (reviewData.would_recommend === null) {
      return "Please indicate if you would recommend this practitioner";
    }
    if (!reviewData.review_text.trim()) {
      return "Please write a review describing your experience";
    }
    if (!reviewData.session_date) {
      return "Please confirm the session date";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !booking) return;
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");
    
    try {
      // AI moderation pass (integrity / anti-abuse) before publishing
      const mod = await moderateContent(reviewData.review_text.trim());
      const newReview = await Review.create({
        practitioner_id: booking.practitioner_id,
        booking_id: booking.id,
        reviewer_name: user.full_name,
        reviewer_id: user.id,
        session_date: reviewData.session_date,
        session_type: booking.service_type,
        overall_rating: reviewData.overall_rating,
        safety_rating: reviewData.safety_rating || null,
        communication_rating: reviewData.communication_rating || null,
        environment_rating: reviewData.environment_rating || null,
        professionalism_rating: reviewData.professionalism_rating || null,
        review_text: reviewData.review_text.trim(),
        would_recommend: reviewData.would_recommend,
        verified_client: true, // Always true when submitted via completed booking
        flagged: mod.flagged,
      });

      // Route flagged reviews to the Trust & Safety queue
      if (mod.flagged) {
        await ModerationCase.create({
          subject_type: 'review', subject_id: newReview.id, source: 'ai',
          score: mod.score, reasons: mod.reasons, status: 'open',
          snippet: reviewData.review_text.trim().slice(0, 140),
        });
      }

      // Notify the practitioner about the new review
      await Notification.create({
        user_id: booking.practitioner_id,
        title: `New Review from ${user.full_name}`,
        message: `You received a ${newReview.overall_rating}-star review for a recent session.`,
        type: 'review',
        priority: 'normal',
        related_id: newReview.id,
        action_url: `/PractitionerProfile?id=${booking.practitioner_id}` // Link to their profile
      });
      
      onSubmit(); // Trigger refresh in parent component
      onClose(); // Close the modal
    } catch (error) {
      console.error("Failed to submit review:", error);
      setError("There was an error submitting your review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking || !user) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Star className="w-6 h-6 text-warning" />
            Review Your Session with {booking.practitioner_name}
          </DialogTitle>
          <DialogDescription>
            Your feedback helps our community make informed decisions and helps practitioners improve their services.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Session Date Confirmation */}
          <div className="bg-muted p-4 rounded-lg">
            <Label htmlFor="session_date" className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Confirm Session Date <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mb-2">Please confirm the actual date of your Kambo session</p>
            <Input
              id="session_date"
              type="date"
              value={reviewData.session_date}
              onChange={(e) => setReviewData(prev => ({...prev, session_date: e.target.value}))}
              required
              className="mt-2"
            />
          </div>

          <Separator />

          {/* Rating Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Rate Your Experience</h3>
            
            <StarRating
              label="Overall Experience"
              description="Your general satisfaction with the session"
              rating={reviewData.overall_rating}
              onRatingChange={(rating) => setReviewData(prev => ({...prev, overall_rating: rating}))}
              required={true}
            />
            
            <div className="grid md:grid-cols-2 gap-6">
              <StarRating
                label="Safety & Protocols"
                description="How safe you felt during the session"
                rating={reviewData.safety_rating}
                onRatingChange={(rating) => setReviewData(prev => ({...prev, safety_rating: rating}))}
              />
              
              <StarRating
                label="Communication"
                description="Clarity of instructions and guidance"
                rating={reviewData.communication_rating}
                onRatingChange={(rating) => setReviewData(prev => ({...prev, communication_rating: rating}))}
              />
              
              <StarRating
                label="Environment"
                description="Comfort and cleanliness of the space"
                rating={reviewData.environment_rating}
                onRatingChange={(rating) => setReviewData(prev => ({...prev, environment_rating: rating}))}
              />
              
              <StarRating
                label="Professionalism"
                description="Practitioner's conduct and expertise"
                rating={reviewData.professionalism_rating}
                onRatingChange={(rating) => setReviewData(prev => ({...prev, professionalism_rating: rating}))}
              />
            </div>
          </div>

          <Separator />

          {/* Recommendation Section */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Would you recommend this practitioner? <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => setReviewData(prev => ({...prev, would_recommend: true}))}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${
                  reviewData.would_recommend === true 
                    ? "bg-primary/5 border-primary/30 text-primary shadow-sm" 
                    : "bg-card border-input text-foreground hover:bg-accent"
                }`}
              >
                <CheckCircle className="w-5 h-5" /> 
                Yes, I would recommend
              </button>
              
              <button 
                type="button" 
                onClick={() => setReviewData(prev => ({...prev, would_recommend: false}))}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${
                  reviewData.would_recommend === false 
                    ? "bg-red-50 border-red-300 text-red-800 shadow-sm" 
                    : "bg-card border-input text-foreground hover:bg-accent"
                }`}
              >
                <XCircle className="w-5 h-5" /> 
                No, I would not recommend
              </button>
            </div>
          </div>

          <Separator />

          {/* Written Review */}
          <div>
            <Label htmlFor="review_text" className="text-base font-semibold">
              Your Review <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Share details about your experience to help others in the community
            </p>
            <Textarea
              id="review_text"
              value={reviewData.review_text}
              onChange={(e) => setReviewData(prev => ({...prev, review_text: e.target.value}))}
              placeholder="Describe your experience with this practitioner. What went well? What could be improved? How did you feel before, during, and after the session?"
              rows={5}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {reviewData.review_text.length}/500 characters
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2"/> 
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2"/>
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}