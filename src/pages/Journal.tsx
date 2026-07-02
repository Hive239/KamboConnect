import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { User, JournalEntry } from "@/entities/all";
import { useSeo } from "@/lib/useSeo";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkle, BookOpen, Heart, Loader2, CheckCircle, Trash2 } from "@/lib/icons";
import { toast } from "sonner";
import { format } from "date-fns";

type Kind = "intention" | "reflection" | "checkin";

const KINDS: { key: Kind; label: string; icon: any; blurb: string }[] = [
  { key: "intention", label: "Intention", icon: Sparkle, blurb: "Set an intention before your session." },
  { key: "reflection", label: "Reflection", icon: BookOpen, blurb: "Reflect and integrate afterward." },
  { key: "checkin", label: "Check-in", icon: Heart, blurb: "Track how you're feeling over time." },
];

const PROMPTS: Record<Kind, string[]> = {
  intention: [
    "What are you hoping to release or receive?",
    "What's calling you to this work right now?",
    "How do you want to feel afterward?",
  ],
  reflection: [
    "What arose during your session?",
    "What are you integrating this week?",
    "What are you grateful for from the experience?",
  ],
  checkin: [
    "How is your body feeling today?",
    "What's your energy and mood right now?",
    "What support do you need this week?",
  ],
};

export default function Journal() {
  useSeo({ title: "Journal & Integration — KamboGuide", description: "Set intentions, reflect, and track your well-being through your Kambo journey." });
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialKind = (params.get("kind") as Kind) || "reflection";
  const bookingId = params.get("booking_id") || undefined;

  const [user, setUser] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<Kind>(initialKind);
  const [prompt, setPrompt] = useState(PROMPTS[initialKind][0]);
  const [body, setBody] = useState("");
  const [wellbeing, setWellbeing] = useState(0);
  const [saving, setSaving] = useState(false);

  const deleteEntry = async (e: any) => {
    if (!window.confirm("Delete this journal entry? This can't be undone.")) return;
    setEntries((prev) => prev.filter((x) => x.id !== e.id)); // optimistic
    try { await JournalEntry.delete(e.id); } catch { if (user) load(user.id); }
  };

  const load = async (uid: string) => {
    const list = await JournalEntry.filter({ user_id: uid }, "-created_date").catch(() => []);
    setEntries(list);
  };

  useEffect(() => {
    (async () => {
      const u = await User.me().catch(() => null);
      setUser(u);
      if (u) await load(u.id);
      setLoading(false);
    })();
  }, []);

  const selectKind = (k: Kind) => {
    setKind(k);
    setPrompt(PROMPTS[k][0]);
  };

  const save = async () => {
    if (!user || !body.trim()) return;
    setSaving(true);
    try {
      await JournalEntry.create({
        user_id: user.id,
        booking_id: bookingId,
        kind,
        prompt,
        body: body.trim(),
        wellbeing_rating: kind !== "intention" && wellbeing ? wellbeing : undefined,
      } as any);
      setBody("");
      setWellbeing(0);
      await load(user.id);
      toast.success("Saved to your journal.");
    } catch {
      toast.error("Couldn't save your entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const chartData = useMemo(
    () =>
      entries
        .filter((e) => e.wellbeing_rating)
        .slice()
        .reverse()
        .map((e) => ({ date: format(new Date(e.created_date), "MMM d"), wellbeing: e.wellbeing_rating })),
    [entries],
  );

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-full bg-muted">
        <EmptyState icon={BookOpen} title="Sign in to start your journal" description="Your intentions, reflections, and check-ins are private to you." />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-muted pb-12">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border bg-card grain">
        <GradientMesh intensity="soft" />
        <div className="relative z-10 mx-auto max-w-4xl px-5 py-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Integration</p>
          <h1 className="mt-1 font-display text-hero font-semibold">Your journal</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">Set intentions before, reflect after, and track your well-being over time. Private to you.</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-8 px-5 py-8">
        {/* Composer */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k) => {
                const on = kind === k.key;
                return (
                  <button
                    key={k.key}
                    onClick={() => selectKind(k.key)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    <k.icon className="h-4 w-4" weight="duotone" /> {k.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              {PROMPTS[kind].map((p) => (
                <button
                  key={p}
                  onClick={() => setPrompt(p)}
                  className={`rounded-lg border px-3 py-1.5 text-left text-xs transition-colors ${
                    prompt === p ? "border-primary/40 bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder={prompt} className="resize-none" />

            {kind !== "intention" && (
              <div>
                <p className="mb-1.5 text-sm font-medium">How are you feeling? (1–10)</p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setWellbeing(n)}
                      className={`h-8 w-8 rounded-md border text-sm font-medium transition-colors ${
                        wellbeing === n ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={save} disabled={saving || !body.trim()} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Save entry
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Well-being trend */}
        {chartData.length > 1 && (
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-4 font-display text-xl font-semibold">Well-being over time</h2>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                    <Line type="monotone" dataKey="wellbeing" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <section>
          <h2 className="mb-4 font-display text-xl font-semibold">Your entries</h2>
          {entries.length === 0 ? (
            <EmptyState icon={BookOpen} title="No entries yet" description="Set an intention before your next session, or reflect on a past one." />
          ) : (
            <Reveal stagger className="space-y-3">
              {entries.map((e) => {
                const meta = KINDS.find((k) => k.key === e.kind) || KINDS[1];
                return (
                  <Reveal.Item key={e.id}>
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                          <meta.icon className="h-4 w-4" weight="duotone" /> {meta.label}
                          {e.wellbeing_rating ? <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs">{e.wellbeing_rating}/10</span> : null}
                        </span>
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          {format(new Date(e.created_date), "MMM d, yyyy")}
                          <button onClick={() => deleteEntry(e)} aria-label="Delete entry" className="text-muted-foreground/60 hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      </div>
                      {e.prompt && <p className="text-xs italic text-muted-foreground">{e.prompt}</p>}
                      <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">{e.body}</p>
                    </div>
                  </Reveal.Item>
                );
              })}
            </Reveal>
          )}
        </section>
      </div>
    </div>
  );
}
