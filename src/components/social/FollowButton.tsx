import { useEffect, useState } from "react";
import { Follow, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "@/lib/icons";

/**
 * Follow/unfollow toggle (clones the FavoriteButton optimistic pattern).
 * followeeType: 'practitioner' | 'user' | 'group'.
 */
export default function FollowButton({ followeeId, followeeType = "practitioner", followeeName, followeeImage, size = "sm", className = "" }:
  { followeeId: string; followeeType?: "practitioner" | "user" | "group"; followeeName?: string; followeeImage?: string; size?: any; className?: string }) {
  const [following, setFollowing] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const u = await User.me().catch(() => null);
      setMe(u);
      if (!u) return;
      const existing = await Follow.filter({ follower_id: u.id, followee_id: followeeId });
      if (existing[0]) { setFollowing(true); setRecordId(existing[0].id); }
    })();
  }, [followeeId]);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!me) { await User.login(); return; }
    setBusy(true);
    try {
      if (following && recordId) {
        await Follow.delete(recordId);
        setFollowing(false); setRecordId(null);
      } else {
        const rec = await Follow.create({ follower_id: me.id, followee_id: followeeId, followee_type: followeeType, followee_name: followeeName, followee_image_url: followeeImage });
        setFollowing(true); setRecordId(rec.id);
      }
    } finally { setBusy(false); }
  };

  return (
    <Button variant={following ? "outline" : "default"} size={size} onClick={toggle} disabled={busy}
      aria-pressed={following} className={`gap-1.5 ${className}`}>
      {following ? <><Check className="h-4 w-4" weight="bold" /> Following</> : <><Plus className="h-4 w-4" weight="bold" /> Follow</>}
    </Button>
  );
}
