import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Group, GroupMembership, Post, User, Notification } from "@/entities/all";
import { toast } from "sonner";
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

  const reqRef = useRef(0);
  const load = async () => {
    if (!groupId) { navigate(createPageUrl("Community")); return; }
    const myReq = ++reqRef.current; // ignore stale responses on fast group switches
    try {
      const [g] = await Group.filter({ id: groupId });
      if (myReq !== reqRef.current) return;
      if (!g) { navigate(createPageUrl("Community")); return; }
      setGroup(g);
      const [mem, ps] = await Promise.all([
        GroupMembership.filter({ group_id: groupId }),
        Post.filter({ group_id: groupId }, "-created_date"),
      ]);
      if (myReq !== reqRef.current) return;
      setMembers(mem);
      setPosts(ps);
      if (me) setMembershipId((mem.find((m: any) => m.user_id === me.id) || {}).id || null);
    } catch (e) {
      if (myReq === reqRef.current) console.error("Failed to load group:", e);
    } finally {
      if (myReq === reqRef.current) setLoading(false);
    }
  };
  useEffect(() => { load(); }, [groupId, me?.id]);

  const myMembership = members.find((m: any) => m.user_id === me?.id);
  const myStatus = myMembership ? (myMembership.status || "active") : null; // legacy rows → active
  const isActiveMember = myStatus === "active";
  const isPending = myStatus === "pending";
  const isManager = me?.role === "admin" || myMembership?.role === "owner" || myMembership?.role === "moderator";
  const isPrivate = !!group?.is_private;
  const canViewContent = !isPrivate || isActiveMember || isManager;
  const pendingRequests = members.filter((m: any) => m.status === "pending");
  const activeMembers = members.filter((m: any) => (m.status || "active") === "active");

  const toggleJoin = async () => {
    if (!me) { await User.login(); return; }
    setBusy(true);
    try {
      if (myMembership) {
        // An owner can't just leave — they'd orphan the group.
        if (myMembership.role === "owner") {
          toast.error("As the owner you can't leave. Transfer ownership or delete the group first.");
          setBusy(false);
          return;
        }
        const verb = isPending ? "Cancel your request to join" : "Leave";
        if (!window.confirm(`${verb} "${group.name}"?`)) { setBusy(false); return; }
        await GroupMembership.delete(myMembership.id);
        if (isActiveMember) await Group.update(group.id, { member_count: Math.max(0, (group.member_count || 1) - 1) });
        setMembershipId(null);
      } else if (isPrivate) {
        // Request to join — pending until an owner/moderator approves.
        await GroupMembership.create({ group_id: group.id, user_id: me.id, user_name: me.full_name, role: "member", status: "pending" });
        if (group.created_by && group.created_by !== me.id) {
          await Notification.create({ user_id: group.created_by, title: "New join request", message: `${me.full_name} asked to join "${group.name}".`, type: "community", related_id: group.id, action_url: createPageUrl(`GroupDetail?id=${group.id}`) }).catch(() => {});
        }
        toast.success("Request sent — you'll be notified when it's approved.");
      } else {
        const rec = await GroupMembership.create({ group_id: group.id, user_id: me.id, user_name: me.full_name, role: "member", status: "active" });
        await Group.update(group.id, { member_count: (group.member_count || 0) + 1 });
        setMembershipId(rec.id);
      }
      load();
    } finally { setBusy(false); }
  };

  const approveRequest = async (m: any) => {
    setBusy(true);
    try {
      await GroupMembership.update(m.id, { status: "active" });
      await Group.update(group.id, { member_count: (group.member_count || 0) + 1 });
      await Notification.create({ user_id: m.user_id, title: "Request approved", message: `You're now a member of "${group.name}".`, type: "community", related_id: group.id, action_url: createPageUrl(`GroupDetail?id=${group.id}`) }).catch(() => {});
      load();
    } finally { setBusy(false); }
  };
  const denyRequest = async (m: any) => {
    setBusy(true);
    try { await GroupMembership.delete(m.id); load(); } finally { setBusy(false); }
  };
  const removeMember = async (m: any) => {
    if (!window.confirm(`Remove ${m.user_name || "this member"} from the group?`)) return;
    setBusy(true);
    try {
      await GroupMembership.delete(m.id);
      await Group.update(group.id, { member_count: Math.max(0, (group.member_count || 1) - 1) });
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
  if (!group) return (
    <div className="mx-auto max-w-3xl p-6 text-center text-muted-foreground">
      <p>This group couldn't be loaded.</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate(createPageUrl("Community"))}>Back to Community</Button>
    </div>
  );

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
            <Button variant={myMembership ? "outline" : "default"} disabled={busy} onClick={toggleJoin} className="gap-1.5">
              {isActiveMember ? <><Check className="h-4 w-4" weight="bold" /> Joined</>
                : isPending ? <>Requested</>
                : isPrivate ? <><Lock className="h-4 w-4" weight="bold" /> Request to join</>
                : <><Plus className="h-4 w-4" weight="bold" /> Join</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending join requests — owner/moderator only. */}
      {isManager && pendingRequests.length > 0 && (
        <Card className="mb-6 border-amber-200">
          <CardContent className="p-4">
            <h2 className="mb-3 font-semibold">Pending requests ({pendingRequests.length})</h2>
            <div className="space-y-2">
              {pendingRequests.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-sm font-medium">{m.user_name || "Member"}</span>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={busy} onClick={() => approveRequest(m)}>Approve</Button>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => denyRequest(m)}>Deny</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!canViewContent ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Lock className="h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-3 text-lg font-semibold">This is a private group</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{isPending ? "Your request is pending approval." : "Request to join to see discussions and members."}</p>
          {!myMembership && <Button className="mt-4 gap-1.5" onClick={toggleJoin} disabled={busy}><Lock className="h-4 w-4" /> Request to join</Button>}
        </div>
      ) : (
      <>
      {isActiveMember && (
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

      {activeMembers.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 font-semibold">Members ({group.member_count || activeMembers.length})</h2>
          <div className="flex flex-wrap gap-2">
            {activeMembers.slice(0, 24).map((m: any) => {
              const inner = (
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm">
                  <Avatar className="h-6 w-6"><AvatarFallback className="text-xs">{(m.user_name || "?")[0]}</AvatarFallback></Avatar>
                  <span className="text-foreground">{m.user_name || "Member"}</span>
                  {m.role && m.role !== "member" && <Badge variant="secondary" className="capitalize text-[10px]">{m.role}</Badge>}
                  {isManager && m.user_id !== me?.id && m.role !== "owner" && (
                    <button onClick={(e) => { e.preventDefault(); removeMember(m); }} aria-label={`Remove ${m.user_name}`} className="text-muted-foreground hover:text-destructive">✕</button>
                  )}
                </span>
              );
              return m.user_id ? (
                <Link key={m.id} to={createPageUrl(`UserProfile?id=${m.user_id}`)} className="hover:opacity-80">{inner}</Link>
              ) : (
                <span key={m.id}>{inner}</span>
              );
            })}
            {activeMembers.length > 24 && <span className="self-center text-sm text-muted-foreground">+{activeMembers.length - 24} more</span>}
          </div>
        </div>
      )}

      <h2 className="mb-3 font-semibold">Discussions ({posts.length})</h2>
      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">No posts yet. {isActiveMember ? "Be the first!" : "Join to start a discussion."}</div>
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
      </>
      )}
    </div>
  );
}
