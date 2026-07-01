import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Practitioner } from "@/entities/all";
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

const ROTATING = ["trusted", "verified", "caring", "local"];

const STEPS = [
  { icon: MapPin, title: "Find a guide", body: "Search verified Kambo practitioners near you on the directory and map — or let the Guide match you." },
  { icon: MessageSquare, title: "Request a consultation", body: "Message and book a free consultation to make sure it's the right fit for you." },
  { icon: ShieldCheck, title: "Book safely", body: "Complete a health screening and sign an informed-consent waiver before every session." },
];

const STATS = [
  { icon: Users, value: 480, suffix: "+", label: "Verified practitioners" },
  { icon: CalendarCheck, value: 12000, suffix: "+", label: "Sessions guided" },
  { icon: Star, value: 4.9, decimals: 1, label: "Average rating" },
  { icon: MapPin, value: 60, suffix: "+", label: "Cities & regions" },
];

const TESTIMONIALS = [
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

function Stat({ stat }: { stat: (typeof STATS)[number] }) {
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

  useEffect(() => {
    Practitioner.list("-created_date", 12)
      .then((list: any[]) => setFeatured(list.filter((p) => p.is_verified).slice(0, 8)))
      .catch(() => setFeatured([]));
  }, []);

  const avatars = featured.filter((p) => p.profile_image_url).slice(0, 5);

  return (
    <ThemeProvider attribute="class" forcedTheme="light">
      <div className="min-h-screen bg-background text-foreground">
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
        <section className="relative overflow-hidden grain">
          <GradientMesh intensity="soft" />
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
            </div>

            {/* Floating verified-practitioner avatars */}
            <div className="relative hidden h-[420px] lg:block">
              <div className="absolute inset-0 rounded-[2rem] border border-border/70 bg-card/40 backdrop-blur-sm" />
              {avatars.map((p, idx) => {
                const positions = [
                  "left-6 top-8 h-24 w-24",
                  "right-8 top-16 h-28 w-28",
                  "left-16 bottom-14 h-28 w-28",
                  "right-14 bottom-8 h-20 w-20",
                  "left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2",
                ];
                return (
                  <motion.div
                    key={p.id}
                    initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + idx * 0.12, type: "spring", stiffness: 260, damping: 20 }}
                    className={`absolute ${positions[idx]} ${reduce ? "" : "animate-float-slow"} overflow-hidden rounded-2xl border-2 border-card shadow-lg`}
                    style={{ animationDelay: `${idx * -1.5}s` }}
                  >
                    <img src={p.profile_image_url} alt={p.full_name} className="h-full w-full object-cover" loading="lazy" />
                  </motion.div>
                );
              })}
              <div className="absolute right-6 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-md">
                <span className="flex h-2 w-2 rounded-full bg-success" /> Verified nearby
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Stats ---------- */}
        <section className="border-y border-border bg-card/50">
          <Reveal stagger className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-5 py-12 md:grid-cols-4">
            {STATS.map((s) => (
              <Reveal.Item key={s.label}><Stat stat={s} /></Reveal.Item>
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
                <div className="group relative h-full rounded-2xl border border-border bg-card p-7 shadow-sm transition-shadow duration-300 hover:shadow-lg">
                  <span className="absolute right-5 top-5 font-display text-4xl font-semibold text-primary/10">{i + 1}</span>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                    <s.icon className="h-6 w-6 text-primary" weight="duotone" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </Reveal.Item>
            ))}
          </Reveal>
        </section>

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

        {/* ---------- Testimonials marquee ---------- */}
        <section className="overflow-hidden py-20">
          <Reveal className="mb-10 text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">Loved by the community</span>
            <h2 className="mt-1 font-display text-display font-semibold">Words from the journey</h2>
          </Reveal>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
            <div className={`flex w-max gap-5 ${reduce ? "" : "animate-marquee"}`}>
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
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

        {/* ---------- Trust & safety band ---------- */}
        <section className="mx-auto max-w-5xl px-5 pb-8">
          <Reveal stagger className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Verified practitioners", body: "Credentials reviewed before a profile goes live." },
              { icon: Heart, title: "Screening & consent", body: "Health screening and an informed-consent waiver on every booking." },
              { icon: Users, title: "Supportive community", body: "Learn, share, and integrate with people on the same path." },
            ].map((f) => (
              <Reveal.Item key={f.title}>
                <div className="flex h-full items-start gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" weight="duotone" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
                  </div>
                </div>
              </Reveal.Item>
            ))}
          </Reveal>
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
              <Link to={createPageUrl("Education")} className="hover:text-foreground">Learn</Link>
              <Link to={createPageUrl("Disclaimer")} className="hover:text-foreground">Legal</Link>
            </div>
            <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} KamboGuide</span>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
