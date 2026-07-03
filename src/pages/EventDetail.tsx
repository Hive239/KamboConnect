import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Event, Practitioner } from "@/entities/all";
import { createPageUrl } from "@/utils";
import { useSeo } from "@/lib/useSeo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Globe, Users, DollarSign, Loader2, ShareIcon, CheckCircle, MessageSquare } from "@/lib/icons";
import { format } from "date-fns";
import { toast } from "sonner";
import AddToCalendar from "@/components/AddToCalendar";
import RegistrationModal from "@/components/events/RegistrationModal";
import { submitRegistration } from "@/lib/eventRegistration";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { EventRegistration, Notification, User } from "@/entities/all";

const TYPE_LABEL: Record<string, string> = {
  circle: "Kambo Circle", workshop: "Workshop", retreat: "Retreat", meetup: "Meetup", training: "Training",
};

/** Shareable, SEO-friendly public detail page for a single event. */
export default function EventDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const eventId = new URLSearchParams(location.search).get("id");

  const [event, setEvent] = useState<any>(null);
  const [host, setHost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const reqRef = useRef(0);

  const checkRegistered = async () => {
    const me = await User.me().catch(() => null);
    if (!me?.email) return;
    const regs = await EventRegistration.filter({ event_id: eventId, participant_email: me.email }).catch(() => []);
    setIsRegistered(regs.length > 0);
  };

  useEffect(() => {
    if (!eventId) { navigate(createPageUrl("Events")); return; }
    const myReq = ++reqRef.current;
    setLoading(true);
    (async () => {
      try {
        const ev = await Event.get(eventId).catch(() => null);
        if (myReq !== reqRef.current) return;
        if (!ev) { navigate(createPageUrl("Events")); return; }
        setEvent(ev);
        if (ev.practitioner_id) {
          const p = await Practitioner.get(ev.practitioner_id).catch(() => null);
          if (myReq === reqRef.current) setHost(p);
        }
        checkRegistered();
      } finally {
        if (myReq === reqRef.current) setLoading(false);
      }
    })();
  }, [eventId, navigate]);

  useSeo(event ? {
    title: `${event.title} — KamboGuide`,
    description: (event.description || `Join ${event.title}.`).slice(0, 155),
    image: event.image_url,
    type: "event",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.title,
      description: event.description,
      startDate: event.start_date,
      endDate: event.end_date,
      image: event.image_url ? [event.image_url] : undefined,
      eventAttendanceMode: event.is_online ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: event.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
      location: event.is_online
        ? { "@type": "VirtualLocation", url: typeof window !== "undefined" ? window.location.href : undefined }
        : event.location ? { "@type": "Place", name: event.location, address: event.location } : undefined,
      offers: (event.price || event.price === 0) ? {
        "@type": "Offer",
        price: event.price || 0,
        priceCurrency: "USD",
        availability: (event.max_participants && (event.current_participants || 0) >= event.max_participants)
          ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      } : undefined,
    },
  } : {});

  const handleRegistrationSubmit = async (registrationData: any) => {
    const { status, current_participants } = await submitRegistration(event, registrationData);
    setEvent((e: any) => ({ ...e, current_participants }));
    setIsRegistered(true);
    const me = await User.me().catch(() => null);
    if (me) await Notification.create({
      user_id: me.id,
      title: status === "waitlist" ? "You're on the waitlist" : "Event Registration Confirmed",
      message: status === "waitlist" ? `"${event.title}" is full — we'll notify you if a spot opens.` : `You're registered for "${event.title}".`,
      type: "event", related_id: event.id, action_url: `${createPageUrl("EventDetail")}?id=${event.id}`,
    }).catch(() => {});
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: event.title, url });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied to clipboard"); }
    } catch { /* user cancelled */ }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!event) return null;

  const start = new Date(event.start_date);
  const end = event.end_date ? new Date(event.end_date) : start;
  const isFull = event.max_participants && (event.current_participants || 0) >= event.max_participants;
  const spotsLeft = event.max_participants ? event.max_participants - (event.current_participants || 0) : null;

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <PageBreadcrumbs className="mb-4" items={[{ label: "Events", to: createPageUrl("Events") }, { label: event.title }]} />

      {/* Editorial hero — title overlaid on image or gradient-mesh */}
      <div className="grain relative mb-5 overflow-hidden rounded-3xl border border-border">
        {event.image_url ? (
          <>
            <img loading="lazy" src={event.image_url} alt={event.title} className="h-64 w-full object-cover sm:h-72" />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          </>
        ) : (
          <div className="relative h-56 w-full bg-background sm:h-64"><GradientMesh intensity="vivid" /></div>
        )}
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="tier">{TYPE_LABEL[event.event_type] || "Event"}</Badge>
            {event.is_online && <Badge className="gap-1 bg-info/10 text-info"><Globe className="h-3 w-3" /> Online</Badge>}
            {event.status === "cancelled" && <Badge variant="destructive">Cancelled</Badge>}
          </div>
          <h1 className="text-balance font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{event.title}</h1>
          {host && (
            <p className="mt-1 text-muted-foreground">
              Hosted by{" "}
              <Link to={`${createPageUrl("PractitionerProfile")}?id=${host.id}`} className="font-medium text-primary hover:underline">{host.full_name}</Link>
            </p>
          )}
        </div>
      </div>

      <div className="mb-5 flex items-center gap-2">
        {host && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`${createPageUrl("Messages")}?to=${host.id}&name=${encodeURIComponent(host.full_name || "Host")}`)}>
            <MessageSquare className="h-4 w-4" /> Message host
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={share} className="gap-1.5"><ShareIcon className="h-4 w-4" /> Share</Button>
      </div>

      <Card className="mb-5">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-primary" /><div><p className="font-medium">{format(start, "EEEE, MMMM d, yyyy")}</p></div></div>
          <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-primary" /><p className="font-medium">{format(start, "h:mm a")} – {format(end, "h:mm a")}</p></div>
          <div className="flex items-center gap-3">
            {event.is_online ? <Globe className="h-5 w-5 text-primary" /> : <MapPin className="h-5 w-5 text-primary" />}
            {event.is_online ? (
              isRegistered && event.meeting_link ? (
                <a href={event.meeting_link} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">Join online →</a>
              ) : (
                <p className="font-medium">Online{isRegistered ? "" : " · link after registration"}</p>
              )
            ) : (
              <p className="font-medium">{event.location || "Location TBA"}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <p className="font-medium">
              {event.current_participants || 0}{event.max_participants ? ` / ${event.max_participants}` : ""} registered
              {spotsLeft !== null && spotsLeft > 0 && <span className="ml-1 text-sm font-normal text-muted-foreground">({spotsLeft} left)</span>}
            </p>
          </div>
        </CardContent>
      </Card>

      {event.description && <p className="mb-5 whitespace-pre-line leading-relaxed text-foreground">{event.description}</p>}

      {(event.requirements?.length > 0 || event.what_to_bring?.length > 0) && (
        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          {event.requirements?.length > 0 && (
            <Card><CardContent className="p-4"><h3 className="mb-2 font-semibold">Requirements</h3><ul className="space-y-1 text-sm text-muted-foreground">{event.requirements.map((r: string, i: number) => <li key={i} className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{r}</li>)}</ul></CardContent></Card>
          )}
          {event.what_to_bring?.length > 0 && (
            <Card><CardContent className="p-4"><h3 className="mb-2 font-semibold">What to bring</h3><ul className="space-y-1 text-sm text-muted-foreground">{event.what_to_bring.map((r: string, i: number) => <li key={i} className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{r}</li>)}</ul></CardContent></Card>
          )}
        </div>
      )}

      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur">
        <div className="flex items-center gap-1.5 text-2xl font-bold text-primary"><DollarSign className="h-5 w-5" />{event.price || 0}</div>
        <div className="flex items-center gap-2">
          <AddToCalendar event={{ title: event.title, details: event.description, location: event.is_online ? (event.meeting_link || "Online") : event.location, start: event.start_date, end: event.end_date }} />
          <Button disabled={event.status === "cancelled" || isRegistered} onClick={() => setRegistering(true)} className="px-8">
            {event.status === "cancelled" ? "Cancelled" : isRegistered ? "Registered ✓" : isFull ? "Join waitlist" : "Register"}
          </Button>
        </div>
      </div>

      {registering && (
        <RegistrationModal event={event} onClose={() => setRegistering(false)} onSubmitRegistration={handleRegistrationSubmit} />
      )}
    </div>
  );
}
