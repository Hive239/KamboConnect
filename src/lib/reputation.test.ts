import { describe, it, expect } from 'vitest';
import { computeReputation } from './reputation';

describe('computeReputation', () => {
  it('returns zeros for no reviews', () => {
    expect(computeReputation([])).toEqual({ score: 0, reviewCount: 0, recommendRate: 0 });
  });

  it('counts reviews and computes recommend rate', () => {
    const rep = computeReputation([
      { overall_rating: 5, would_recommend: true } as any,
      { overall_rating: 4, would_recommend: false } as any,
    ]);
    expect(rep.reviewCount).toBe(2);
    expect(rep.recommendRate).toBe(0.5);
    expect(rep.score).toBeGreaterThan(0);
    expect(rep.score).toBeLessThanOrEqual(5);
  });

  it('weights multi-dimension ratings toward the prior with few reviews', () => {
    const rep = computeReputation([
      { overall_rating: 5, safety_rating: 5, professionalism_rating: 5, would_recommend: true } as any,
    ]);
    // Bayesian prior (4.0, weight 5) pulls a single 5-star review below 5.
    expect(rep.score).toBeLessThan(5);
    expect(rep.score).toBeGreaterThan(4);
  });
});
