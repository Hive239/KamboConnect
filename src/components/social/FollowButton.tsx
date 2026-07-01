import { useState } from "react";
import { Follow, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "@/lib/icons";
import { useCurrentUser, useMyFollows, useDataInvalidator } from "@/lib/useCurrentUser";

/**
 * Follow/unfollow toggle. Uses the shared cached current-user + follows queries
 * so many buttons don't each fetch (fixes the N+1 request storm).
 * followeeType: 'practitioner' | 'user' | 'group'.
 */
export default function FollowButton({ followeeId, followeeType = "practitioner", followeeName, followeeImage, size = "sm", className = "" }:
  { followeeId: string; followeeType?: "practitioner" | "user" | "group"; followeeName?: string; followeeImage?: string; size?: any; className?: string }) {
  const { data: me } = useCurrentUser();
  const { data: follows } = useMyFollows();
  const invalidate = useDataInvalidator();
  const [busy, setBusy] = useState(false);

  const existing = (follows || []).find((f: any) => f.followee_id === followeeId);
  const following = !!existing;

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!me) { await User.login(); return; }
    setBusy(true);
    try {
      if (existing) {
        await Follow.delete(existing.id);
      } else {
        await Follow.create({ follower_id: me.id, followee_id: followeeId, followee_type: followeeType, followee_name: followeeName, followee_image_url: followeeImage });
      }
      invalidate('follows');
    } finally { setBusy(false); }
  };

  return (
    <Button variant={following ? "outline" : "default"} size={size} onClick={toggle} disabled={busy}
      aria-pressed={following} className={`gap-1.5 ${className}`}>
      {following ? <><Check className="h-4 w-4" weight="bold" /> Following</> : <><Plus className="h-4 w-4" weight="bold" /> Follow</>}
    </Button>
  );
}
