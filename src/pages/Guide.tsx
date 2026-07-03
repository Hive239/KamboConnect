import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Practitioner, Review } from "@/entities/all";
import { createPageUrl } from "@/utils";
import { useSeo } from "@/lib/useSeo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GradientMesh } from "@/components/ui/GradientMesh";
import {
  Sparkle, Send, Leaf, MapPin, Star, ArrowRight, Loader2, ShieldCheck,
  AlertTriangle, Info, CheckCircle,
} from "@/lib/icons";
import { askGuide, QUICK_PROMPTS, type GuideReply } from "@/lib/guide";
import type { MatchResult } from "@/lib/matchScore";

type Msg =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "guide"; reply: GuideReply };

const SAFETY_STYLE: Record<string, { icon: any; cls: string; label: string }> = {
  absolute: { icon: AlertTriangle, cls: "border-destructive/30 bg-destructive/10 text-destructive", label: "Absolute contraindication" },
  relative: { icon: AlertTriangle, cls: "border-warning/30 bg-warning/10 text-warning", label: "Use with caution" },
  temporary: { icon: Info, cls: "border-info/30 bg-info/10 text-info", label: "Temporary — timing matters" },
  ok: { icon: ShieldCheck, cls: "border-success/30 bg-success/10 text-success", label: "General guidance" },
};

function MatchCard({ m }: { m: MatchResult }) {
  const p: any = m.practitioner;
  const loc = [p.address?.city, p.address?.state_province].filter(Boolean).join(", ");
  return (
    <Link
      to={createPageUrl(`PractitionerProfile?id=${p.id}`)}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {p.profile_image_url ? (
        <img src={p.profile_image_url} alt={p.full_name} loading="lazy" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted"><Leaf className="h-6 w-6 text-muted-foreground" /></div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold">{p.full_name}</p>
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{m.score}% match</span>
        </div>
        {loc && <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{loc}</p>}
        {m.reasons?.length > 0 && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{m.reasons.slice(0, 2).join(" · ")}</p>
        )}
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function ReplyBubble({ reply, onAction }: { reply: GuideReply; onAction: (p: string) => void }) {
  const s = reply.safety ? SAFETY_STYLE[reply.safety.level] : null;
  return (
    <div className="space-y-3">
      <p className="leading-relaxed text-foreground">{reply.text}</p>

      {reply.bullets && reply.bullets.length > 0 && (
        <ul className="space-y-1.5">
          {reply.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" weight="duotone" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {s && (
        <div className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${s.cls}`}>
          <s.icon className="mt-0.5 h-4 w-4 shrink-0" weight="fill" />
          <span className="font-medium">{reply.safety!.note || s.label}</span>
        </div>
      )}

      {reply.practitioners && reply.practitioners.length > 0 && (
        <div className="space-y-2 pt-1">
          {reply.practitioners.map((m) => <MatchCard key={(m.practitioner as any).id} m={m} />)}
        </div>
      )}

      {reply.actions && reply.actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {reply.actions.map((a, i) =>
            a.page ? (
              <Link key={i} to={createPageUrl(a.page)}>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent">
                  {a.label} <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ) : (
              <button
                key={i}
                onClick={() => a.prompt && onAction(a.prompt)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
              >
                {a.label}
              </button>
            ),
          )}
        </div>
      )}

      {reply.disclaimer && (
        <p className="pt-1 text-xs italic text-muted-foreground">
          Educational guidance only — not medical advice. Always consult a doctor and your practitioner.
        </p>
      )}
    </div>
  );
}

export default function Guide() {
  useSeo({
    title: "Ask the Guide — KamboGuide",
    description: "Your calm companion for finding a trusted Kambo practitioner and understanding safety and booking.",
  });

  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [ratingMap, setRatingMap] = useState<Record<string, number>>({});
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = () => ++idRef.current;

  // Load practitioners + reviews for recommendations.
  useEffect(() => {
    Practitioner.list("-created_date").then((list: any[]) => setPractitioners(list || [])).catch(() => {});
    Review.list("-created_date")
      .then((reviews: any[]) => {
        const acc: Record<string, { sum: number; n: number }> = {};
        (reviews || []).forEach((r) => {
          const pid = r.practitioner_id;
          const val = r.overall_rating ?? r.rating ?? 0;
          if (!pid || !val) return;
          acc[pid] = acc[pid] || { sum: 0, n: 0 };
          acc[pid].sum += val;
          acc[pid].n += 1;
        });
        const map: Record<string, number> = {};
        Object.entries(acc).forEach(([pid, { sum, n }]) => (map[pid] = sum / n));
        setRatingMap(map);
      })
      .catch(() => {});
  }, []);

  // Greeting on first paint.
  useEffect(() => {
    let cancelled = false;
    askGuide("", { practitioners: [] }).then((reply) => {
      if (!cancelled) setMessages([{ id: nextId(), role: "guide", reply }]);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const ratingOf = useMemo(() => (p: any) => ratingMap[p.id] ?? 0, [ratingMap]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    setInput("");
    setMessages((m) => [...m, { id: nextId(), role: "user", text: q }]);
    setThinking(true);
    try {
      const reply = await askGuide(q, { practitioners, ratingOf, location: null });
      setMessages((m) => [...m, { id: nextId(), role: "guide", reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: nextId(), role: "guide", reply: { text: "Sorry — something went wrong. Please try again." } },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col bg-muted">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border bg-card grain">
        <GradientMesh intensity="soft" />
        <div className="relative z-10 mx-auto flex max-w-3xl items-center gap-3 px-5 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 shadow-glow">
            <Sparkle className="h-6 w-6 text-primary" weight="fill" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold">Ask the Guide</h1>
            <p className="text-sm text-muted-foreground">Your calm companion for finding a practitioner, safety & booking.</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start gap-3"}
              >
                {m.role === "guide" && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Leaf className="h-4 w-4 text-primary" weight="duotone" />
                  </div>
                )}
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground shadow-sm"
                      : "max-w-[90%] rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3 shadow-sm"
                  }
                >
                  {m.role === "user" ? <p>{m.text}</p> : <ReplyBubble reply={m.reply} onAction={send} />}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {thinking && (
            <div className="flex justify-start gap-3">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Leaf className="h-4 w-4 text-primary" weight="duotone" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-3">
          {messages.length <= 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
                >
                  <Sparkle className="h-3 w-3 text-primary" weight="fill" /> {p}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about Kambo, safety, or finding a practitioner…"
              aria-label="Message the Guide"
              className="h-11 rounded-full"
            />
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0 rounded-full" disabled={!input.trim() || thinking} aria-label="Send message">
              <Send className="h-5 w-5" weight="fill" />
            </Button>
          </form>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            The Guide offers educational guidance, not medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
