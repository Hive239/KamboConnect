import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Practitioner } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, ArrowRight, Trophy as Crown } from "@/lib/icons";

/**
 * "Practitioner of the Month" spotlight. Picks from verified, featured-tier
 * practitioners and rotates deterministically by calendar month so the same
 * guide is highlighted for everyone all month, then rotates automatically.
 */
export default function FeaturedPractitioner() {
  const [p, setP] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = (await Practitioner.list()) as any[];
        const pool = all.filter((x) => x.is_verified && (x.listing_tier === "featured"));
        const candidates = (pool.length ? pool : all.filter((x) => x.is_verified))
          .sort((a, b) => (b.reputation_score ?? 0) - (a.reputation_score ?? 0));
        if (!candidates.length) return;
        const now = new Date();
        const monthIndex = now.getFullYear() * 12 + now.getMonth();
        const pick = candidates[monthIndex % candidates.length];
        if (!cancelled) setP(pick);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!p) return null;
  const city = p.address?.city || p.address?.country || "Amazon lineage";

  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary">
          <Crown className="h-4 w-4" weight="fill" /> Practitioner of the Month
        </span>
      </div>
      <div className="grid items-center gap-8 rounded-3xl border border-border bg-card p-6 shadow-lg md:grid-cols-[220px_1fr] md:p-8">
        <div className="mx-auto">
          {p.profile_image_url ? (
            <img src={p.profile_image_url} alt={p.full_name} className="h-48 w-48 rounded-2xl object-cover shadow-md" loading="lazy" />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-primary/10 text-5xl font-display text-primary">
              {(p.full_name || "?").charAt(0)}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-2xl font-semibold">{p.full_name}</h3>
            <Badge className="bg-amber-100 text-amber-800">Featured</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {city}</span>
            {p.years_experience ? <span>{p.years_experience} yrs experience</span> : null}
            {p.reputation_score ? (
              <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 text-amber-500" weight="fill" /> {Number(p.reputation_score).toFixed(1)}</span>
            ) : null}
          </div>
          {p.bio && <p className="line-clamp-3 text-muted-foreground">{p.bio}</p>}
          <div className="flex flex-wrap gap-1.5">
            {(p.specializations || []).slice(0, 4).map((s: string) => (
              <Badge key={s} variant="secondary">{s}</Badge>
            ))}
          </div>
          <Button asChild className="gap-2">
            <Link to={`${createPageUrl("PractitionerProfile")}?id=${p.id}`}>
              View profile <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
