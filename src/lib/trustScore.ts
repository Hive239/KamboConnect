import { computeReputation } from './reputation';
import type { Review } from '@/types/entities';

/**
 * Composite 0–100 trust score for a practitioner — a single legible safety/credibility
 * signal blending verification, reviews, experience, and verified credentials.
 */
export interface TrustScore {
  score: number; // 0–100
  band: 'New' | 'Established' | 'Trusted' | 'Highly Trusted';
  factors: { label: string; points: number; max: number }[];
}

const LEVEL_POINTS: Record<string, number> = { pending: 0, basic: 18, advanced: 26, master: 30, rejected: 0 };

export function computeTrustScore(practitioner: any, reviews: Review[] = [], credentials: any[] = []): TrustScore {
  const rep = computeReputation(reviews);

  // Verification (0–30)
  const verification = practitioner?.is_verified ? (LEVEL_POINTS[practitioner.verification_level] ?? 18) : 0;
  // Reviews (0–35): quality (0–25) + volume (0–10, 1 pt/review capped)
  const reviewsPts = (rep.reviewCount ? (rep.score / 5) * 25 : 0) + Math.min(10, rep.reviewCount);
  // Experience (0–15): 1.5 pts/yr capped
  const experience = Math.min(15, (practitioner?.years_experience || 0) * 1.5);
  // Credentials (0–20): 7 pts per verified credential capped
  const verifiedCreds = (credentials || []).filter((c) => c.status === 'verified').length;
  const credentialsPts = Math.min(20, verifiedCreds * 7);

  const score = Math.round(verification + reviewsPts + experience + credentialsPts);
  const band = score >= 80 ? 'Highly Trusted' : score >= 60 ? 'Trusted' : score >= 35 ? 'Established' : 'New';

  return {
    score,
    band,
    factors: [
      { label: 'Verification', points: Math.round(verification), max: 30 },
      { label: 'Reviews', points: Math.round(reviewsPts), max: 35 },
      { label: 'Experience', points: Math.round(experience), max: 15 },
      { label: 'Credentials', points: Math.round(credentialsPts), max: 20 },
    ],
  };
}

export function trustBandColor(band: TrustScore['band']): string {
  switch (band) {
    case 'Highly Trusted': return 'text-success';
    case 'Trusted': return 'text-primary';
    case 'Established': return 'text-info';
    default: return 'text-muted-foreground';
  }
}
