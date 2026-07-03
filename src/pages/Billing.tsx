import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Practitioner, Booking, Payment, Review, Subscription, Notification } from "@/entities/all";
import { resolvePractitionerForUser } from "@/lib/practitionerForUser";
import { startCheckout } from "@/integrations/Payments";
import { computeReputation } from "@/lib/reputation";
import { formatCurrency } from "@/lib/format";
import { useSeo } from "@/lib/useSeo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Trophy, Star, Briefcase, DollarSign, Loader2 } from "@/lib/icons";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip, CartesianGrid } from "recharts";

const TIERS = [
  { id: "basic", name: "Basic", price: 0, blurb: "Your verified listing in the directory.", features: ["Verified badge", "Directory listing", "Client messaging"] },
  { id: "preferred", name: "Preferred", price: 29, blurb: "Stand out with priority placement.", features: ["Everything in Basic", "Preferred badge & placement", "Profile gallery & video", "Analytics dashboard"] },
  { id: "featured", name: "Featured", price: 49, blurb: "Maximum visibility & growth tools.", features: ["Everything in Preferred", "Top spotlight placement", "Priority in matchmaking", "Lead inbox & promo tools"] },
];

export default function Billing() {
  useSeo({ title: "Billing & Growth — KamboGuide" });
  const navigate = useNavigate();
  const [prac, setPrac] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [stats, setStats] = useState({ bookings: 0, earnings: 0, rating: 0, reviews: 0, chart: [] as any[] });
  const [sub, setSub] = useState<any>(null);

  const load = async () => {
    const me = await User.me().catch(() => null);
    if (!me) { navigate("/Directory"); return; }
    const mine = await resolvePractitionerForUser(me);
    if (!mine) { setLoading(false); return; }
    setPrac(mine);
    const [bookings, payments, reviews, subs] = await Promise.all([
      Booking.filter({ practitioner_id: mine.id }), Payment.filter({ practitioner_id: mine.id }), Review.filter({ practitioner_id: mine.id }),
      Subscription.filter({ practitioner_id: mine.id }, "-created_date").catch(() => []),
    ]);
    setSub((subs as any[]).find((s) => s.status === "active") || subs[0] || null);
    const earnings = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const rep = computeReputation(reviews as any);
    // last 6 months booking counts
    const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - (5 - i)); return { key: d.toLocaleString("en", { month: "short" }), ts: d.getFullYear() * 12 + d.getMonth(), count: 0 }; });
    bookings.forEach((b: any) => { const d = new Date(b.created_date); const k = d.getFullYear() * 12 + d.getMonth(); const m = months.find((x) => x.ts === k); if (m) m.count += 1; });
    setStats({ bookings: bookings.length, earnings, rating: rep.score, reviews: rep.reviewCount, chart: months.map((m) => ({ month: m.key, bookings: m.count })) });
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const upgrade = async (tier: any) => {
    if (!prac) return;
    setUpgrading(tier.id);
    try {
      // Paid tiers go through checkout; a real Stripe session redirects (webhook
      // then activates the subscription). Free tier applies immediately.
      if (tier.price > 0) {
        const result = await startCheckout({
          amount: tier.price, currency: "USD", description: `${tier.name} subscription`,
          metadata: { kind: "subscription", practitioner_id: prac.id, tier: tier.id },
          successPath: "/Billing?paid=1", cancelPath: "/Billing?canceled=1",
        });
        if (result.mode === "redirect") { window.location.href = result.url; return; }
        await Payment.create({ user_id: prac.id, practitioner_id: prac.id, amount: tier.price, currency: "USD", payment_type: "subscription", payment_status: "completed", stripe_payment_id: result.charge.id, payment_date: new Date().toISOString() });
      }
      await Practitioner.update(prac.id, { listing_tier: tier.id });
      await Subscription.create({ practitioner_id: prac.id, tier: tier.id, status: "active", price: tier.price, currency: "USD", period: "monthly", current_period_end: new Date(Date.now() + 30 * 86400000).toISOString() });
      await Notification.create({ user_id: prac.id, title: `Upgraded to ${tier.name}`, message: `Your listing is now ${tier.name}.`, type: "system", priority: "normal", action_url: "/Billing" });
      setPrac({ ...prac, listing_tier: tier.id });
    } finally { setUpgrading(null); }
  };

  const cancelPlan = async () => {
    if (!prac || !sub) return;
    if (!confirm("Cancel your subscription? Your listing reverts to Basic at the end of the period.")) return;
    setUpgrading("cancel");
    try {
      await Subscription.update(sub.id, { status: "cancelled", canceled_at: new Date().toISOString() });
      await Practitioner.update(prac.id, { listing_tier: "basic" });
      await Notification.create({ user_id: prac.id, title: "Subscription cancelled", message: "Your listing has reverted to Basic.", type: "system", priority: "normal", action_url: "/Billing" });
      setSub({ ...sub, status: "cancelled" });
      setPrac({ ...prac, listing_tier: "basic" });
    } finally { setUpgrading(null); }
  };

  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!prac) return <div className="mx-auto max-w-2xl p-8 text-center"><Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" weight="duotone" /><h1 className="text-xl font-semibold">Practitioners only</h1><p className="mt-1 text-muted-foreground">Create a practitioner profile to access growth tools.</p><Button className="mt-4" onClick={() => navigate("/PractitionerApplication")}>Become a practitioner</Button></div>;

  const statCards = [
    { label: "Total bookings", value: stats.bookings, icon: Briefcase },
    { label: "Earnings", value: formatCurrency(stats.earnings), icon: DollarSign },
    { label: "Reputation", value: stats.rating || "—", icon: Star },
    { label: "Reviews", value: stats.reviews, icon: CheckCircle },
  ];

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8">
      <PageHeader icon={Trophy} kicker="Growth" title="Billing & Growth" subtitle="Your plan, performance, and growth tools." className="-mx-4 -mt-4 mb-6 sm:-mx-8 sm:-mt-8" />

      {/* Analytics */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s, i) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} color={(["primary", "success", "warning", "info"] as const)[i % 4]} />
        ))}
      </div>
      <Card className="mb-8">
        <CardHeader><CardTitle className="text-base">Bookings — last 6 months</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Plans */}
      <h2 className="mb-2 text-lg font-semibold">Your plan</h2>
      {sub && sub.status === "active" && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Current plan: <span className="font-medium capitalize text-foreground">{sub.tier}</span>
            {sub.price ? ` · $${sub.price}/mo` : " · Free"}
            {sub.current_period_end ? ` · renews ${new Date(sub.current_period_end).toLocaleDateString()}` : ""}
          </p>
          {sub.price > 0 && (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={upgrading === "cancel"} onClick={cancelPlan}>
              Cancel plan
            </Button>
          )}
        </div>
      )}
      <Reveal stagger className="grid gap-5 md:grid-cols-3">
        {TIERS.map((t) => {
          const current = prac.listing_tier === t.id;
          return (
            <Reveal.Item key={t.id}>
            <Card className={current ? "border-primary ring-1 ring-primary" : ""}>
              <CardContent className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-display text-xl font-semibold">{t.name}</h3>
                  {t.id === "featured" && <Badge variant="featured">Best</Badge>}
                </div>
                <p className="mb-4 text-sm text-muted-foreground">{t.blurb}</p>
                <p className="mb-4 font-display text-3xl font-semibold">{t.price === 0 ? "Free" : <>{formatCurrency(t.price)}<span className="text-sm font-normal text-muted-foreground">/mo</span></>}</p>
                <ul className="mb-6 space-y-2">
                  {t.features.map((f) => <li key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-success" weight="fill" /> {f}</li>)}
                </ul>
                {current ? (
                  <Button variant="outline" className="w-full" disabled>Current plan</Button>
                ) : (
                  <Button className="w-full gap-2" disabled={upgrading === t.id} onClick={() => upgrade(t)}>
                    {upgrading === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {t.price === 0 ? "Switch to Verified" : `Upgrade to ${t.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
            </Reveal.Item>
          );
        })}
      </Reveal>
    </div>
  );
}
