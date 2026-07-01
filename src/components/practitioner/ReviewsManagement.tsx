import { useEffect, useState } from "react";
import { Review } from "@/entities/all";
import { computeReputation } from "@/lib/reputation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, MessageSquare } from "@/lib/icons";

export default function ReviewsManagement({ practitioner }: { practitioner: any }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    if (!practitioner) return;
    const r = await Review.filter({ practitioner_id: practitioner.id }, "-created_date");
    setReviews(r);
    setLoading(false);
  };
  useEffect(() => { load(); }, [practitioner?.id]);

  const reply = async (id: string) => {
    const text = (drafts[id] || "").trim();
    if (!text) return;
    setSaving(id);
    try {
      await Review.update(id, { response_text: text, response_date: new Date().toISOString() });
      setDrafts((d) => { const n = { ...d }; delete n[id]; return n; });
      await load();
    } finally { setSaving(null); }
  };

  if (loading) return <div className="py-8 text-muted-foreground">Loading reviews…</div>;
  const rep = computeReputation(reviews as any);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Star className="h-6 w-6 fill-warning text-warning" />
        </div>
        <div>
          <p className="text-2xl font-bold">{rep.score || "—"} <span className="text-sm font-normal text-muted-foreground">reputation</span></p>
          <p className="text-sm text-muted-foreground">{rep.reviewCount} reviews · {Math.round(rep.recommendRate * 100)}% recommend</p>
        </div>
      </div>

      {reviews.length === 0 && <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">No reviews yet.</div>}

      {reviews.map((r) => (
        <Card key={r.id}>
          <CardContent className="p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-medium">{r.reviewer_name}</span>
              {r.verified_client && <Badge variant="verified" className="gap-1"><CheckCircle className="h-3 w-3" weight="fill" /> Verified</Badge>}
              <span className="ml-auto flex items-center gap-0.5 text-sm">{r.overall_rating}<Star className="h-3.5 w-3.5 fill-warning text-warning" /></span>
            </div>
            <p className="text-sm text-muted-foreground">{r.review_text}</p>

            {r.response_text ? (
              <div className="mt-3 rounded-lg border-l-2 border-primary bg-primary/5 p-3">
                <p className="mb-1 text-xs font-semibold text-primary">Your response</p>
                <p className="text-sm">{r.response_text}</p>
              </div>
            ) : (
              <div className="mt-3">
                <Textarea
                  placeholder="Write a public response…"
                  value={drafts[r.id] || ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                  className="min-h-[70px] resize-none"
                />
                <Button size="sm" className="mt-2 gap-2" disabled={saving === r.id || !(drafts[r.id] || "").trim()} onClick={() => reply(r.id)}>
                  <MessageSquare className="h-4 w-4" weight="duotone" /> {saving === r.id ? "Posting…" : "Post response"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
