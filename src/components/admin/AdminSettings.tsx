import React, { useState } from "react";
import { Notification, User } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Send, Bell, Users } from "@/lib/icons";
import { toast } from "sonner";

export default function AdminSettings() {
  const [announcement, setAnnouncement] = useState({
    title: "",
    message: ""
  });
  const [isSending, setIsSending] = useState(false);

  const handleSendAnnouncement = async () => {
    if (!announcement.title.trim() || !announcement.message.trim()) {
      toast.error("Please fill in both title and message.");
      return;
    }
    setIsSending(true);
    try {
      // Fan out a real notification to every user so it actually reaches inboxes.
      const users = await User.list();
      const recipients = (users || []).filter((u: any) => u.status !== "deleted");
      await Promise.all(recipients.map((u: any) =>
        Notification.create({
          user_id: u.id,
          title: announcement.title,
          message: announcement.message,
          type: "community",
          priority: "normal",
        }).catch(() => null),
      ));
      setAnnouncement({ title: "", message: "" });
      toast.success(`Announcement sent to ${recipients.length} user${recipients.length === 1 ? "" : "s"}.`);
    } catch (error) {
      console.error("Failed to send announcement:", error);
      toast.error("Failed to send announcement. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" />
            Admin Settings
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-blue-600" />
              Community Announcement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Announcement Title</label>
              <Input
                value={announcement.title}
                onChange={(e) => setAnnouncement(prev => ({...prev, title: e.target.value}))}
                placeholder="e.g., Platform Maintenance Notice"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={announcement.message}
                onChange={(e) => setAnnouncement(prev => ({...prev, message: e.target.value}))}
                placeholder="Enter your announcement message here..."
                rows={4}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleSendAnnouncement}
              disabled={isSending || !announcement.title.trim() || !announcement.message.trim()}
              className="w-full"
            >
              {isSending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to All Users
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              Platform Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-3">
              <div>
                <h4 className="font-medium">Community Standards</h4>
                <p className="text-muted-foreground">Ensure all content follows community guidelines</p>
              </div>
              <div>
                <h4 className="font-medium">Verification Process</h4>
                <p className="text-muted-foreground">Review practitioner applications within 48 hours</p>
              </div>
              <div>
                <h4 className="font-medium">Dispute Resolution</h4>
                <p className="text-muted-foreground">Address user reports within 24 hours</p>
              </div>
              <div>
                <h4 className="font-medium">Safety Priority</h4>
                <p className="text-muted-foreground">Safety concerns should be handled immediately</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}