import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Copy, CheckCircle } from "@/lib/icons";
import { toast } from "sonner";

/** "Subscribe to your calendar" — a keyless ICS feed the user adds to Google/Apple/Outlook. */
export default function CalendarSubscribe({ user }: { user: any }) {
  const [copied, setCopied] = useState(false);
  const token = user?.calendar_token;
  if (!token) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://kamboguide.com";
  const httpUrl = `${origin}/api/ics?token=${token}`;
  const webcalUrl = httpUrl.replace(/^https?:/, "webcal:");

  const copy = async () => {
    try { await navigator.clipboard.writeText(httpUrl); setCopied(true); toast.success("Calendar link copied"); setTimeout(() => setCopied(false), 2000); }
    catch { toast.error("Couldn't copy — select and copy the link manually."); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" weight="duotone" /> Calendar sync</CardTitle>
        <CardDescription>Subscribe once and your confirmed sessions appear automatically in Google, Apple, or Outlook Calendar — always up to date.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input readOnly value={httpUrl} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
          <Button variant="outline" onClick={copy} className="shrink-0 gap-2">
            {copied ? <CheckCircle className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />} Copy
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={webcalUrl}><Button size="sm" className="gap-2"><Calendar className="h-4 w-4" /> Add to calendar app</Button></a>
          <a href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(httpUrl)}`} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline">Add to Google Calendar</Button>
          </a>
        </div>
        <p className="text-xs text-muted-foreground">Keep this link private — anyone with it can view your session times.</p>
      </CardContent>
    </Card>
  );
}
