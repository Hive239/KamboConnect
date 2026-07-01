import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Group, GroupMembership, User } from "@/entities/all";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UsersThree, Check, Plus, Lock } from "@/lib/icons";
import { toast } from "sonner";

export default function GroupsView() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<Record<string, string>>({}); // group_id -> membership id
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const u = await User.me().catch(() => null);
    setMe(u);
    const [gs, mine] = await Promise.all([Group.list("-member_count"), u ? GroupMembership.filter({ user_id: u.id }) : Promise.resolve([])]);
    setGroups(gs);
    setMemberships(Object.fromEntries((mine as any[]).map((m) => [m.group_id, m.id])));
    setLoading(false);
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
      } else {
        const rec = await GroupMembership.create({ group_id: g.id, user_id: me.id, user_name: me.full_name, role: "member" });
        await Group.update(g.id, { member_count: (g.member_count || 0) + 1 });
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

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <UsersThree className="h-12 w-12 text-muted-foreground/40" weight="duotone" />
        <h3 className="mt-4 text-lg font-semibold">No groups yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">Community groups will appear here once they're created. Check back soon.</p>
      </div>
    );
  }

  const openGroup = (g: any) => navigate(createPageUrl(`GroupDetail?id=${g.id}`));

  return (
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
              {g.image_url && <img src={g.image_url} alt={g.name} className="h-full w-full object-cover" />}
              {g.is_private && <Badge variant="secondary" className="absolute right-3 top-3 gap-1"><Lock className="h-3 w-3" /> Private</Badge>}
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold">{g.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{g.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><UsersThree className="h-4 w-4" weight="duotone" /> {g.member_count || 0} members</span>
                <Button size="sm" variant={joined ? "outline" : "default"} disabled={busy === g.id} onClick={(e) => { e.stopPropagation(); toggle(g); }} className="gap-1.5">
                  {joined ? <><Check className="h-4 w-4" weight="bold" /> Joined</> : <><Plus className="h-4 w-4" weight="bold" /> Join</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
