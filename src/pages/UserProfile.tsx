import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { User, Post, Reply, Practitioner } from "@/entities/all";
import { createPageUrl } from "@/utils";
import { useSeo } from "@/lib/useSeo";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Sparkle } from "@/lib/icons";
import { format } from "date-fns";
import FollowButton from "@/components/social/FollowButton";
import ReportButton from "@/components/profile/ReportButton";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import ShareButton from "@/components/ShareButton";

/**
 * Public profile for a community member (non-practitioner user). Shows identity,
 * a follow/report/message affordance, and the member's forum post history.
 * Practitioners are redirected to their richer PractitionerProfile.
 */
export default function UserProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = new URLSearchParams(location.search).get("id");

  const [user, setUser] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [replyCount, setReplyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const reqRef = useRef(0);

  useEffect(() => {
    if (!userId) { navigate(createPageUrl("Community")); return; }
    const myReq = ++reqRef.current;
    setLoading(true);
    (async () => {
      try {
        // A user who owns a practitioner listing gets the richer profile instead.
        const prac = await Practitioner.get(userId).catch(() => null);
        if (prac) { navigate(`${createPageUrl("PractitionerProfile")}?id=${userId}`, { replace: true }); return; }

        const [u, current, theirPosts, theirReplies] = await Promise.all([
          User.get(userId).catch(() => null),
          User.me().catch(() => null),
          Post.filter({ author_id: userId }, "-created_date").catch(() => []),
          Reply.filter({ author_id: userId }).catch(() => []),
        ]);
        if (myReq !== reqRef.current) return;
        if (!u) { navigate(createPageUrl("Community")); return; }
        setUser(u);
        setMe(current);
        setPosts((theirPosts || []).filter((p: any) => !p.is_hidden));
        setReplyCount((theirReplies || []).filter((r: any) => !r.is_hidden).length);
      } catch (e) {
        if (myReq === reqRef.current) navigate(createPageUrl("Community"));
      } finally {
        if (myReq === reqRef.current) setLoading(false);
      }
    })();
  }, [userId, navigate]);

  useSeo(user ? { title: `${user.full_name || "Member"} — KamboGuide Community`, description: `Community activity from ${user.full_name || "a member"}.` } : {});

  const messageUser = () => {
    // Route to Messages with a target so a conversation can be opened/created there.
    navigate(`${createPageUrl("Messages")}?to=${userId}&name=${encodeURIComponent(user.full_name || "Member")}`);
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return null;

  const isSelf = me?.id === user.id;

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <PageBreadcrumbs
        className="mb-4"
        items={[{ label: "Community", to: createPageUrl("Community") }, { label: user.full_name || "Member" }]}
      />

      <Card className="mb-6 overflow-hidden">
        <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.profile_image_url} />
            <AvatarFallback className="text-2xl">{user.full_name?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <h1 className="font-display text-2xl font-semibold">{user.full_name || "Community member"}</h1>
              <Badge variant="secondary">Member</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Member since {user.created_date ? format(new Date(user.created_date), "MMMM yyyy") : "—"} · {posts.length} posts · {replyCount} replies
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {!isSelf ? (
              <>
                <FollowButton followeeId={user.id} followeeType="user" followeeName={user.full_name} followeeImage={user.profile_image_url} size="default" />
                <Button variant="outline" size="sm" onClick={messageUser} className="gap-1.5">
                  <MessageSquare className="h-4 w-4" /> Message
                </Button>
                <ShareButton title={user.full_name} />
                <ReportButton itemType="user" itemId={user.id} itemTitle={user.full_name || "this member"} />
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild><Link to={createPageUrl("MyAccount")}>Edit profile</Link></Button>
                <ShareButton title={user.full_name} />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-3 text-lg font-semibold">Recent posts</h2>
      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
          <Sparkle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" weight="duotone" />
          No posts yet.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <Link key={p.id} to={createPageUrl(`Post?id=${p.id}`)} className="block">
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">{p.title}</h3>
                    {p.category && <Badge variant="outline" className="shrink-0">{p.category}</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.reply_count || 0} replies · {p.created_date ? format(new Date(p.created_date), "MMM d, yyyy") : ""}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
