import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSpotlight } from "@/lib/useSpotlight";
import { Spotlight } from "@/components/ui/Spotlight";
import { ShieldCheck } from "@/lib/icons";
import { computeTrustScore, trustBandColor } from "@/lib/trustScore";

/** Composite trust score display for a practitioner profile. */
export default function TrustScoreCard({ practitioner, reviews = [], credentials = [] }: { practitioner: any; reviews?: any[]; credentials?: any[] }) {
  const t = computeTrustScore(practitioner, reviews, credentials);
  const { onMouseMove } = useSpotlight();
  return (
    <Card className="group relative overflow-hidden" onMouseMove={onMouseMove}>
      <Spotlight />
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5 text-primary" weight="duotone" /> Trust Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3">
          <span className="font-display text-4xl font-semibold">{t.score}</span>
          <span className="text-sm text-muted-foreground">/ 100</span>
          <span className={`ml-auto font-semibold ${trustBandColor(t.band)}`}>{t.band}</span>
        </div>
        <div className="mt-4 space-y-2.5">
          {t.factors.map((f) => (
            <div key={f.label}>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>{f.label}</span><span>{f.points}/{f.max}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((f.points / f.max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Blends verification, reviews, experience, and verified credentials.</p>
      </CardContent>
    </Card>
  );
}
