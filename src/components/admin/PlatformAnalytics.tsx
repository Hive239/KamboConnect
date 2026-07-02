import { useEffect, useState } from "react";
import { computePlatformAnalytics, TIER_PRICES, type PlatformAnalytics as PA } from "@/lib/analytics";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/StatCard";
import { AreaChartGlow } from "@/components/ui/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import GeoMap from "./GeoMap";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, Legend, PieChart, Pie, Cell, CartesianGrid, LineChart, Line,
} from "recharts";
import {
  DollarSign, Users, ShieldCheck, Briefcase, TrendingUp, Star, Globe, Loader2, Storefront, Calendar, Download,
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

export default function PlatformAnalytics() {
  const [a, setA] = useState<PA | null>(null);

  useEffect(() => { computePlatformAnalytics().then(setA).catch(() => setA(null)); }, []);

  if (!a) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const tierRows = (["featured", "preferred", "basic"] as const).map((t) => ({
    tier: t, count: a.practitioners.tiers[t] || 0, price: TIER_PRICES[t], mrr: a.practitioners.tierRevenue[t] || 0,
  }));

  const exportCsv = () => {
    const rows: [string, string | number][] = [
      ["Platform revenue / mo", a.revenue.total], ["Session fees (5%)", a.revenue.sessionFees],
      ["Subscription MRR", a.revenue.subscriptionMRR], ["Practitioner payouts", a.revenue.practitionerPayouts],
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Platform metrics, updated live.</p>
        <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2"><Download className="h-4 w-4" /> Export CSV</Button>
      </div>
      {/* Revenue KPIs */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><DollarSign className="h-5 w-5 text-primary" weight="duotone" /> Revenue</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={TrendingUp} label="Platform revenue / mo" value={formatCurrency(a.revenue.total)} sub={`${formatCurrency(a.revenue.annualRunRate)} annual run-rate`} />
          <Kpi icon={DollarSign} label="Session fees (5%)" value={formatCurrency(a.revenue.sessionFees)} sub={`from ${formatCurrency(a.bookings.gmv)} booked`} accent="text-clay" />
          <Kpi icon={Briefcase} label="Subscription MRR" value={formatCurrency(a.revenue.subscriptionMRR)} sub="practitioner tiers" accent="text-info" />
          <Kpi icon={DollarSign} label="Practitioner payouts" value={formatCurrency(a.revenue.practitionerPayouts)} sub="95% of sessions" accent="text-success" />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Revenue over time</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={a.revenue.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} />
                  <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="sessions" stackId="r" name="Session fees" fill="hsl(var(--clay))" />
                  <Bar dataKey="subscriptions" stackId="r" name="Subscriptions" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
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
                  <RTooltip formatter={(v: any) => formatCurrency(Number(v))} />
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
              { label: "Verified", value: a.practitioners.verified, cls: "bg-success" },
              { label: "Pending review", value: a.practitioners.pending, cls: "bg-warning" },
              { label: "Rejected", value: a.practitioners.rejected, cls: "bg-destructive" },
            ].map((r) => {
              const max = Math.max(1, a.practitioners.total);
              return (
                <div key={r.label}>
                  <div className="mb-1 flex justify-between text-sm"><span>{r.label}</span><span className="text-muted-foreground">{r.value}</span></div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className={`h-full ${r.cls}`} style={{ width: `${(r.value / max) * 100}%` }} /></div>
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
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${(r.value / max) * 100}%` }} /></div>
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
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.min(100, r.rate)}%` }} /></div>
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

      {/* Geo */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><Globe className="h-5 w-5 text-primary" weight="duotone" /> Global footprint</h2>
        {a.geo.length ? <GeoMap points={a.geo} /> : <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">No geo-located practitioners yet.</div>}
      </section>
    </div>
  );
}
