import type { Practitioner } from '@/types/entities';
import { calculateDistance } from '@/components/utils/locationUtils';

/**
 * Heuristic match scoring (the "practical AI" — same signature a real model
 * call would have, so it can be swapped later). Scores a practitioner 0–100
 * against a seeker's preferences and returns human-readable reasons.
 */
export interface MatchPrefs {
  modalities?: string[];
  languages?: string[];
  maxPrice?: number; // 0–3 index over $..$$$$
  requireVerified?: boolean;
  preferOnline?: boolean;
  experienceLevel?: 'any' | 'some' | 'master';
  location?: { latitude: number; longitude: number } | null;
  maxDistance?: number; // miles
}

export interface MatchResult {
  practitioner: Practitioner;
  score: number;
  reasons: string[];
}

const PRICE_INDEX: Record<string, number> = { $: 0, $$: 1, $$$: 2, $$$$: 3 };

export function scorePractitioner(
  p: Practitioner,
  prefs: MatchPrefs,
  avgRating = 0,
): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  // Verification (trust) — heavy weight
  if (p.is_verified) {
    score += 22;
    if (p.verification_level === 'master') { score += 8; reasons.push('Master-verified'); }
    else if (p.verification_level === 'advanced') { score += 4; }
  } else if (prefs.requireVerified) {
    score -= 40;
  }

  // Modality overlap
  const pm = (p.modalities || p.specializations || []).map((s) => s.toLowerCase());
  const want = (prefs.modalities || []).map((s) => s.toLowerCase());
  if (want.length) {
    const hits = want.filter((w) => pm.some((m) => m.includes(w) || w.includes(m)));
    if (hits.length) { score += Math.min(20, hits.length * 10); reasons.push(`Offers ${hits.length} of your modalities`); }
  }

  // Languages
  const pl = (p.languages || []).map((s) => s.toLowerCase());
  const wl = (prefs.languages || []).map((s) => s.toLowerCase());
  if (wl.length && wl.some((w) => pl.includes(w))) { score += 8; reasons.push('Speaks your language'); }

  // Rating
  if (avgRating >= 4.5) { score += 14; reasons.push('Exceptional ratings'); }
  else if (avgRating >= 4) { score += 9; }
  else if (avgRating >= 3.5) { score += 4; }

  // Experience
  const exp = p.years_experience || 0;
  if (prefs.experienceLevel === 'master' && exp >= 8) { score += 10; reasons.push('Highly experienced'); }
  else if (prefs.experienceLevel === 'some' && exp >= 3) { score += 6; }
  else if (exp >= 5) { score += 5; }

  // Price fit
  if (typeof prefs.maxPrice === 'number' && p.pricing_range) {
    const pi = PRICE_INDEX[p.pricing_range] ?? 1;
    if (pi <= prefs.maxPrice) { score += 8; reasons.push('Within your budget'); }
    else { score -= 6; }
  }

  // Online preference
  if (prefs.preferOnline && p.is_online) { score += 8; reasons.push('Offers online sessions'); }

  // Distance
  if (prefs.location && p.latitude != null && p.longitude != null) {
    const d = calculateDistance(prefs.location.latitude, prefs.location.longitude, p.latitude, p.longitude);
    if (d != null) {
      if (d <= 25) { score += 12; reasons.push(`Just ${d} mi away`); }
      else if (d <= 100) { score += 6; reasons.push(`${d} mi away`); }
      else if (prefs.maxDistance && d > prefs.maxDistance) { score -= 10; }
    }
  }

  return { practitioner: p, score: Math.max(0, Math.min(100, Math.round(score))), reasons };
}
