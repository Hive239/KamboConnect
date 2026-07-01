import type { Practitioner } from '@/types/entities';
import { scorePractitioner, type MatchPrefs, type MatchResult } from '@/lib/matchScore';

/**
 * Mock "AI" matchmaking. Heuristic today (see src/lib/matchScore.ts); the async
 * signature matches a future Claude API call so it can be swapped without
 * touching callers.
 */
export async function scoreMatches(
  prefs: MatchPrefs,
  practitioners: Practitioner[],
  ratingOf: (p: Practitioner) => number = () => 0,
): Promise<MatchResult[]> {
  // Simulate a brief "thinking" latency for realism.
  await new Promise((r) => setTimeout(r, 350));
  return practitioners
    .map((p) => scorePractitioner(p, prefs, ratingOf(p)))
    .sort((a, b) => b.score - a.score);
}

export default { scoreMatches };
