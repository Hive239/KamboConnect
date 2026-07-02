import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FeedItem, Follow, User, Practitioner } from "@/entities/all";
import { subscribe } from "@/data/store";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MessageSquare, Star, UsersThree, Storefront, ShieldCheck, Users } from "@/lib/icons";
import { loadReactions } from "@/lib/reactions";
import ReactionButton from "@/components/social/ReactionButton";

const VERB_META: Record<string, { icon: any; label: string }> = {
  hosted_event: { icon: Calendar, label: "hosted an event" },
  posted: { icon: MessageSquare, label: "shared a post" },
  reviewed: { icon: Star, label: "left a review" },
  joined_group: { icon: UsersThree, label: "joined a group" },
  verified: { icon: ShieldCheck, label: "was verified" },
  listed_product: { icon: Storefront, label: "listed a product" },
};

export default function FeedView() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyFollowing, setOnlyFollowing] = useState(false);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [practitionerIds, setPractitionerIds] = useState<Set<string>>(new Set());
  const [reactions, setReactions] = useState<{ counts: Record<string, number>; mine: Set<string> }>({ counts: {}, mine: new Set() });

  const load = async () => {
    try {
      const me = await User.me().catch(() => null);
      if (me) {
        const follows = await Follow.filter({ follower_id: me.id });
        setFollowedIds(new Set(follows.map((f: any) => f.followee_id)));
      }
      const feed = await FeedItem.list("-created_date", 50);
      setItems(feed);
      try {
        const pracs = await Practitioner.list();
        setPractitionerIds(new Set(pracs.map((p: any) => p.id)));
      } catch { /* badge is a non-critical enhancement */ }
      try { setReactions(await loadReactions("feed_item", me?.id)); } catch { /* non-critical */ }
    } catch (e) {
      console.error("Failed to load feed:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Real-time: refresh when feed/follows change
    const unsub = subscribe((c) => { if (c.entity === "FeedItem" || c.entity === "Follow" || c.entity === "*") load(); });
    return unsub;
  }, []);

  const shown = onlyFollowing ? items.filter((i) => followedIds.has(i.actor_id)) : items;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex gap-2">
        <button onClick={() => setOnlyFollowing(false)} className={`rounded-full border px-3 py-1.5 text-sm ${!onlyFollowing ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>All activity</button>
        <button onClick={() => setOnlyFollowing(true)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${onlyFollowing ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}><Users className="h-4 w-4" weight="duotone" /> Following</button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-14 text-center text-muted-foreground">
          <UsersThree className="mx-auto mb-2 h-9 w-9 text-muted-foreground/40" weight="duotone" />
          {onlyFollowing ? "Follow practitioners to see their activity here." : "No activity yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((it) => {
            const meta = VERB_META[it.verb] || { icon: MessageSquare, label: it.verb };
            const Body = (
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex gap-3 p-4">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={it.actor_image_url} alt={it.actor_name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{it.actor_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{it.actor_name}</span>
                      {it.actor_id && practitionerIds.has(it.actor_id) && (
                        <Badge variant="tier" className="mx-1.5 align-middle text-[10px]">Practitioner</Badge>
                      )}
                      {" "}<span className="text-muted-foreground">{meta.label}</span>
                    </p>
                    {it.summary && <p className="mt-0.5 text-sm text-foreground">{it.summary}</p>}
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="tier" className="gap-1"><meta.icon className="h-3 w-3" weight="duotone" /> {it.object_type}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(it.created_date).toLocaleDateString()}</span>
                      <span className="ml-auto" onClick={(e) => e.preventDefault()}>
                        <ReactionButton targetType="feed_item" targetId={it.id} count={reactions.counts[it.id] || 0} liked={reactions.mine.has(it.id)} />
                      </span>
                    </div>
                  </div>
                  {it.image_url && <img loading="lazy" src={it.image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />}
                </CardContent>
              </Card>
            );
            return it.action_url ? <Link key={it.id} to={it.action_url} className="block">{Body}</Link> : <div key={it.id}>{Body}</div>;
          })}
        </div>
      )}
    </div>
  );
}
