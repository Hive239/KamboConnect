import { useEffect, useState } from "react";
import { computePlatformAnalytics, TIER_PRICES, type PlatformAnalytics as PA } from "@/lib/analytics";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/StatCard";
import { AreaChartGlow, GLASS_TOOLTIP, GradientBar } from "@/components/ui/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import GeoMap from "./GeoMap";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, Legend, PieChart, Pie, Cell, CartesianGrid, LineChart, Line,
} from "recharts";
import {
  DollarSign, Users, ShieldCheck, Briefcase, TrendingUp, Star, Globe, Loader2, Storefront, Calendar, Download, GraduationCap,
} from "@/lib/icons";

const PIE = ["hsl(var(--primary))", "hsl(var(--clay))", "hsl(var(--info))", "hsl(var(--warning))"];

function Kpi({ icon, label, value, sub, accent }: any) {
  const color = /warning|amber|orange|yellow/.test(accent || "") ? "warning"
    : /info|blue/.test(accent || "") ? "info"
    : /success|green|emerald/.test(accent || "") ? "success"
    : /clay|red|rose|purple/.test(accent || "") ? "clay"
    : "primary";
  return <StatCard icon={icon} label={label} value={value} sub={sub} color={color} />;
}

const RANGES: { label: string; days: number | null }[] = [
  { label: "7d", days: 7 }, { label: "30d", days: 30 }, { label: "90d", days: 90 }, { label: "All", days: null },
];

function DeltaBadge({ d }: { d?: { pct: number | null } | null }) {
  if (!d || d.pct === null) return null;
  const up = d.pct >= 0;
  return <span className={`ml-2 text-xs font-medium ${up ? "text-success" : "text-destructive"}`}>{up ? "▲" : "▼"} {Math.abs(d.pct)}%</span>;
}

