import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "@/lib/icons";
import { format } from "date-fns";

export default function ReviewHistory({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Star className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-xl font-semibold text-foreground">No Reviews Written</h3>
          <p className="text-muted-foreground mt-2">You haven't reviewed any practitioners yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <Card key={review.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-muted-foreground">Review for:</p>
                <p className="font-semibold text-lg">Practitioner Name Placeholder</p>
              </div>
              <p className="text-sm text-muted-foreground">{format(new Date(review.created_date), "MMM d, yyyy")}</p>
            </div>
            
            <div className="flex items-center gap-1 my-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < review.rating ? 'text-warning fill-warning' : 'text-muted-foreground/40'}`} />
              ))}
            </div>
            <p className="text-foreground italic">"{review.review_text}"</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}