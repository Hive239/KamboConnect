import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Group, GroupMembership, Post, User } from "@/entities/all";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, UsersThree, Lock, Loader2, Check, Plus } from "@/lib/icons";
import { formatDate } from "@/lib/format";
import { useSeo } from "@/lib/useSeo";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";

/** Group detail — members + group-scoped discussions (Post.group_id). Completes #13. */
export default function GroupDetail() {
  const navigate = useNavigate();
  const groupId = new URLSearchParams(useLocation().search).get("id");
  const { data: me } = useCurrentUser();
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ title: "", content: "" });

  useSeo(group ? { title: `${group.name} — KamboGuide`, description: group.description } : {});

  const load = async () => {
    if (!groupId) { navigate(createPageUrl("Community")); return; }
    const [g] = await Group.filter({ id: groupId });
    if (!g) { navigate(createPageUrl("Community")); return; }
    setGroup(g);
    const [mem, ps] = await Promise.all([
      GroupMembership.filter({ group_id: groupId }),
      Post.filter({ group_id: groupId }, "-created_date"),
    ]);
    setMembers(mem);
    setPosts(ps);
    if (me) setMembershipId((mem.find((m: any) => m.user_id === me.id) || {}).id || null);
    setLoading(false);
  };
  useEffect(() => { load(); }, [groupId, me?.id]);

  const toggleJoin = async () => {
    if (!me) { await User.login(); return; }
    setBusy(true);
    try {
      if (membershipId) {
        await GroupMembership.delete(membershipId);
        await Group.update(group.id, { member_count: Math.max(0, (group.member_count || 1) - 1) });
        setMembershipId(null);
      } else {
        const rec = await GroupMembership.create({ group_id: group.id, user_id: me.id, user_name: me.full_name, role: "member" });
        await Group.update(group.id, { member_count: (group.member_count || 0) + 1 });
        setMembershipId(rec.id);
      }
      load();
    } finally { setBusy(false); }
  };

  const post = async () => {
    if (!me) { await User.login(); return; }
    if (!draft.title.trim() || !draft.content.trim()) return;
    setBusy(true);
    try {
      await Post.create({
        title: draft.title, content: draft.content, author_id: me.id, author_name: me.full_name,
        category: "General Discussion", group_id: group.id,
      });
      setDraft({ title: "", content: "" });
      load();
    } finally { setBusy(false); }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const joined = !!membershipId;

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <PageBreadcrumbs
        className="mb-4"
        items={[
          { label: "Community", to: createPageUrl("Community") },
          { label: "Groups", to: createPageUrl("Community") },
          { label: group.name },
        ]}
      />

      <Card className="mb-6 overflow-hidden">
        {group.image_url && <div className="h-32 bg-muted"><img loading="lazy" src={group.image_url} alt={group.name} className="h-full w-full object-cover" /></div>}
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold">{group.name} {group.is_private && <Badge variant="secondary" className="ml-2 gap-1"><Lock className="h-3 w-3" /> Private</Badge>}</h1>
              <p className="mt-1 text-muted-foreground">{group.description}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground"><UsersThree className="h-4 w-4" weight="duotone" /> {group.member_count || members.length} members</span>
            </div>
            <Button variant={joined ? "outline" : "default"} disabled={busy} onClick={toggleJoin} className="gap-1.5">
              {joined ? <><Check className="h-4 w-4" weight="bold" /> Joined</> : <><Plus className="h-4 w-4" weight="bold" /> Join</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {joined && (
        <Card className="mb-6">
          <CardContent className="space-y-3 p-4">
            <h2 className="font-semibold">Start a discussion</h2>
            <Input placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <Textarea placeholder="Share something with the group…" value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} className="min-h-[90px]" />
            <div className="flex justify-end">
              <Button onClick={post} disabled={busy || !draft.title.trim() || !draft.content.trim()}>Post</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <h2 className="mb-3 font-semibold">Discussions ({posts.length})</h2>
      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">No posts yet. {joined ? "Be the first!" : "Join to start a discussion."}</div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <Card key={p.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => navigate(createPageUrl(`Post?id=${p.id}`))}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7"><AvatarFallback>{(p.author_name || "?")[0]}</AvatarFallback></Avatar>
                  <span className="text-sm font-medium">{p.author_name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{p.created_date ? formatDate(p.created_date) : ""}</span>
                </div>
                <h3 className="mt-2 font-semibold">{p.title}</h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">{p.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