export default function PlatformAnalytics() {
  const [a, setA] = useState<PA | null>(null);
  const [rangeDays, setRangeDays] = useState<number | null>(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    computePlatformAnalytics({ sinceDays: rangeDays }).then(setA).catch(() => setA(null)).finally(() => setLoading(false));
  }, [rangeDays]);

  if (!a) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const tierRows = (["featured", "preferred", "basic"] as const).map((t) => ({
    tier: t, count: a.practitioners.tiers[t] || 0, price: TIER_PRICES[t], mrr: a.practitioners.tierRevenue[t] || 0,
  }));

  const exportCsv = () => {
    const rows: [string, string | number][] = [
      ["Platform revenue / mo", a.revenue.total], ["Session fees (5%)", a.revenue.sessionFees],
      ["Subscription MRR", a.revenue.subscriptionMRR], ["Coursework revenue", a.revenue.courseRevenue], ["Practitioner payouts", a.revenue.practitionerPayouts],
      ["Annual run-rate", a.revenue.annualRunRate], ["GMV (booked)", a.bookings.gmv],
      ["Total users", a.users.total], ["Clients", a.clients.total], ["Practitioners", a.practitioners.total],
      ["Verified", a.practitioners.verified], ["Pending", a.practitioners.pending],
      ["Tier basic", a.practitioners.tiers.basic], ["Tier preferred", a.practitioners.tiers.preferred], ["Tier featured", a.practitioners.tiers.featured],
      ["Bookings", a.bookings.total], ["Paid bookings", a.bookings.paid], ["Cancellation %", a.bookingHealth.cancellationRate], ["No-show %", a.bookingHealth.noShowRate],
      ["DAU", a.engagement.dau], ["WAU", a.engagement.wau], ["MAU", a.engagement.mau],
      ["Churn %", a.churn.churnRate], ["NRR %", a.churn.nrr], ["Avg client LTV", a.clientValue.avgLtv],
      ["Waiver completion %", a.safety.waiverCompletion], ["Screenings flagged %", a.safety.flaggedRate],
      ["Outstanding payouts", a.payouts.liability], ["Refunds", a.payouts.refunds],
    ];
    const csv = "Metric,Value\n" + rows.map(([k, v]) => `"${k}",${v}`).join("\n")
      + "\n\nTop practitioners,Earnings,Bookings,Rating\n" + a.leaderboard.map((p) => `"${p.name}",${p.earnings},${p.bookings},${p.rating}`).join("\n")
      + "\n\nRegion,Revenue,Practitioners,Bookings\n" + a.geoRevenue.map((g) => `"${g.region}",${g.revenue},${g.practitioners},${g.bookings}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url; el.download = `kamboguide-analytics-${new Date().toISOString().slice(0, 10)}.csv`; el.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Platform metrics, updated live. {loading && <Loader2 className="ml-1 inline h-3 w-3 animate-spin" />}
          {rangeDays && <span className="ml-1">Deltas compare the last {rangeDays}d vs the prior {rangeDays}d.</span>}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-border">
            {RANGES.map((r) => (
              <button key={r.label} onClick={() => setRangeDays(r.days)}
                className={`px-3 py-1.5 text-xs font-medium ${rangeDays === r.days ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
                {r.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2"><Download className="h-4 w-4" /> Export CSV</Button>
        </div>
      </div>
      {/* Period-over-period trends */}
      {a.deltas && (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Last {a.deltas.rangeDays}d vs prior {a.deltas.rangeDays}d</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              { label: "Revenue", d: a.deltas.revenue, fmt: (v: number) => formatCurrency(v) },
              { label: "GMV", d: a.deltas.gmv, fmt: (v: number) => formatCurrency(v) },
              { label: "Paid bookings", d: a.deltas.bookingsPaid, fmt: (v: number) => String(v) },
              { label: "New users", d: a.deltas.usersNew, fmt: (v: number) => String(v) },
              { label: "Enrollments", d: a.deltas.enrollments, fmt: (v: number) => String(v) },
            ].map((x) => (
              <div key={x.label}>
                <p className="text-xs text-muted-foreground">{x.label}</p>
                <p className="text-lg font-bold">{x.fmt(x.d.value)}<DeltaBadge d={x.d} /></p>
                <p className="text-[11px] text-muted-foreground">was {x.fmt(x.d.prevValue)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Revenue KPIs */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><DollarSign className="h-5 w-5 text-primary" weight="duotone" /> Revenue</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={TrendingUp} label="Platform revenue / mo" value={formatCurrency(a.revenue.total)} sub={`${formatCurrency(a.revenue.annualRunRate)} annual run-rate`} />
          <Kpi icon={DollarSign} label="Session fees (5%)" value={formatCurrency(a.revenue.sessionFees)} sub={`from ${formatCurrency(a.bookings.gmv)} booked`} accent="text-clay" />
          <Kpi icon={Briefcase} label="Subscription MRR" value={formatCurrency(a.revenue.subscriptionMRR)} sub="practitioner tiers" accent="text-info" />
          <Kpi icon={DollarSign} label="Coursework revenue" value={formatCurrency(a.revenue.courseRevenue)} sub="platform courses" accent="text-primary" />
          <Kpi icon={DollarSign} label="Practitioner payouts" value={formatCurrency(a.revenue.practitionerPayouts)} sub="95% of sessions" accent="text-success" />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Revenue over time</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={a.revenue.byMonth}>
                  <defs>
                    <linearGradient id="rev-clay" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--clay))" stopOpacity={0.95} /><stop offset="100%" stopColor="hsl(var(--clay))" stopOpacity={0.5} /></linearGradient>
                    <linearGradient id="rev-primary" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.95} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.5} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <RTooltip contentStyle={GLASS_TOOLTIP} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                  <Legend />
                  <Bar dataKey="sessions" stackId="r" name="Session fees" fill="url(#rev-clay)" />
                  <Bar dataKey="subscriptions" stackId="r" name="Subscriptions" fill="url(#rev-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Revenue by source</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={a.revenue.bySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {a.revenue.bySource.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                  </Pie>
                  <RTooltip formatter={(v: any) => formatCurrency(Number(v))} contentStyle={GLASS_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* People KPIs */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><Users className="h-5 w-5 text-primary" weight="duotone" /> People</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={Users} label="Total users" value={a.users.total} sub={`+${a.users.newThisMonth} this month`} />
          <Kpi icon={Users} label="Clients" value={a.clients.total} sub={`${a.clients.active} active · ${a.clients.repeat} repeat`} accent="text-info" />
          <Kpi icon={Briefcase} label="Practitioners" value={a.practitioners.total} sub={`${a.practitioners.verified} verified`} accent="text-clay" />
          <Kpi icon={Calendar} label="Bookings" value={a.bookings.total} sub={`${a.bookings.paid} paid · avg ${formatCurrency(a.bookings.avgValue)}`} accent="text-success" />
        </div>
      </section>

      {/* Practitioner tiers */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><Briefcase className="h-5 w-5 text-primary" weight="duotone" /> Practitioner tiers</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {tierRows.map((r) => (
            <Card key={r.tier}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Badge variant={r.tier === "featured" ? "featured" : r.tier === "preferred" ? "preferred" : "basic"} className="capitalize">{r.tier}</Badge>
                  <span className="text-sm text-muted-foreground">{r.price ? `${formatCurrency(r.price)}/mo` : "Free"}</span>
                </div>
                <p className="mt-3 text-3xl font-bold">{r.count}</p>
                <p className="text-sm text-muted-foreground">practitioners · {formatCurrency(r.mrr)} MRR</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Verification funnel + conversion funnel */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5 text-primary" weight="duotone" /> Onboarding & verification</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Verified", value: a.practitioners.verified, from: "hsl(var(--success))", to: "hsl(var(--success) / 0.55)" },
              { label: "Pending review", value: a.practitioners.pending, from: "hsl(var(--warning))", to: "hsl(var(--warning) / 0.55)" },
              { label: "Rejected", value: a.practitioners.rejected, from: "hsl(var(--destructive))", to: "hsl(var(--destructive) / 0.55)" },
            ].map((r) => {
              const max = Math.max(1, a.practitioners.total);
              return (
                <div key={r.label}>
                  <div className="mb-1 flex justify-between text-sm"><span>{r.label}</span><span className="text-muted-foreground">{r.value}</span></div>
                  <GradientBar value={r.value} max={max} from={r.from} to={r.to} />
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-5 w-5 text-primary" weight="duotone" /> Conversion funnel</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Signups", value: a.funnel.signups },
              { label: "Consultations", value: a.funnel.consultations },
              { label: "Bookings", value: a.funnel.bookings },
              { label: "Completed", value: a.funnel.completed },
              { label: "Reviews", value: a.funnel.reviews },
            ].map((r) => {
              const max = Math.max(1, a.funnel.signups);
              return (
                <div key={r.label}>
                  <div className="mb-1 flex justify-between text-sm"><span>{r.label}</span><span className="text-muted-foreground">{r.value}</span></div>
                  <GradientBar value={r.value} max={max} from="hsl(var(--primary))" to="hsl(var(--clay))" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      {/* Quality + marketplace/events */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Star className="h-5 w-5 text-warning" weight="fill" /> Review ratings ({a.quality.avgRating || "—"} avg)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={a.quality.ratingDist} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 12 }} /><YAxis type="category" dataKey="rating" tick={{ fontSize: 12 }} width={36} />
                <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--warning))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Kpi icon={Storefront} label="Marketplace GMV" value={formatCurrency(a.marketplace.gmv)} sub={`${a.marketplace.orders} orders`} accent="text-clay" />
          <Kpi icon={Calendar} label="Events" value={a.events.total} sub={`${a.events.upcoming} upcoming`} accent="text-info" />
        </div>
      </section>

      {/* Engagement */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><TrendingUp className="h-5 w-5 text-primary" weight="duotone" /> Engagement & retention</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={Users} label="Daily active" value={a.engagement.dau} />
          <Kpi icon={Users} label="Weekly active" value={a.engagement.wau} accent="text-info" />
          <Kpi icon={Users} label="Monthly active" value={a.engagement.mau} accent="text-clay" />
          <Kpi icon={TrendingUp} label="Median time-to-book" value={`${a.responsiveness.medianTimeToFirstBookingDays}d`} sub={`reply ${a.responsiveness.medianFirstReplyHrs}h`} accent="text-success" />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Active users (14 days)</CardTitle></CardHeader>
            <CardContent>
              <AreaChartGlow data={a.engagement.trend} xKey="day" height={200}
                series={[{ key: "users", color: "hsl(var(--primary))", label: "Active users" }]} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Repeat cohorts</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {a.retention.length ? a.retention.map((c) => (
                <div key={c.cohort} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{c.cohort}</span>
                  <span>{c.size} · {c.booked}% booked · {c.repeat}% repeat</span>
                </div>
              )) : <p className="text-muted-foreground">No cohort data yet.</p>}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Acquisition + churn + payouts */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Acquisition sources</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {a.acquisition.length ? a.acquisition.map((s) => (
              <div key={s.source} className="flex justify-between"><span className="capitalize text-muted-foreground">{s.source}</span><span>{s.count}</span></div>
            )) : <p className="text-muted-foreground">No attribution yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Subscription health</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Active</span><span>{a.churn.activeSubs}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cancelled</span><span>{a.churn.cancelledSubs}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Churn rate</span><span>{a.churn.churnRate}%</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Net revenue retention</span><span>{a.churn.nrr}%</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Payouts & refunds</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Outstanding payouts</span><span>{formatCurrency(a.payouts.liability)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Refunds issued</span><span>{formatCurrency(a.payouts.refunds)}</span></div>
          </CardContent>
        </Card>
      </section>

      {/* Funnel drop-off + booking health */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Funnel conversion</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {a.funnelRates.map((r) => (
              <div key={r.to}>
                <div className="mb-1 flex justify-between text-sm"><span>{r.from} → {r.to}</span><span className="text-muted-foreground">{r.rate}%</span></div>
                <GradientBar value={Math.min(100, r.rate)} max={100} from="hsl(var(--primary))" to="hsl(var(--clay))" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Booking health</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-2xl font-bold">{a.bookingHealth.cancellationRate}%</p><p className="text-muted-foreground">Cancellation</p></div>
            <div><p className="text-2xl font-bold">{a.bookingHealth.declineRate}%</p><p className="text-muted-foreground">Decline</p></div>
            <div><p className="text-2xl font-bold">{a.bookingHealth.noShowRate}%</p><p className="text-muted-foreground">No-show</p></div>
            <div><p className="text-2xl font-bold">{a.bookingHealth.avgLeadTimeDays}d</p><p className="text-muted-foreground">Avg lead time</p></div>
            <div><p className="text-2xl font-bold">{a.bookingHealth.avgTimeToConfirmHrs}h</p><p className="text-muted-foreground">Time to confirm</p></div>
            <div><p className="text-2xl font-bold">{formatCurrency(a.clientValue.avgLtv)}</p><p className="text-muted-foreground">Avg client LTV</p></div>
          </CardContent>
        </Card>
      </section>

      {/* Safety */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={ShieldCheck} label="Screenings flagged" value={`${a.safety.flaggedRate}%`} accent="text-warning" />
        <Kpi icon={ShieldCheck} label="Waiver completion" value={`${a.safety.waiverCompletion}%`} accent="text-success" />
        <Kpi icon={ShieldCheck} label="Credentials expiring" value={a.safety.credentialsExpiring} sub="within 60 days" accent="text-warning" />
        <Kpi icon={ShieldCheck} label="Credentials expired" value={a.safety.credentialsExpired} accent="text-destructive" />
      </section>

      {/* Leaderboard + geo revenue */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Top practitioners</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {a.leaderboard.length ? a.leaderboard.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="truncate">{i + 1}. {p.name}</span>
                <span className="text-muted-foreground">{formatCurrency(p.earnings)} · {p.bookings} bk{p.rating ? ` · ${p.rating}★` : ""}</span>
              </div>
            )) : <p className="text-muted-foreground">No data yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue by region</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {a.geoRevenue.length ? a.geoRevenue.map((g) => (
              <div key={g.region} className="flex items-center justify-between">
                <span className="truncate">{g.region}</span>
                <span className="text-muted-foreground">{formatCurrency(g.revenue)} · {g.practitioners} prac · {g.bookings} bk</span>
              </div>
            )) : <p className="text-muted-foreground">No data yet.</p>}
          </CardContent>
        </Card>
      </section>

      {/* Coursework */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><GraduationCap className="h-5 w-5 text-primary" weight="duotone" /> Coursework</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Enrollment & completion</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div><p className="text-2xl font-bold">{a.coursework.enrollments}</p><p className="text-muted-foreground">Enrollments</p></div>
                <div><p className="text-2xl font-bold">{a.coursework.completed}</p><p className="text-muted-foreground">Completed</p></div>
                <div><p className="text-2xl font-bold">{a.coursework.completionRate}%</p><p className="text-muted-foreground">Completion</p></div>
                <div><p className="text-2xl font-bold">{formatCurrency(a.coursework.revenue)}</p><p className="text-muted-foreground">Revenue</p></div>
              </div>
              <div className="space-y-2 border-t border-border pt-3">
                {a.coursework.byTrack.map((t) => (
                  <div key={t.track} className="flex items-center justify-between">
                    <span className="truncate pr-2">{t.title}</span>
                    <span className="text-muted-foreground">{t.enrollments} enrolled · {t.completed} done · {t.completionRate}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Lesson drop-off</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-xs">
              {a.coursework.dropoff.map((t) => (
                <div key={t.track}>
                  <p className="mb-1 font-medium">{t.track}</p>
                  {t.steps.map((s, i) => {
                    const top = t.steps[0]?.reached || 0;
                    const w = top ? Math.round((s.reached / top) * 100) : 0;
                    return (
                      <div key={i} className="mb-1 flex items-center gap-2">
                        <span className="w-40 shrink-0 truncate text-muted-foreground">{s.lesson}</span>
                        <div className="h-2 flex-1 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${w}%` }} /></div>
                        <span className="w-6 text-right">{s.reached}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
              {a.coursework.enrollments === 0 && <p className="text-muted-foreground">No enrollments yet.</p>}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Activity funnel + discovery */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><TrendingUp className="h-5 w-5 text-primary" weight="duotone" /> Activity funnel (from tracked events)</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle className="text-base">Conversion funnel</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {a.eventFunnel.map((s) => (
                <div key={s.step}>
                  <div className="mb-1 flex justify-between"><span>{s.step}</span><span className="text-muted-foreground">{s.count} · {s.rate}%</span></div>
                  <div className="h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${Math.min(100, s.rate)}%` }} /></div>
                </div>
              ))}
              <p className="pt-1 text-[11px] text-muted-foreground">Rates relative to top-of-funnel. Populate by using search/profile/booking flows.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Top searches</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              {a.topSearches.length ? a.topSearches.map((s) => (
                <div key={s.query} className="flex justify-between"><span className="truncate pr-2">{s.query}</span><span className="text-muted-foreground">{s.count}</span></div>
              )) : <p className="text-muted-foreground">No searches tracked yet.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Most-viewed practitioners</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              {a.topViewed.length ? a.topViewed.map((s) => (
                <div key={s.name} className="flex justify-between"><span className="truncate pr-2">{s.name}</span><span className="text-muted-foreground">{s.views} views</span></div>
              )) : <p className="text-muted-foreground">No profile views tracked yet.</p>}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Reliability & comms */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-primary" weight="duotone" /> Reliability & comms</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Errors (last 7 days)</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-3xl font-bold">{a.reliability.errors7d}</p>
              {a.reliability.topErrors.length ? a.reliability.topErrors.map((e, i) => (
                <div key={i} className="flex justify-between gap-2"><span className="truncate pr-2 text-muted-foreground">{e.message}</span><span>{e.count}</span></div>
              )) : <p className="text-muted-foreground">No errors logged.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Email engagement</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-center text-sm sm:grid-cols-4">
                <div><p className="text-2xl font-bold">{a.email.sent}</p><p className="text-muted-foreground">Sent</p></div>
                <div><p className="text-2xl font-bold">{a.email.failed}</p><p className="text-muted-foreground">Failed</p></div>
                <div><p className="text-2xl font-bold">{a.email.openRate}%</p><p className="text-muted-foreground">Open rate</p></div>
                <div><p className="text-2xl font-bold">{a.email.clickRate}%</p><p className="text-muted-foreground">Click rate</p></div>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">Opens/clicks require the Resend webhook configured.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Geo */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><Globe className="h-5 w-5 text-primary" weight="duotone" /> Global footprint</h2>
        {a.geo.length ? <GeoMap points={a.geo} /> : <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">No geo-located practitioners yet.</div>}
      </section>
    </div>
  );
}
