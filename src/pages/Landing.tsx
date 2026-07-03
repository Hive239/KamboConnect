import { useEffect, useRef, useState, Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Practitioner, Review, Booking } from "@/entities/all";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  Leaf, MapPin, ShieldCheck, MessageSquare, Star, ArrowRight, Sparkle,
  Users, CalendarCheck, CheckCircle, Heart,
} from "@/lib/icons";
import { useSeo } from "@/lib/useSeo";
import { ThemeProvider } from "next-themes";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { Grain } from "@/components/ui/Grain";
import { Reveal } from "@/components/ui/Reveal";
import { Magnetic } from "@/components/ui/Magnetic";
import {
  Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext,
} from "@/components/ui/carousel";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

// Lazy so leaflet stays out of the eagerly-imported Landing bundle.
const HeroMap = lazy(() => import("@/components/landing/HeroMap"));
import FeaturedPractitioner from "@/components/landing/FeaturedPractitioner";

const MODALITIES = [
  "Kambo ceremonies", "Rapé & Hapé", "Sananga", "Integration support",
  "Online consultations", "Group circles", "Aftercare", "Breathwork",
];

const FAQS = [
  { q: "Is Kambo safe?", a: "For healthy adults with a trained practitioner, Kambo is generally well-tolerated — but it isn't right for everyone. Every booking here includes a health screening and informed-consent waiver, and our Guide can walk you through contraindications before you commit." },
  { q: "How do I find the right practitioner?", a: "Browse the directory and map, or let the Guide match you based on location, modality, language, and budget. Every verified practitioner has reviewed credentials." },
  { q: "What does a session cost?", a: "Pricing varies by practitioner and region. Most offer a free initial consultation so you can find the right fit before booking a paid session." },
  { q: "Do I have to pay to join?", a: "No — creating an account is free for seekers. Practitioners can list a basic profile free and upgrade for more visibility." },
  { q: "Is my information private?", a: "Yes. Health-[100dvh]ing answers are shared only with the practitioner you book, and you control what's on your public profile." },
];

const ROTATING = ["trusted", "verified", "caring", "local"];

const STEPS = [
  { icon: MapPin, title: "Find a guide", body: "Search verified Kambo practitioners near you on the directory and map — or let the Guide match you.", page: "Directory" },
  { icon: MessageSquare, title: "Request a consultation", body: "Message and book a free consultation to make sure it's the right fit for you.", page: "Guide" },
  { icon: ShieldCheck, title: "Book safely", body: "Complete a health screening and sign an informed-consent waiver before every session.", page: "Education" },
];

type StatItem = { icon: any; value: number; suffix?: string; decimals?: number; label: string };

// Fallback quotes shown only until real reviews load (or if there aren't ≥3 yet).
const FALLBACK_TESTIMONIALS = [
  { quote: "I finally found a practitioner I trust — the screening made me feel genuinely safe.", name: "Amara R.", role: "Client" },
  { quote: "Booking, consent, and follow-up all in one calm place. This is how it should be.", name: "Daniel K.", role: "Client" },
  { quote: "As a practitioner, my verified profile brought me serious, prepared clients.", name: "Sofía M.", role: "Practitioner" },
  { quote: "The Guide answered every safety question before I ever booked. Incredible.", name: "Priya N.", role: "Client" },
  { quote: "Warm, professional, and safe. The community is the real gift.", name: "Leo T.", role: "Client" },
];

/** count-up on mount; respects reduced motion. */
function useCountUp(target: number, decimals = 0, duration = 1400) {
  const reduce = useReducedMotion();
  const [val, setVal] = useState(reduce ? target : 0);
  const started = useRef(false);
  useEffect(() => {
    if (reduce || started.current) return;
    started.current = true;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduce]);
  const display = val >= 1000 ? `${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}k` : val.toFixed(decimals);
  return display;
}

