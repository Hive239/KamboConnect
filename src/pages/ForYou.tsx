import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Practitioner, Review, User, Booking, Favorite } from "@/entities/all";
import { createPageUrl } from "@/utils";
import { useSeo } from "@/lib/useSeo";
import { scoreMatches } from "@/integrations/Matchmaking";
import type { MatchResult } from "@/lib/matchScore";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { Reveal } from "@/components/ui/Reveal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkle, ArrowRight, MapPin, Users, Calendar, Store, BookOpen, ShieldCheck,
  CalendarCheck, Leaf, CheckCircle, Circle, Star, MessageSquare,
} from "@/lib/icons";

const JOURNEY = [
  { key: "learn", title: "Learn", body: "Understand what Kambo is and whether it's right for you.", page: "Education", icon: BookOpen },
  { key: "match", title: "Match", body: "Find a verified practitioner who fits your needs.", page: "Guide", icon: Sparkle },
  { key: "consult", title: "Consult", body: "Request a free consultation to make sure it's a fit.", page: "Directory", icon: MessageSquare },
  { key: "screen", title: "Screen", body: "Complete a health screening & informed consent.", page: "Bookings", icon: ShieldCheck },
  { key: "book", title: "Book", body: "Confirm your session with confidence.", page: "Bookings", icon: CalendarCheck },
  { key: "integrate", title: "Integrate", body: "Reflect and connect with the community afterward.", page: "Community", icon: Users },
];

const QUICK_ACTIONS = [
  { label: "Ask the Guide", page: "Guide", icon: Sparkle, tint: "bg-primary/10 text-primary" },
  { label: "Browse directory", page: "Directory", icon: MapPin, tint: "bg-info/10 text-info" },
  { label: "Community", page: "Community", icon: Users, tint: "bg-clay/10 text-clay" },
  { label: "Events", page: "Events", icon: Calendar, tint: "bg-success/10 text-success" },
  { label: "Market", page: "Market", icon: Store, tint: "bg-warning/10 text-warning" },
  { label: "Learn", page: "Education", icon: BookOpen, tint: "bg-primary/10 text-primary" },
];

