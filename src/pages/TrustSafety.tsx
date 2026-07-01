import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModerationCase, Report, Credential, Review, Practitioner, User } from "@/entities/all";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShieldCheck, AlertTriangle, Flag, Clock, CheckCircle, XCircle } from "@/lib/icons";
import { useSeo } from "@/lib/useSeo";

export default function TrustSafety() {
  useSeo({ title: "Trust & Safety — KamboConnect" });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [expiring, setExpiring] = useState<any[]>([]);
  const [flaggedReviews, setFlaggedReviews] = useState<any[]>([]);

  const load = async () => {
    const me = await User.me().catch(() => null);
    if (!me || me.role !== "admin") { navigate("/Directory"); return; }
    const [mc, rp, creds, revs, pracs] = await Promise.all([
      ModerationCase.list("-created_date"), Report.list("-created_date"),
      Credential.list(), Review.filter({ flagged: true }), Practitioner.list(),
    ]);
    const pName = (id: string) => pracs.find((p: any) => p.id === id)?.full_name || "Practitioner";
    const soon = Date.now() + 45 * 86400000;
    setCases(mc.filter((c: any) => c.status === "open" || c.status === "reviewing"));
    setReports(rp.filter((r: any) => r.status === "pending" || r.status === "investigating"));
    setExpiring(creds.filter((c: any) => c.expiry_date && new Date(c.expiry_date).getTime() < soon).map((c: any) => ({ ...c, _name: pName(c.practitioner_id) })));
    setFlaggedReviews(revs);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const resolveCase = async (id: string, status: "actioned" | "dismissed") => {
    await ModerationCase.update(id, { status }); load();
  };
  const resolveReport = async (id: string, status: "resolved" | "dismissed") => {
    await Report.update(id, { status, resolved_date: new Date().toISOString() }); load();
  };

  const stats = [
    { label: "Open moderation", value: cases.length, icon: Flag, cls: "text-warning" },
    { label: "Pending reports", value: reports.length, icon: AlertTriangle, cls: "text-destructive" },
    { label: "Expiring credentials", value: expiring.length, icon: Clock, cls: "text-info" },
    { label: "Flagged reviews", value: flaggedReviews.length, icon: ShieldCheck, cls: "text-primary" },
  ];

  if (loading) return <div className="p-8 text-muted-foreground">Loading Trust & Safety…</div>;

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" weight="duotone" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold">Trust & Safety Center</h1>
          <p className="text-sm text-muted-foreground">Moderation, reports, and credential oversight.</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}><CardContent className="flex items-center justify-between p-4">
            <div><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
            <s.icon className={`h-6 w-6 ${s.cls}`} weight="duotone" />
          </CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="moderation">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto bg-muted p-1 rounded-xl">
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="reviews">Flagged reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="moderation" className="mt-4 space-y-3">
          {cases.length === 0 && <Empty label="No open moderation cases." />}
          {cases.map((c) => (
            <Card key={c.id}><CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant={c.source === "ai" ? "info" : "warning"}>{c.source === "ai" ? "AI-flagged" : c.source}</Badge>
                  <span className="text-sm font-medium capitalize">{c.subject_type}</span>
                  {typeof c.score === "number" && <span className="text-xs text-muted-foreground">risk {Math.round(c.score * 100)}%</span>}
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{c.snippet || c.reasons?.join(", ")}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => resolveCase(c.id, "dismissed")}><XCircle className="mr-1 h-4 w-4" />Dismiss</Button>
                <Button size="sm" onClick={() => resolveCase(c.id, "actioned")}><CheckCircle className="mr-1 h-4 w-4" />Action</Button>
              </div>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="reports" className="mt-4 space-y-3">
          {reports.length === 0 && <Empty label="No pending reports." />}
          {reports.map((r) => (
            <Card key={r.id}><CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant={r.priority === "high" || r.priority === "urgent" ? "destructive" : "warning"}>{r.priority || "low"}</Badge>
                  <span className="text-sm font-medium capitalize">{r.reason?.replace(/_/g, " ")}</span>
                  <span className="text-xs text-muted-foreground">· {r.reported_item_type}</span>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{r.description}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => resolveReport(r.id, "dismissed")}>Dismiss</Button>
                <Button size="sm" onClick={() => resolveReport(r.id, "resolved")}>Resolve</Button>
              </div>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="credentials" className="mt-4 space-y-3">
          {expiring.length === 0 && <Empty label="No credentials expiring soon." />}
          {expiring.map((c) => (
            <Card key={c.id}><CardContent className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-medium">{c._name} — {c.title}</p>
                <p className="text-xs text-muted-foreground">Expires {new Date(c.expiry_date).toLocaleDateString()}</p>
              </div>
              <Badge variant="warning">Renewal due</Badge>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="reviews" className="mt-4 space-y-3">
          {flaggedReviews.length === 0 && <Empty label="No flagged reviews." />}
          {flaggedReviews.map((r) => (
            <Card key={r.id}><CardContent className="p-4">
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="destructive">Flagged</Badge>
                <span className="text-sm font-medium">{r.reviewer_name}</span>
                <span className="text-xs text-muted-foreground">· {r.overall_rating}★</span>
              </div>
              <p className="text-sm text-muted-foreground">{r.review_text}</p>
            </CardContent></Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground"><CheckCircle className="mx-auto mb-2 h-8 w-8 text-success" weight="duotone" />{label}</div>;
}
