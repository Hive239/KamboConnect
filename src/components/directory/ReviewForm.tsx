
import React, { useState, useEffect } from 'react';
import { User, Review, Notification } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Send } from "@/lib/icons"; // Added Send, removed Loader2
import { createPageUrl } from "@/utils"; // Added createPageUrl

export default function ReviewForm({ practitioner, bookingId, onSubmit, onCancel }) { // Changed prop names
  const [user, setUser] = useState(null);
  const [rating, setRating] = useState(0); // Changed initial rating to 0
  const [comment, setComment] = useState(""); // Renamed reviewText to comment
  const [reviewerName, setReviewerName] = useState(""); // Added reviewerName state
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        setReviewerName(currentUser.full_name); // Set reviewerName from current user
      } catch (error) { // Changed 'e' to 'error'
        console.log("User not logged in"); // Updated console message
      }
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Removed the !user || !practitioner check as per outline,
    // relying on `user?.id` and `reviewerName` possibly being empty/undefined
    setIsSubmitting(true);

    try {
      const reviewData = {
        practitioner_id: practitioner.id,
        booking_id: bookingId, // This might be null for general reviews
        reviewer_name: reviewerName,
        reviewer_id: user?.id, // Optional chaining for user id
        session_date: new Date().toISOString(), // Changed date format
        overall_rating: rating,
        review_text: comment, // Using 'comment' state
        would_recommend: true, // Assuming default, could add a checkbox
      };

      await Review.create(reviewData);

      // Create notification for the practitioner
      if (practitioner) { // Wrapped notification creation in a check for practitioner
          await Notification.create({
              user_id: practitioner.id,
              title: "You've received a new review!",
              message: `${reviewerName} left a ${rating}-star review on your profile.`, // Used reviewerName
              type: 'review',
              priority: 'high', // Added priority
              related_id: practitioner.id,
              action_url: createPageUrl(`PractitionerProfile?id=${practitioner.id}`), // Used createPageUrl
              sender_image_url: user?.profile_image_url, // Optional chaining for sender image
          });
      }

      onSubmit(reviewData); // Called onSubmit prop
      // Reset form
      setRating(0); // Reset rating
      setComment(""); // Reset comment
      // reviewerName is implicitly reset if user logs out or if form is unmounted
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Rating</Label>
        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-6 h-6 cursor-pointer ${
                star <= rating ? 'text-warning fill-warning' : 'text-muted-foreground/40'
              }`}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="comment">Your Review</Label> {/* Changed htmlFor to comment */}
        <Textarea
          id="comment" // Changed id to comment
          value={comment} // Used comment state
          onChange={(e) => setComment(e.target.value)} // Updated onChange to setComment
          placeholder="Share your experience..."
          required
          rows={4}
        />
      </div>
      <div className="flex justify-end gap-2"> {/* Added flex container for buttons */}
        {onCancel && ( // Conditionally render Cancel button if onCancel prop is provided
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || rating === 0 || comment.trim() === ""}> {/* Added disable logic for empty rating/comment */}
          {isSubmitting && <Send className="mr-2 h-4 w-4 animate-spin" />} {/* Changed Loader2 to Send */}
          Send Review {/* Changed button text */}
        </Button>
      </div>
    </form>
  );
}