function Stat({ stat }: { stat: StatItem }) {
  const display = useCountUp(stat.value, stat.decimals ?? 0);
  const Icon = stat.icon;
  return (
    <div className="flex flex-col items-center text-center">
      <Icon className="mb-2 h-6 w-6 text-primary" weight="duotone" />
      <div className="font-display text-3xl font-semibold sm:text-4xl">
        {display}
        {stat.suffix ?? ""}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
    </div>
  );
}

function RotatingWord() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setI((n) => (n + 1) % ROTATING.length), 2200);
    return () => clearInterval(id);
  }, [reduce]);
  return (
    <span className="relative inline-block align-baseline">
      <AnimatePresence mode="wait">
        <motion.span
          key={ROTATING[i]}
          initial={reduce ? false : { y: "0.5em", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? undefined : { y: "-0.5em", opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-gradient-brand inline-block"
        >
          {ROTATING[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function Landing() {
  useSeo({
    title: "KamboGuide — Find trusted Kambo practitioners",
    description:
      "Discover verified Kambo practitioners near you. Consult, book safely with health screening and informed consent, and connect with a supportive community.",
    type: "website",
  });
  const reduce = useReducedMotion();
  const [featured, setFeatured] = useState<any[]>([]);
  const [mapPins, setMapPins] = useState<any[]>([]);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [testimonials, setTestimonials] = useState<typeof FALLBACK_TESTIMONIALS>([]);

  // All landing data is pulled live from the same entities the app uses.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [practitioners, reviews, bookings] = await Promise.all([
        Practitioner.list("-created_date").catch(() => []),
        Review.list("-created_date").catch(() => []),
        Booking.list("-created_date").catch(() => []),
      ]);
      if (cancelled) return;

      const verified = (practitioners as any[]).filter((p) => p.is_verified);
      setFeatured(verified.slice(0, 8));
      setMapPins((practitioners as any[]).filter((p) => p.latitude && p.longitude));

      const ratings = (reviews as any[]).map((r) => r.overall_rating ?? r.rating ?? 0).filter((n) => n > 0);
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      const cities = new Set((practitioners as any[]).map((p) => p.address?.city).filter(Boolean));
      const sessions = (bookings as any[]).length || (reviews as any[]).length;

      const computed: StatItem[] = [
        { icon: Users, value: verified.length, label: "Verified practitioners" },
        { icon: CalendarCheck, value: sessions, label: (bookings as any[]).length ? "Sessions booked" : "Community reviews" },
        ...(avg > 0 ? [{ icon: Star, value: Number(avg.toFixed(1)), decimals: 1, label: "Average rating" } as StatItem] : []),
        { icon: MapPin, value: cities.size, label: "Cities & regions" },
      ].filter((s) => s.value > 0);
      setStats(computed);

      const real = (reviews as any[])
        .filter((r) => (r.review_text || "").trim().length > 24 && (r.overall_rating ?? 0) >= 4 && r.reviewer_name)
        .slice(0, 6)
        .map((r) => ({ quote: r.review_text as string, name: r.reviewer_name as string, role: "Verified client" }));
      setTestimonials(real); // real reviews only — section hides when there are none
    })();
    return () => { cancelled = true; };
  }, []);

  const avatars = featured.filter((p) => p.profile_image_url).slice(0, 5);

  return (
    <ThemeProvider attribute="class" forcedTheme="light">
      <div className="min-h-[100dvh] bg-background text-foreground">
        {/* ---------- Top bar ---------- */}
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
            <span className="flex items-center gap-2 font-display text-xl font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Leaf className="h-5 w-5 text-primary" weight="duotone" />
              </span>
              <span className="text-gradient-brand">KamboGuide</span>
            </span>
            <div className="flex items-center gap-2">
              <Link to={createPageUrl("Directory")}><Button variant="ghost">Explore</Button></Link>
              <Link to="/Auth"><Button>Sign in</Button></Link>
            </div>
          </div>
        </header>

        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden">
          <GradientMesh intensity="vivid" />
          <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:py-28 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="text-center lg:text-left">
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur lg:mx-0"
              >
                <Sparkle className="h-4 w-4 text-primary" weight="fill" /> Safe, verified, community-driven
              </motion.div>
              <h1 className="font-display text-display-lg font-semibold text-balance">
                Find a <RotatingWord /> Kambo practitioner
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground text-pretty lg:mx-0">
                Discover verified practitioners near you, request a consultation, and book with confidence —
                with health screening and an informed-consent waiver built into every session.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Magnetic>
                  <Link to={createPageUrl("Directory")}>
                    <Button size="xl" className="gap-2">Find a practitioner <ArrowRight className="h-4 w-4" /></Button>
                  </Link>
                </Magnetic>
                <Link to="/Auth"><Button size="xl" variant="outline">Join free</Button></Link>
              </div>
              <p className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground lg:justify-start">
                <ShieldCheck className="h-4 w-4 text-success" weight="duotone" />
                Screening &amp; consent on every booking
              </p>

              {/* Social proof row */}
              <div className="mt-7 flex items-center justify-center gap-3 lg:justify-start">
                {avatars.length > 0 && (
                  <div className="flex -space-x-2.5">
                    {avatars.slice(0, 4).map((p) => (
                      <img key={p.id} src={p.profile_image_url} alt="" loading="lazy" className="h-9 w-9 rounded-full border-2 border-background object-cover shadow-sm" />
                    ))}
                  </div>
                )}
                <div className="text-left">
                  <div className="flex items-center gap-0.5 text-warning">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-warning" weight="fill" />)}
                  </div>
                  <p className="text-xs text-muted-foreground">Trusted by a growing community of seekers</p>
                </div>
              </div>
            </div>

            {/* Live map of verified practitioners */}
            <div className="relative hidden h-[440px] lg:block">
              <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-border/70 shadow-xl">
                <Suspense fallback={<div className="h-full w-full shimmer" />}>
                  <HeroMap practitioners={mapPins} />
                </Suspense>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/15 to-transparent" />
              </div>
              {/* live count pill */}
              <div className="pointer-events-none absolute left-4 top-4 z-[500] flex items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                {mapPins.length > 0 ? `${mapPins.length} verified nearby` : "Verified nearby"}
              </div>
              {/* open full map */}
              <Link
                to={createPageUrl("Map")}
                className="absolute bottom-4 right-4 z-[500] inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105"
              >
                Open full map <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- Stats (live from the database) ---------- */}
        {stats.length > 0 && (
          <section className="border-y border-border bg-card/50">
            <div className="mx-auto max-w-5xl px-5 pt-10 text-center">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                Live from KamboGuide
              </span>
            </div>
            <Reveal stagger className={`mx-auto grid max-w-5xl grid-cols-2 gap-8 px-5 pb-12 pt-8 ${stats.length >= 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
              {stats.map((s) => (
                <Reveal.Item key={s.label}><Stat stat={s} /></Reveal.Item>
              ))}
            </Reveal>
          </section>
        )}

        {/* ---------- What you'll find ---------- */}
        <section className="mx-auto max-w-5xl px-5 pt-16 text-center">
          <Reveal>
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">What you'll find</span>
            <h2 className="mt-1 font-display text-hero font-semibold">Guidance for every step of the path</h2>
          </Reveal>
          <Reveal stagger step={0.05} className="mt-6 flex flex-wrap justify-center gap-2.5">
            {MODALITIES.map((m) => (
              <Reveal.Item key={m}>
                <Link
                  to={`${createPageUrl("Directory")}?q=${encodeURIComponent(m.split(" ")[0])}`}
                  className="inline-block rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-md"
                >
                  {m}
                </Link>
              </Reveal.Item>
            ))}
          </Reveal>
        </section>

        {/* ---------- How it works ---------- */}
        <section className="mx-auto max-w-5xl px-5 py-20">
          <Reveal className="mb-3 text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">How it works</span>
          </Reveal>
          <Reveal className="mb-12 text-center">
            <h2 className="font-display text-display font-semibold text-balance">Three calm steps to a safe session</h2>
          </Reveal>
          <Reveal stagger step={0.12} className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal.Item key={s.title}>
                <Link to={createPageUrl(s.page)} className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <span className="absolute right-5 top-5 font-display text-4xl font-semibold text-primary/10">{i + 1}</span>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                    <s.icon className="h-6 w-6 text-primary" weight="duotone" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Start here <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </Reveal.Item>
            ))}
          </Reveal>
        </section>

        {/* ---------- Our roots: the Matsés & the frog ---------- */}
        <section className="border-y border-border bg-[#0b3a2a] py-20 text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-2">
            <Reveal>
              <div className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10">
                <img
                  src="/images/frog-bicolor-1.jpg"
                  alt="Phyllomedusa bicolor, the giant monkey tree frog, source of Kambo"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </Reveal>
            <Reveal className="space-y-5">
              <span className="text-sm font-semibold uppercase tracking-widest text-white/70">Our roots</span>
              <h2 className="font-display text-display font-semibold text-balance">Honoring tradition. Serving Kambo safely.</h2>
              <p className="text-lg text-white/80 text-pretty">
                Kambo comes from the secretion of the giant monkey tree frog, <em>Phyllomedusa bicolor</em>, native to the
                upper Amazon. For generations the <strong>Matsés</strong> and neighboring peoples have kept this tradition —
                ethically gathering the secretion without harming the frog, which is returned safely to the forest.
              </p>
              <ul className="space-y-3">
                {[
                  { t: "Direct connection to the Matsés", b: "We honor the lineage and the people who carry it." },
                  { t: "Giving back to the tribe", b: "A share of proceeds is dedicated to the Matsés community." },
                  { t: "Protecting the frog & its forest", b: "Supporting Phyllomedusa bicolor habitat conservation." },
                ].map((r) => (
                  <li key={r.t} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-white" weight="duotone" />
                    <span><strong>{r.t}.</strong> <span className="text-white/75">{r.b}</span></span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-4 pt-2">
                <img src="/images/frog-bicolor-2.jpg" alt="Giant monkey frogs in the Amazon" className="h-20 w-28 rounded-xl object-cover ring-1 ring-white/15" loading="lazy" />
                <img src="/images/frog-bicolor-3.png" alt="Phyllomedusa bicolor on a branch" className="h-20 w-28 rounded-xl object-cover ring-1 ring-white/15" loading="lazy" />
                <p className="text-xs text-white/60">Educational & cultural information only — not medical advice.</p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------- Practitioner of the Month ---------- */}
        <FeaturedPractitioner />

        {/* ---------- Featured practitioners ---------- */}
        {featured.length > 0 && (
          <section className="relative overflow-hidden border-y border-border bg-secondary/40 py-20 grain">
            <div className="relative z-10 mx-auto max-w-6xl px-5">
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <span className="text-sm font-semibold uppercase tracking-widest text-primary">Featured</span>
                  <h2 className="mt-1 font-display text-display font-semibold">Meet trusted guides</h2>
                </div>
                <Link to={createPageUrl("Directory")} className="shrink-0 text-sm font-medium text-primary hover:underline">
                  See all →
                </Link>
              </div>
              <Carousel opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent className="-ml-4">
                  {featured.map((p) => (
                    <CarouselItem key={p.id} className="basis-[78%] pl-4 sm:basis-1/2 lg:basis-1/3">
                      <Link
                        to={createPageUrl(`PractitionerProfile?id=${p.id}`)}
                        className="group block h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div className="relative h-48 w-full overflow-hidden bg-muted">
                          {p.profile_image_url ? (
                            <img
                              src={p.profile_image_url}
                              alt={p.full_name}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center"><Leaf className="h-10 w-10 text-muted-foreground" /></div>
                          )}
                          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur">
                            <CheckCircle className="h-3.5 w-3.5 text-success" weight="fill" /> Verified
                          </span>
                        </div>
                        <div className="p-5">
                          <p className="truncate font-semibold">{p.full_name}</p>
                          {p.address && (
                            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" /> {[p.address.city, p.address.state_province].filter(Boolean).join(", ")}
                            </p>
                          )}
                          {p.bio && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.bio}</p>}
                        </div>
                      </Link>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
              </Carousel>
            </div>
          </section>
        )}

        {/* ---------- Testimonials marquee (only real reviews) ---------- */}
        {testimonials.length > 0 && (
        <section className="overflow-hidden py-20">
          <Reveal className="mb-10 text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">Loved by the community</span>
            <h2 className="mt-1 font-display text-display font-semibold">Words from the journey</h2>
          </Reveal>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
            <div className={`flex w-max gap-5 ${reduce ? "" : "animate-marquee"}`}>
              {[...testimonials, ...testimonials].map((t, i) => (
                <figure key={i} className="w-[340px] shrink-0 rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-3 flex gap-0.5 text-warning">
                    {Array.from({ length: 5 }).map((_, s) => <Star key={s} className="h-4 w-4 fill-warning" weight="fill" />)}
                  </div>
                  <blockquote className="text-sm leading-relaxed text-foreground">"{t.quote}"</blockquote>
                  <figcaption className="mt-4 text-sm">
                    <span className="font-semibold">{t.name}</span>
                    <span className="text-muted-foreground"> · {t.role}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* ---------- Trust & safety band ---------- */}
        <section className="mx-auto max-w-5xl px-5 pb-8">
          <Reveal stagger className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Verified practitioners", body: "Credentials reviewed before a profile goes live.", page: "Directory" },
              { icon: Heart, title: "Screening & consent", body: "Health screening and an informed-consent waiver on every booking.", page: "Education" },
              { icon: Users, title: "Supportive community", body: "Learn, share, and integrate with people on the same path.", page: "Community" },
            ].map((f) => (
              <Reveal.Item key={f.title}>
                <Link to={createPageUrl(f.page)} className="group flex h-full items-start gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                    <f.icon className="h-5 w-5 text-primary" weight="duotone" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
                  </div>
                </Link>
              </Reveal.Item>
            ))}
          </Reveal>
        </section>

        {/* ---------- FAQ ---------- */}
        <section className="mx-auto max-w-3xl px-5 py-20">
          <Reveal className="mb-8 text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">Questions</span>
            <h2 className="mt-1 font-display text-display font-semibold">Good to know</h2>
          </Reveal>
          <Reveal>
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-border">
                  <AccordionTrigger className="text-left font-medium hover:no-underline">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Still curious?{" "}
            <Link to={createPageUrl("Guide")} className="font-medium text-primary hover:underline">Ask the Guide →</Link>
          </p>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="mx-auto my-16 max-w-5xl px-5">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-clay p-12 text-center text-primary-foreground shadow-xl grain">
            <Reveal className="relative z-10">
              <h2 className="font-display text-display font-semibold text-balance">Ready to begin your journey?</h2>
              <p className="mx-auto mt-3 max-w-xl text-lg opacity-90 text-pretty">
                Join a safe, supportive community for Kambo practice — as a seeker or a practitioner.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/Auth"><Button size="xl" variant="secondary">Create your account</Button></Link>
                <Link to={createPageUrl("Directory")}>
                  <Button size="xl" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                    Browse practitioners
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------- Footer ---------- */}
        <footer className="border-t border-border py-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 sm:flex-row sm:justify-between">
            <span className="flex items-center gap-2 font-display text-lg font-semibold">
              <Leaf className="h-5 w-5 text-primary" weight="duotone" />
              <span className="text-gradient-brand">KamboGuide</span>
            </span>
            <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground">
              <Link to={createPageUrl("Directory")} className="hover:text-foreground">Directory</Link>
              <Link to={createPageUrl("Events")} className="hover:text-foreground">Events</Link>
              <Link to={createPageUrl("Community")} className="hover:text-foreground">Community</Link>
              <Link to={createPageUrl("Learn")} className="hover:text-foreground">Learn</Link>
              <Link to={createPageUrl("Disclaimer")} className="hover:text-foreground">Legal</Link>
              <Link to={createPageUrl("Privacy")} className="hover:text-foreground">Privacy</Link>
              <Link to={createPageUrl("Terms")} className="hover:text-foreground">Terms</Link>
            </div>
            <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} KamboGuide</span>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
