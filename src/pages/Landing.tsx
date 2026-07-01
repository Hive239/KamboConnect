import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Practitioner } from "@/entities/all";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Leaf, MapPin, ShieldCheck, MessageSquare, Star, ArrowRight, Sparkle } from "@/lib/icons";
import { useSeo } from "@/lib/useSeo";
import { ThemeProvider } from "next-themes";

const STEPS = [
  { icon: MapPin, title: "Find a practitioner", body: "Search verified Kambo practitioners near you on the directory and map." },
  { icon: MessageSquare, title: "Request a consultation", body: "Message and book a free consultation to make sure it's the right fit." },
  { icon: ShieldCheck, title: "Book safely", body: "Complete a health screening and sign an informed-consent waiver before every session." },
];

export default function Landing() {
  useSeo({
    title: "KamboConnect — Find trusted Kambo practitioners",
    description: "Discover verified Kambo practitioners near you. Consult, book safely with health screening and informed consent, and connect with a supportive community.",
    type: "website",
  });
  const [featured, setFeatured] = useState<any[]>([]);

  useEffect(() => {
    Practitioner.list("-created_date", 6).then((list: any[]) =>
      setFeatured(list.filter((p) => p.is_verified).slice(0, 3)),
    ).catch(() => setFeatured([]));
  }, []);

  return (
    <ThemeProvider attribute="class" forcedTheme="light">
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between p-5">
        <span className="flex items-center gap-2 font-display text-xl font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10"><Leaf className="h-5 w-5 text-primary" weight="duotone" /></span>
          <span className="bg-gradient-to-r from-primary to-clay bg-clip-text text-transparent">KamboConnect</span>
        </span>
        <div className="flex items-center gap-2">
          <Link to={createPageUrl("Directory")}><Button variant="ghost">Explore</Button></Link>
          <Link to="/Auth"><Button>Sign in</Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-5 py-16 text-center sm:py-24">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
          <Sparkle className="h-4 w-4 text-primary" weight="fill" /> Safe, verified, community-driven
        </div>
        <h1 className="font-display text-4xl font-semibold leading-tight sm:text-6xl">
          Find a <span className="bg-gradient-to-r from-primary to-clay bg-clip-text text-transparent">trusted Kambo</span> practitioner
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Discover verified practitioners near you, request a consultation, and book with confidence — with health
          screening and an informed-consent waiver built into every session.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to={createPageUrl("Directory")}><Button size="lg" className="gap-2">Find a practitioner <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link to="/Auth"><Button size="lg" variant="outline">Join free</Button></Link>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Are you a practitioner? <Link to="/Auth" className="text-primary hover:underline">List your practice</Link>.
        </p>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-5 py-12">
        <h2 className="mb-8 text-center font-display text-2xl font-semibold">How it works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><s.icon className="h-6 w-6 text-primary" weight="duotone" /></div>
              <h3 className="mb-1 font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured practitioners */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-5xl px-5 py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold">Featured practitioners</h2>
            <Link to={createPageUrl("Directory")} className="text-sm text-primary hover:underline">See all →</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {featured.map((p) => (
              <Link key={p.id} to={createPageUrl(`PractitionerProfile?id=${p.id}`)} className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
                <div className="flex items-center gap-3">
                  {p.profile_image_url
                    ? <img loading="lazy" src={p.profile_image_url} alt={p.full_name} className="h-12 w-12 rounded-full object-cover" />
                    : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><Leaf className="h-6 w-6 text-muted-foreground" /></div>}
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.full_name}</p>
                    {p.address && <p className="truncate text-xs text-muted-foreground">{[p.address.city, p.address.state_province].filter(Boolean).join(", ")}</p>}
                  </div>
                </div>
                {p.bio && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.bio}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto my-12 max-w-4xl px-5">
        <div className="rounded-3xl bg-gradient-to-r from-primary to-clay p-10 text-center text-primary-foreground">
          <h2 className="font-display text-3xl font-semibold">Ready to begin?</h2>
          <p className="mx-auto mt-2 max-w-xl opacity-90">Join a safe, supportive community for Kambo practice.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/Auth"><Button size="lg" variant="secondary">Create your account</Button></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-4 px-5">
          <Link to={createPageUrl("Directory")} className="hover:text-foreground">Directory</Link>
          <Link to={createPageUrl("Events")} className="hover:text-foreground">Events</Link>
          <Link to={createPageUrl("Community")} className="hover:text-foreground">Community</Link>
          <Link to={createPageUrl("Disclaimer")} className="hover:text-foreground">Legal</Link>
          <span>© {new Date().getFullYear()} KamboConnect</span>
        </div>
      </footer>
    </div>
    </ThemeProvider>
  );
}