export default function ForYou() {
  useSeo({ title: "For You — KamboGuide", description: "Your personalized KamboGuide home: your journey, recommended practitioners, and quick actions." });

  const [user, setUser] = useState<any>(null);
  const [recs, setRecs] = useState<MatchResult[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [favCount, setFavCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [u, list, reviews] = await Promise.all([
        User.me().catch(() => null),
        Practitioner.list("-created_date").catch(() => []),
        Review.list("-created_date").catch(() => []),
      ]);
      if (cancelled) return;
      setUser(u);

      // ratings map
      const acc: Record<string, { sum: number; n: number }> = {};
      (reviews as any[]).forEach((r) => {
        const pid = r.practitioner_id;
        const val = r.overall_rating ?? r.rating ?? 0;
        if (!pid || !val) return;
        acc[pid] = acc[pid] || { sum: 0, n: 0 };
        acc[pid].sum += val; acc[pid].n += 1;
      });
      const ratingOf = (p: any) => (acc[p.id] ? acc[p.id].sum / acc[p.id].n : 0);

      const ranked = await scoreMatches({ requireVerified: true }, list as any, ratingOf);
      if (!cancelled) setRecs(ranked.filter((r) => r.score > 0).slice(0, 4));

      if (u) {
        const [bk, favs] = await Promise.all([
          Booking.filter({ client_id: u.id }, "-created_date").catch(() => []),
          Favorite.filter({ user_id: u.id }).catch(() => []),
        ]);
        if (!cancelled) { setBookings(bk as any[]); setFavCount((favs as any[]).length); }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Derive journey progress from available signals (approximate but honest).
  const done = useMemo(() => {
    const has = bookings.length > 0;
    const hasConfirmed = bookings.some((b) => ["confirmed", "completed"].includes(b.status));
    const hasCompleted = bookings.some((b) => b.status === "completed");
    return {
      learn: has || favCount > 0,
      match: has || favCount > 0,
      consult: has,
      screen: has,
      book: hasConfirmed,
      integrate: hasCompleted,
    } as Record<string, boolean>;
  }, [bookings, favCount]);

  const currentIdx = useMemo(() => {
    const idx = JOURNEY.findIndex((s) => !done[s.key]);
    return idx === -1 ? JOURNEY.length - 1 : idx;
  }, [done]);
  const progress = Math.round((JOURNEY.filter((s) => done[s.key]).length / JOURNEY.length) * 100);

  const firstName = user?.full_name?.split(" ")[0] || "there";
  const upcoming = bookings.find((b) => ["confirmed", "pending"].includes(b.status));

  return (
    <div className="min-h-full bg-muted pb-12">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border bg-card grain">
        <GradientMesh intensity="soft" />
        <div className="relative z-10 mx-auto max-w-6xl px-5 py-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Your space</p>
          <h1 className="mt-1 font-display text-hero font-semibold">Welcome back, {firstName}</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Continue your journey, or ask the Guide anything. Here's what's next for you.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to={createPageUrl("Guide")}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:brightness-105"
            >
              <Sparkle className="h-4 w-4" weight="fill" /> Ask the Guide
            </Link>
            <Link
              to={createPageUrl("Directory")}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
            >
              <MapPin className="h-4 w-4" /> Browse practitioners
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-10 px-5 py-8">
        {/* Upcoming session */}
        {upcoming && (
          <Reveal className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <CalendarCheck className="h-6 w-6 text-primary" weight="duotone" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">You have an upcoming session</p>
              <p className="text-sm text-muted-foreground">
                Status: <span className="capitalize">{upcoming.status}</span>
                {upcoming.scheduled_date ? ` · ${new Date(upcoming.scheduled_date).toLocaleDateString()}` : ""}
              </p>
            </div>
            <Link to={createPageUrl("Bookings")}><span className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">View <ArrowRight className="h-3 w-3" /></span></Link>
          </Reveal>
        )}

        {/* Guided Journey */}
        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold">Your journey</h2>
              <p className="text-sm text-muted-foreground">A calm, safe path from first curiosity to integration.</p>
            </div>
            <div className="text-right">
              <span className="font-display text-2xl font-semibold text-primary">{progress}%</span>
              <p className="text-xs text-muted-foreground">complete</p>
            </div>
          </div>
          {/* progress bar */}
          <div className="mb-6 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-clay transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <Reveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {JOURNEY.map((s, i) => {
              const isDone = done[s.key];
              const isCurrent = i === currentIdx && !isDone;
              return (
                <Reveal.Item key={s.key}>
                  <Link
                    to={createPageUrl(s.page)}
                    className={`group relative flex h-full flex-col rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      isCurrent ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isDone ? "bg-success/15 text-success" : "bg-primary/10 text-primary"}`}>
                        <s.icon className="h-5 w-5" weight="duotone" />
                      </div>
                      {isDone ? (
                        <CheckCircle className="h-5 w-5 text-success" weight="fill" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step {i + 1}</span>
                      {isCurrent && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">You're here</span>}
                    </div>
                    <h3 className="mt-1 font-semibold">{s.title}</h3>
                    <p className="mt-1 flex-1 text-sm text-muted-foreground">{s.body}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Continue <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                </Reveal.Item>
              );
            })}
          </Reveal>
        </section>

        {/* Recommended practitioners */}
        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold">Recommended for you</h2>
              <p className="text-sm text-muted-foreground">Verified practitioners we'd trust.</p>
            </div>
            <Link to={createPageUrl("Guide")} className="shrink-0 text-sm font-medium text-primary hover:underline">Refine with the Guide →</Link>
          </div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
            </div>
          ) : recs.length > 0 ? (
            <Reveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recs.map((m) => {
                const p: any = m.practitioner;
                const loc = [p.address?.city, p.address?.state_province].filter(Boolean).join(", ");
                return (
                  <Reveal.Item key={p.id}>
                    <Link
                      to={createPageUrl(`PractitionerProfile?id=${p.id}`)}
                      className="group block h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="relative h-32 w-full overflow-hidden bg-muted">
                        {p.profile_image_url ? (
                          <img src={p.profile_image_url} alt={p.full_name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center"><Leaf className="h-8 w-8 text-muted-foreground" /></div>
                        )}
                        <span className="absolute right-2 top-2 rounded-full bg-card/90 px-2 py-0.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">{m.score}%</span>
                      </div>
                      <div className="p-4">
                        <p className="truncate font-semibold">{p.full_name}</p>
                        {loc && <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{loc}</p>}
                        {m.reasons?.[0] && (
                          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-warning text-warning" /> {m.reasons[0]}
                          </p>
                        )}
                      </div>
                    </Link>
                  </Reveal.Item>
                );
              })}
            </Reveal>
          ) : (
            <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">No recommendations yet — try the directory.</p>
          )}
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="mb-5 font-display text-2xl font-semibold">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.label}
                to={createPageUrl(a.page)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.tint}`}>
                  <a.icon className="h-5 w-5" weight="duotone" />
                </span>
                <span className="text-sm font-medium">{a.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
