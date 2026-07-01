import React, { useState } from "react";
import { Report, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Flag } from "@/lib/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ReportButton({ 
  itemType, 
  itemId, 
  itemTitle,
  size = "sm",
  variant = "outline" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    { value: "spam", label: "Spam or promotional content" },
    { value: "harassment", label: "Harassment or bullying" },
    { value: "inappropriate_content", label: "Inappropriate or offensive content" },
    { value: "safety_concern", label: "Safety concern" },
    { value: "fraud", label: "Fraud or scam" },
    { value: "other", label: "Other" }
  ];

  const handleSubmit = async () => {
    if (!reason) return;
    
    setIsSubmitting(true);
    try {
      const currentUser = await User.me();
      
      await Report.create({
        reported_item_type: itemType,
        reported_item_id: itemId,
        reporter_id: currentUser.id,
        reporter_email: currentUser.email,
        reason,
        description: description.trim(),
        priority: reason === 'safety_concern' ? 'urgent' : 'medium'
      });

      setIsOpen(false);
      setReason("");
      setDescription("");
      
      // Show success message
      alert("Report submitted successfully. Our team will review it shortly.");
    } catch (error) {
      console.error("Failed to submit report:", error);
      alert("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Flag className="w-3 h-3 mr-1" />
        Report
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Content</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                You're reporting: <strong>{itemTitle}</strong>
              </p>
              
              <Label>What's the issue?</Label>
              <RadioGroup value={reason} onValueChange={setReason} className="mt-2">
                {reasons.map(r => (
                  <div key={r.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={r.value} id={r.value} />
                    <Label htmlFor={r.value} className="text-sm cursor-pointer">
                      {r.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label>Additional details (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide any additional context..."
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!reason || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}