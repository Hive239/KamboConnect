import { FeedItem } from "@/entities/all";

/** Emit a community feed activity item (best-effort; never throws). */
export async function emitFeed(item: {
  actor_id?: string;
  actor_name?: string;
  actor_image_url?: string;
  verb: FeedVerb;
  object_type: FeedObject;
  object_id: string;
  summary?: string;
  image_url?: string;
  action_url?: string;
}): Promise<void> {
  if (!item.actor_id) return;
  try {
    await FeedItem.create({ actor_name: "Someone", ...item });
  } catch (e) {
    console.warn("emitFeed failed (non-fatal):", e);
  }
}

type FeedVerb = 'posted' | 'hosted_event' | 'reviewed' | 'joined_group' | 'verified' | 'listed_product';
type FeedObject = 'post' | 'event' | 'review' | 'group' | 'practitioner' | 'product';
