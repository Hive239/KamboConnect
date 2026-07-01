import { useState, useMemo } from "react";
import { Practitioner, Review } from "@/entities/all";
import { scoreMatches } from "@/integrations/Matchmaking";
import type { MatchResult, MatchPrefs } from "@/lib/matchScore";
import { getCurrentLocation } from "@/components/utils/locationUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import PractitionerCard from "@/components/directory/PractitionerCard";
import PractitionerModal from "@/components/directory/PractitionerModal";
import { Sparkle, CheckCircle, Crosshair, ArrowRight, ArrowLeft, MapPin } from "@/lib/icons";
import { useSeo } from "@/lib/useSeo";

const MODALITIES = ["Traditional Kambo", "Sananga", "Hapé / Rapé", "Integration Coaching", "Group Circles", "Women’s Circles", "Trauma-Informed", "Microdosing Guidance"];
const LANGUAGES = ["English", "Spanish", "Portuguese", "French"];

export default function Matchmaking() {
  useSeo({ title: "Find Your Match — KamboConnect", description: "Answer a few questions and we'll match you with trusted Kambo practitioners." });
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<MatchPrefs>({ modalities: [], languages: [], maxPrice: 3, requireVerified: true, preferOnline: false, experienceLevel: "any", maxDistance: 100 });
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  const toggle = (key: "modalities" | "languages", v: string) =>
    setPrefs((p) => {
      const arr = new Set(p[key] || []);
      arr.has(v) ? arr.delete(v) : arr.add(v);
      return { ...p, [key]: [...arr] };
    });

  const ratingFor = useMemo(() => {
    const byPrac: Record<string, number[]> = {};
    reviews.forEach((r) => { (byPrac[r.practitioner_id] ||= []).push(r.overall_rating ?? r.rating ?? 0); });
    return (p: any) => { const xs = byPrac[p.id] || []; return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0; };
  }, [reviews]);

  const useMyLocation = async () => {
    try { const loc = await getCurrentLocation(); setPrefs((p) => ({ ...p, location: { latitude: loc.latitude, longitude: loc.longitude } })); } catch { /* denied */ }
  };

  const runMatch = async () => {
    setLoading(true);
    setStep(3);
    const [pracs, revs] = await Promise.all([Practitioner.list("-created_date"), Review.list("-created_date")]);
    setReviews(revs);
    const rOf = (p: any) => { const xs = revs.filter((r: any) => r.practitioner_id === p.id); return xs.length ? xs.reduce((a: number, r: any) => a + (r.overall_rating ?? r.rating ?? 0), 0) / xs.length : 0; };
    const matched = await scoreMatches(prefs, pracs.filter((p: any) => p.is_verified || !prefs.requireVerified), rOf);
    setResults(matched.slice(0, 12));
    setLoading(false);
  };

  const priceLabels = ["$", "$$", "$$$", "$$$$"];

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Sparkle className="h-6 w-6 text-primary" weight="duotone" />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Find your match</h1>
        <p className="mt-1 text-muted-foreground">A few questions to connect you with the right practitioner.</p>
      </div>

      {!results && (
        <Card className="mx-auto max-w-2xl">
          <CardContent className="p-6 sm:p-8">
            {step === 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">What are you drawn to?</h2>
                <p className="text-sm text-muted-foreground">Select the practices that interest you.</p>
                <div className="flex flex-wrap gap-2">
                  {MODALITIES.map((m) => (
                    <button key={m} onClick={() => toggle("modalities", m)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${prefs.modalities?.includes(m) ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </section>
            )}
            {step === 1 && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold">Languages</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {LANGUAGES.map((l) => (
                      <button key={l} onClick={() => toggle("languages", l)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${prefs.languages?.includes(l) ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Budget</h2>
                    <span className="font-medium text-primary">up to {priceLabels[prefs.maxPrice ?? 3]}</span>
                  </div>
                  <Slider className="mt-4" min={0} max={3} step={1} value={[prefs.maxPrice ?? 3]} onValueChange={([v]) => setPrefs((p) => ({ ...p, maxPrice: v }))} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Experience level</h2>
                  <div className="mt-3 flex gap-2">
                    {(["any", "some", "master"] as const).map((e) => (
                      <button key={e} onClick={() => setPrefs((p) => ({ ...p, experienceLevel: e }))}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-colors ${prefs.experienceLevel === e ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>
                        {e === "any" ? "Any" : e === "some" ? "Experienced" : "Master"}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}
            {step === 2 && (
              <section className="space-y-5">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Verified practitioners only</p>
                    <p className="text-sm text-muted-foreground">Recommended for safety.</p>
                  </div>
                  <Switch checked={!!prefs.requireVerified} onCheckedChange={(v) => setPrefs((p) => ({ ...p, requireVerified: v }))} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Open to online sessions</p>
                    <p className="text-sm text-muted-foreground">Connect with practitioners anywhere.</p>
                  </div>
                  <Switch checked={!!prefs.preferOnline} onCheckedChange={(v) => setPrefs((p) => ({ ...p, preferOnline: v }))} />
                </div>
                <Button variant="outline" className="w-full gap-2" onClick={useMyLocation}>
                  <Crosshair className="h-4 w-4" weight="duotone" />
                  {prefs.location ? "Location added ✓" : "Use my location for nearby matches"}
                </Button>
              </section>
            )}

            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => <span key={i} className={`h-1.5 w-6 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />)}
              </div>
              {step < 2 ? (
                <Button onClick={() => setStep((s) => s + 1)} className="gap-2">Next <ArrowRight className="h-4 w-4" /></Button>
              ) : (
                <Button onClick={runMatch} className="gap-2"><Sparkle className="h-4 w-4" weight="fill" /> Find matches</Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="py-20 text-center text-muted-foreground">
          <Sparkle className="mx-auto mb-3 h-8 w-8 animate-pulse text-primary" weight="duotone" />
          Finding your best matches…
        </div>
      )}

      {results && !loading && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{results.length} matches for you</h2>
            <Button variant="outline" size="sm" onClick={() => { setResults(null); setStep(0); }}>Refine</Button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map(({ practitioner, score, reasons }) => (
              <div key={practitioner.id} className="space-y-2">
                <div className="relative">
                  <PractitionerCard practitioner={practitioner} averageRating={ratingFor(practitioner).toFixed(1)} reviewCount={reviews.filter((r) => r.practitioner_id === practitioner.id).length} onClick={() => setSelected(practitioner)} size="large" />
                  <Badge variant="premium" className="absolute -top-2 -right-2 z-10 shadow">{score}% match</Badge>
                </div>
                {reasons.length > 0 && (
                  <ul className="space-y-1 px-1">
                    {reasons.slice(0, 3).map((r, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 text-success" weight="fill" /> {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <PractitionerModal
          practitioner={selected}
          reviews={reviews.filter((r) => r.practitioner_id === selected.id)}
          averageRating={ratingFor(selected).toFixed(1)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
