/**
 * The KamboGuide "brain" — a single async seam that turns a natural-language
 * question into a structured reply. Today it routes intents to the existing
 * heuristics (matchmaking + contraindications); the signature is shaped so a real
 * Claude API call can drop in later without touching the UI.
 *
 *   const reply = await askGuide("is kambo safe if I have high blood pressure?", ctx)
 */
import { scoreMatches } from "@/integrations/Matchmaking";
import type { MatchResult, MatchPrefs } from "@/lib/matchScore";
import {
  CONTRAINDICATIONS, byLevel, LEVEL_META, type ContraLevel,
} from "@/data/contraindications";

export type GuideAction = { label: string; prompt?: string; page?: string };

export interface GuideReply {
  /** Conversational answer (plain text; render as paragraphs). */
  text: string;
  bullets?: string[];
  /** Practitioner recommendations to render as cards. */
  practitioners?: MatchResult[];
  /** Safety triage tone, when the question was health-related. */
  safety?: { level: ContraLevel | "ok"; note: string };
  /** Follow-up chips (either re-ask a prompt or navigate to a page). */
  actions?: GuideAction[];
  /** Gentle reminder rendered under health answers. */
  disclaimer?: boolean;
}

export interface GuideContext {
  practitioners: any[];
  ratingOf?: (p: any) => number;
  location?: { latitude: number; longitude: number } | null;
}

export const QUICK_PROMPTS = [
  "Find me a match",
  "Is Kambo safe for me?",
  "How does booking work?",
  "What is Kambo?",
];

const has = (s: string, ...words: string[]) => words.some((w) => s.includes(w));

/** Pull light preferences out of free text for the matchmaker. */
function prefsFromText(msg: string, ctx: GuideContext): MatchPrefs {
  const modalities: string[] = [];
  ["kambo", "rapé", "rape", "sananga", "hapé", "integration", "breathwork"].forEach((m) => {
    if (msg.includes(m)) modalities.push(m);
  });
  return {
    requireVerified: true,
    preferOnline: has(msg, "online", "remote", "virtual"),
    experienceLevel: has(msg, "experienced", "master", "veteran") ? "master" : "any",
    modalities: modalities.length ? modalities : undefined,
    location: ctx.location ?? null,
  };
}

async function recommend(msg: string, ctx: GuideContext): Promise<GuideReply> {
  const prefs = prefsFromText(msg, ctx);
  const results = await scoreMatches(prefs, ctx.practitioners as any, ctx.ratingOf);
  const top = results.filter((r) => r.score > 0).slice(0, 3);
  if (!top.length) {
    return {
      text: "I couldn't find a strong match just yet. Try the full directory, or tell me what matters most to you — location, online sessions, languages, or budget.",
      actions: [
        { label: "Browse the directory", page: "Directory" },
        { label: "Take the full quiz", page: "Matchmaking" },
      ],
    };
  }
  return {
    text: "Based on what you've told me, here are the practitioners I'd trust for you. Each is verified — tap any card to view their full profile and request a free consultation.",
    practitioners: top,
    actions: [
      { label: "See more matches", page: "Matchmaking" },
      { label: "Only online sessions", prompt: "Find me an online practitioner" },
      { label: "How does booking work?", prompt: "How does booking work?" },
    ],
  };
}

