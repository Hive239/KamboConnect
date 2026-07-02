import { useEffect, useState } from "react";
import { Reaction, User } from "@/entities/all";
import { Heart } from "@/lib/icons";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { toggleReaction, type ReactionTarget } from "@/lib/reactions";

/**
 * Like button + count for any target. Pass `count`/`liked` to render from a
 * batch-loaded list (no per-row fetch); omit them and it self-loads (fine for a
 * detail page or a handful of items).
 */
export default function ReactionButton({
  targetType, targetId, count: initCount, liked: initLiked, size = "sm",
}: {
  targetType: ReactionTarget; targetId: string; count?: number; liked?: boolean; size?: "sm" | "default";
}) {
  const { data: me } = useCurrentUser();
  const [count, setCount] = useState(initCount ?? 0);
  const [liked, setLiked] = useState(!!initLiked);
  const [loaded, setLoaded] = useState(initCount !== undefined);
  const [busy, setBusy] = useState(false);

  // Controlled: reflect props when the parent batch-load updates.
  useEffect(() => {
    if (initCount !== undefined) { setCount(initCount); setLiked(!!initLiked); setLoaded(true); }
  }, [initCount, initLiked]);

  // Uncontrolled: self-load once.
  useEffect(() => {
    if (loaded) return;
    let active = true;
    Reaction.filter({ target_type: targetType, target_id: targetId })
      .then((rs: any[]) => { if (!active) return; setCount(rs.length); setLiked(!!(me && rs.some((r) => r.user_id === me.id))); setLoaded(true); })
      .catch(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [targetType, targetId, loaded, me]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!me) { await User.login(); return; }
    if (busy) return;
    setBusy(true);
    const next = !liked;
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1))); // optimistic
    try {
      await toggleReaction(targetType, targetId, me);
    } catch {
      setLiked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1))); // rollback
    } finally { setBusy(false); }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm transition-colors ${
        liked ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Heart className={size === "default" ? "h-5 w-5" : "h-4 w-4"} weight={liked ? "fill" : "regular"} />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
