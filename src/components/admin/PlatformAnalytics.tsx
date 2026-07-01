import { useEffect, useState } from "react";
import { computePlatformAnalytics, TIER_PRICES, type PlatformAnalytics as PA } from "@/lib/analytics";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GeoMap from "./GeoMap";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, Legend, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import {
  DollarSign, Users, ShieldCheck, Briefcase, TrendingUp, Star, Globe, Loader2, Storefront, Calendar,
} from "@/lib/icons";

const PIE = ["hsl(var(--primary))", "hsl(var(--clay))", "hsl(var(--info))", "hsl(var(--warning))"];

function Kpi({ icon: Icon, label, value, sub, accent }: any) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <Icon className={`h-7 w-7 ${accent || "text-primary"}`} weight="duotone" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlatformAnalytics() {
  const [a, setA] = useState<PA | null>(null);

  useEffect(() => { computePlatformAnalytics().then(setA).catch(() => setA(null)); }, []);

  if (!a) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const tierRows = (["featured", "preferred", "basic"] as const).map((t) => ({
    tier: t, count: a.practitioners.tiers[t] || 0, price: TIER_PRICES[t], mrr: a.practitioners.tierRevenue[t] || 0,
  }));

  return (
    <div className="space-y-8">
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

      {/* Geo */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><Globe className="h-5 w-5 text-primary" weight="duotone" /> Global footprint</h2>
        {a.geo.length ? <GeoMap points={a.geo} /> : <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">No geo-located practitioners yet.</div>}
      </section>
    </div>
  );
}