function safety(msg: string): GuideReply {
  // Try to match the message against known contraindication labels/keywords.
  const keywordMap: Record<string, string[]> = {
    heart: ["heart", "cardiac", "stroke", "aneurysm"],
    pregnancy: ["pregnan", "breastfeed", "nursing"],
    "blood-pressure": ["blood pressure", "hypertension", "hypotension"],
    medications: ["medication", "meds", "prescription", "antidepressant", "ssri"],
    "mental-health": ["schizophrenia", "psychosis", "epilep", "seizure", "bipolar"],
    "major-organs": ["liver", "kidney", "pancreas"],
    elderly: ["70", "elderly", "old"],
    menstruation: ["menstruat", "period"],
    "acute-illness": ["fever", "infection", "flu", "sick", "ill"],
  };
  let matchedId: string | null = null;
  for (const [id, kws] of Object.entries(keywordMap)) {
    if (kws.some((k) => msg.includes(k))) { matchedId = id; break; }
  }

  if (matchedId) {
    const c = CONTRAINDICATIONS.find((x) => x.id === matchedId)!;
    const meta = LEVEL_META[c.level];
    const notes: Record<ContraLevel, string> = {
      absolute: "This is considered an absolute contraindication — Kambo should not be administered. Please speak with your doctor and do not book a session.",
      relative: "This is a relative contraindication — it doesn't automatically rule you out, but you'll need clearance from your practitioner and, ideally, your doctor first.",
      temporary: "This is a temporary contraindication — it's usually fine once resolved. Mention it to your practitioner so you can time your session safely.",
    };
    return {
      text: `You mentioned "${c.label.toLowerCase()}". ${meta.blurb} ${notes[c.level]}`,
      bullets: c.detail ? [c.detail] : undefined,
      safety: { level: c.level, note: meta.title },
      actions: [
        { label: "See all contraindications", page: "Education" },
        { label: "Find a practitioner to consult", prompt: "Find me a match" },
      ],
      disclaimer: true,
    };
  }

  // Generic safety overview.
  return {
    text: "Kambo is powerful and generally safe for healthy adults when facilitated by a trained practitioner — but it isn't right for everyone. Every booking on KamboGuide includes a health screening and an informed-consent waiver. Here are the conditions that need attention:",
    bullets: [
      `${LEVEL_META.absolute.title}: ${byLevel("absolute").slice(0, 3).map((c) => c.label.toLowerCase()).join(", ")}, and more.`,
      `${LEVEL_META.relative.title}: ${byLevel("relative").slice(0, 3).map((c) => c.label.toLowerCase()).join(", ")}.`,
      `${LEVEL_META.temporary.title}: ${byLevel("temporary").slice(0, 2).map((c) => c.label.toLowerCase()).join(", ")}.`,
    ],
    safety: { level: "ok", note: "General guidance" },
    actions: [
      { label: "Read the full safety guide", page: "Education" },
      { label: "Do I have a specific concern?", prompt: "Is Kambo safe with medication?" },
    ],
    disclaimer: true,
  };
}

function booking(): GuideReply {
  return {
    text: "Booking on KamboGuide is designed to be calm and safe. Here's the flow:",
    bullets: [
      "Find a verified practitioner in the directory, on the map, or through me.",
      "Request a free consultation to make sure it's the right fit.",
      "Complete a short health screening and sign the informed-consent waiver.",
      "Confirm your session — you'll get reminders and can message your practitioner anytime.",
    ],
    actions: [
      { label: "Find me a match", prompt: "Find me a match" },
      { label: "Browse the directory", page: "Directory" },
    ],
  };
}

function about(): GuideReply {
  return {
    text: "Kambo is the secretion of the giant monkey frog (Phyllomedusa bicolor), used traditionally by Amazonian peoples. In a session, a trained practitioner applies small amounts to superficial skin points. People seek it for detoxification, clarity, and emotional reset. It's an intense experience, so set, setting, and a qualified practitioner matter enormously — which is exactly what KamboGuide helps you find.",
    actions: [
      { label: "Learn more", page: "Education" },
      { label: "Is it safe for me?", prompt: "Is Kambo safe for me?" },
      { label: "Find a practitioner", prompt: "Find me a match" },
    ],
  };
}

function greeting(): GuideReply {
  return {
    text: "Hi — I'm your KamboGuide. I can help you find a trusted practitioner, answer safety questions, or explain how sessions and booking work. What's on your mind?",
    actions: QUICK_PROMPTS.map((p) => ({ label: p, prompt: p })),
  };
}

/** Route a message to the right heuristic. Async: mirrors a future model call. */
export async function askGuide(message: string, ctx: GuideContext): Promise<GuideReply> {
  const msg = message.toLowerCase().trim();

  if (!msg) return greeting();
  if (has(msg, "hi", "hello", "hey", "start") && msg.length < 12) return greeting();
  if (has(msg, "safe", "contraindicat", "condition", "can i", "should i", "risk", "danger",
    "pregnan", "heart", "medication", "blood pressure", "epilep", "liver", "kidney"))
    return safety(msg);
  if (has(msg, "book", "consult", "appointment", "schedule", "how does", "how do i", "process"))
    return booking();
  if (has(msg, "what is", "about kambo", "explain", "tell me about", "frog"))
    return about();
  if (has(msg, "match", "find", "recommend", "practitioner", "near me", "who should", "online", "best"))
    return recommend(msg, ctx);

  // Fallback: try a recommendation, since most open questions are discovery.
  return recommend(msg, ctx);
}
