import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Group, GroupMembership, User, Notification } from "@/entities/all";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UsersThree, Check, Plus, Lock } from "@/lib/icons";
import { emitFeed } from "@/lib/feed";
import { toast } from "sonner";

export default function GroupsView() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<Record<string, string>>({}); // group_id -> membership id (active)
  const [pending, setPending] = useState<Set<string>>(new Set()); // group_ids with a pending request
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "", is_private: false });

  const createGroup = async () => {
    if (!me) { await User.login(); return; }
    if (!form.name.trim()) { toast.error("Give your group a name"); return; }
    setCreating(true);
    try {
      const g = await Group.create({
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim() || undefined,
        is_private: form.is_private,
        created_by: me.id,
        member_count: 1,
      });
      // Creator becomes the owner.
      await GroupMembership.create({ group_id: g.id, user_id: me.id, user_name: me.full_name, role: "owner" });
      toast.success("Group created");
      setShowCreate(false);
      setForm({ name: "", description: "", category: "", is_private: false });
      navigate(createPageUrl(`GroupDetail?id=${g.id}`));
    } catch (e) {
      console.error("Failed to create group:", e);
      toast.error("Couldn't create the group. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const u = await User.me().catch(() => null);
      setMe(u);
      const [gs, mine] = await Promise.all([Group.list("-member_count"), u ? GroupMembership.filter({ user_id: u.id }) : Promise.resolve([])]);
      setGroups(gs);
      // Active memberships → "Joined"; pending private-group requests → "Requested".
      setMemberships(Object.fromEntries((mine as any[]).filter((m) => (m.status || "active") === "active").map((m) => [m.group_id, m.id])));
      setPending(new Set((mine as any[]).filter((m) => m.status === "pending").map((m) => m.group_id)));
    } catch (e) {
      console.error("Failed to load groups:", e);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const toggle = async (g: any) => {
    if (!me) { await User.login(); return; }
    setBusy(g.id);
    try {
      const existing = memberships[g.id];
      if (existing) {
        await GroupMembership.delete(existing);
        await Group.update(g.id, { member_count: Math.max(0, (g.member_count || 1) - 1) });
        setMemberships((m) => { const n = { ...m }; delete n[g.id]; return n; });
        setGroups((gs) => gs.map((x) => (x.id === g.id ? { ...x, member_count: Math.max(0, (x.member_count || 1) - 1) } : x)));
        toast.success(`Left ${g.name}`);
      } else if (g.is_private) {
        // Private group → request to join (pending until approved); no count bump, no feed.
        const rec = await GroupMembership.create({ group_id: g.id, user_id: me.id, user_name: me.full_name, role: "member", status: "pending" });
        if (g.created_by && g.created_by !== me.id) {
          await Notification.create({ user_id: g.created_by, title: "New join request", message: `${me.full_name} asked to join "${g.name}".`, type: "community", related_id: g.id, action_url: `/GroupDetail?id=${g.id}` }).catch(() => {});
        }
        setMemberships((m) => ({ ...m, [g.id]: rec.id }));
        toast.success("Request sent — you'll be notified when it's approved.");
      } else {
        const rec = await GroupMembership.create({ group_id: g.id, user_id: me.id, user_name: me.full_name, role: "member", status: "active" });
        await Group.update(g.id, { member_count: (g.member_count || 0) + 1 });
        emitFeed({ actor_id: me.id, actor_name: me.full_name, actor_image_url: me.profile_image_url, verb: "joined_group", object_type: "group", object_id: g.id, summary: g.name, action_url: `/GroupDetail?id=${g.id}` });
        setMemberships((m) => ({ ...m, [g.id]: rec.id }));
        setGroups((gs) => gs.map((x) => (x.id === g.id ? { ...x, member_count: (x.member_count || 0) + 1 } : x)));
        toast.success(`Joined ${g.name}`);
      }
    } catch (err) {
      console.error("Failed to update group membership:", err);
      toast.error("Something went wrong. Please try again.");
    } finally { setBusy(null); }
  };

  if (loading) return <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}</div>;

  const openGroup = (g: any) => navigate(createPageUrl(`GroupDetail?id=${g.id}`));

  const header = (
    <div className="mb-5 flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{groups.length} {groups.length === 1 ? "group" : "groups"}</p>
      <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
        <Plus className="h-4 w-4" weight="bold" /> Create Group
      </Button>
    </div>
  );

  const createDialog = (
    <Dialog open={showCreate} onOpenChange={setShowCreate}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create a group</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="g-name">Name</Label>
            <Input id="g-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Integration Circle" className="mt-1" maxLength={80} />
          </div>
          <div>
            <Label htmlFor="g-desc">Description</Label>
            <Textarea id="g-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What's this group about?" className="mt-1" maxLength={500} />
          </div>
          <div>
            <Label htmlFor="g-cat">Category (optional)</Label>
            <Input id="g-cat" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Support, Local, Practice" className="mt-1" maxLength={40} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Private group</p>
              <p className="text-xs text-muted-foreground">Members must request to join</p>
            </div>
            <Switch checked={form.is_private} onCheckedChange={(v) => setForm((f) => ({ ...f, is_private: v }))} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createGroup} disabled={creating || !form.name.trim()}>{creating ? "Creating…" : "Create group"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (groups.length === 0) {
    return (
      <>
        {header}
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <UsersThree className="h-12 w-12 text-muted-foreground/40" weight="duotone" />
          <h3 className="mt-4 text-lg font-semibold">No groups yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">Be the first to start one for the community.</p>
        </div>
        {createDialog}
      </>
    );
  }

  return (
    <>
      {header}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) => {
        const joined = !!memberships[g.id];
        return (
          <Card
            key={g.id}
            role="button"
            tabIndex={0}
            aria-label={`Open ${g.name}`}
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => openGroup(g)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openGroup(g); } }}
          >
            <div className="relative h-28 bg-muted">
              {g.image_url && <img loading="lazy" src={g.image_url} alt={g.name} className="h-full w-full object-cover" />}
              {g.is_private && <Badge variant="secondary" className="absolute right-3 top-3 gap-1"><Lock className="h-3 w-3" /> Private</Badge>}
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold">{g.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{g.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><UsersThree className="h-4 w-4" weight="duotone" /> {g.member_count || 0} members</span>
                <Button size="sm" variant={joined || pending.has(g.id) ? "outline" : "default"} disabled={busy === g.id || pending.has(g.id)} onClick={(e) => { e.stopPropagation(); toggle(g); }} className="gap-1.5">
                  {joined ? <><Check className="h-4 w-4" weight="bold" /> Joined</> : pending.has(g.id) ? <>Requested</> : g.is_private ? <><Lock className="h-4 w-4" weight="bold" /> Request</> : <><Plus className="h-4 w-4" weight="bold" /> Join</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
      </div>
      {createDialog}
    </>
  );
}
