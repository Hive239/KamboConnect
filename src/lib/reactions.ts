import { Reaction } from '@/entities/all';

export type ReactionTarget = 'post' | 'reply' | 'feed_item' | 'event';

/** Toggle the current user's 'like' on a target. Returns the new liked state. */
export async function toggleReaction(targetType: ReactionTarget, targetId: string, user: any): Promise<boolean> {
  if (!user) return false;
  const existing = await Reaction.filter({ target_type: targetType, target_id: targetId, user_id: user.id });
  if (existing.length) {
    await Reaction.delete(existing[0].id);
    return false;
  }
  await Reaction.create({ target_type: targetType, target_id: targetId, user_id: user.id, type: 'like' });
  return true;
}

/**
 * Batch-load reaction counts (and the current user's liked set) for one target
 * type — one query for a whole list, avoiding an N+1 storm.
 */
export async function loadReactions(targetType: ReactionTarget, userId?: string): Promise<{ counts: Record<string, number>; mine: Set<string> }> {
  const counts: Record<string, number> = {};
  const mine = new Set<string>();
  try {
    const all = await Reaction.filter({ target_type: targetType });
    for (const r of all as any[]) {
      counts[r.target_id] = (counts[r.target_id] || 0) + 1;
      if (userId && r.user_id === userId) mine.add(r.target_id);
    }
  } catch { /* non-critical */ }
  return { counts, mine };
}
