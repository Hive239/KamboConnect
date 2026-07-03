import type { Review } from '@/types/entities';

/**
 * Weighted reputation score from a practitioner's reviews.
 * Blends the multi-dimension ratings, a recommend rate, and a volume factor so
 * a practitioner with many strong reviews outranks one with a single 5-star.
 * Returns a 0–5 score plus the supporting counts.
 */
export interface Reputation {
  score: number; // 0–5, one decimal
  reviewCount: number;
  recommendRate: number; // 0–1
}

const DIMENSION_WEIGHTS = {
  overall_rating: 0.4,
  safety_rating: 0.2,
  professionalism_rating: 0.15,
  communication_rating: 0.15,
  environment_rating: 0.1,
} as const;

export function computeReputation(reviews: Review[]): Reputation {
  if (!reviews || reviews.length === 0) {
    return { score: 0, reviewCount: 0, recommendRate: 0 };
  }
  let weighted = 0;
  let recommend = 0;
  for (const r of reviews) {
    let dim = 0;
    let wsum = 0;
    for (const [key, w] of Object.entries(DIMENSION_WEIGHTS)) {
      const v = (r as any)[key];
      if (typeof v === 'number' && v > 0) {
        dim += v * w;
        wsum += w;
      }
    }
    weighted += wsum > 0 ? dim / wsum : (r.overall_rating || 0);
    if (r.would_recommend) recommend += 1;
  }
  const avg = weighted / reviews.length;
  // Volume confidence: nudges toward the average as count grows (Bayesian-ish).
  const C = 5; // prior weight
  const priorMean = 4.0;
  const adjusted = (avg * reviews.length + priorMean * C) / (reviews.length + C);
  return {
    score: Math.round(adjusted * 10) / 10,
    reviewCount: reviews.length,
    recommendRate: Math.round((recommend / reviews.length) * 100) / 100,
  };
}

/**
 * Recompute a practitioner's reputation from their current reviews and persist it
 * to `practitioner.reputation_score` (used by the landing "featured" sort/badge,
 * which otherwise reads an always-undefined field). Call after any review change.
 */
export async function persistReputation(practitionerId: string): Promise<number> {
  if (!practitionerId) return 0;
  const { Review } = await import('@/entities/Review');
  const { Practitioner } = await import('@/entities/Practitioner');
  const reviews = await Review.filter({ practitioner_id: practitionerId }).catch(() => []);
  const { score } = computeReputation(reviews as any);
  await Practitioner.update(practitionerId, { reputation_score: score }).catch(() => {});
  return score;
}
