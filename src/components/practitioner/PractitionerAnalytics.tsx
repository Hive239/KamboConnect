import { useEffect, useState } from "react";
import { computePractitionerAnalytics, type PractitionerAnalytics as PA } from "@/lib/practitionerAnalytics";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/StatCard";
import { Eye, Calendar, DollarSign, Star, Loader2, TrendingUp, Users } from "@/lib/icons";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid } from "recharts";

export default function PractitionerAnalytics({ practitionerId }: { practitionerId: string }) {
  const [a, setA] = useState<PA | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    computePractitionerAnalytics(practitionerId)
      .then((r) => { if (active) setA(r); })
      .catch(() => { if (active) setA(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [practitionerId]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!a) return <p className="py-8 text-center text-muted-foreground">No analytics available yet.</p>;

  return (
    <div className="space-y-6 py-2">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Eye} label="Profile views" value={a.profileViews} sub={`${a.viewsThisMonth} this month`} />
        <StatCard icon={TrendingUp} label="View→booking" value={`${a.conversionRate}%`} sub="conversion" color="text-info" />
        <StatCard icon={DollarSign} label="Earnings" value={formatCurrency(a.earningsTotal)} sub="all time" color="text-success" />
        <StatCard icon={Star} label="Avg rating" value={a.avgRating || "—"} sub={`${a.reviews} reviews`} color="text-clay" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Calendar} label="Bookings" value={a.bookingsTotal} sub={`${a.completed} completed`} />
        <StatCard icon={Calendar} label="Upcoming" value={a.upcoming} sub="pending/confirmed" color="text-info" />
        <StatCard icon={Users} label="Repeat clients" value={a.repeatClients} sub="booked 2+ times" color="text-success" />
        <StatCard icon={Star} label="Reviews" value={a.reviews} sub="total" color="text-clay" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Bookings & earnings (6 mo)</CardTitle></CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.byMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} />
                <RTooltip />
                <Bar dataKey="bookings" name="Bookings" fill="#0b3a2a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="earnings" name="Earnings ($)" fill="#c98a3a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Profile views & rating trend</CardTitle></CardHeader>
          <CardContent style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={a.byMonth.map((m, i) => ({ ...m, rating: a.ratingTrend[i]?.rating || 0 }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} />
                <RTooltip />
                <Line type="monotone" dataKey="views" name="Views" stroke="#2a7de1" strokeWidth={2} />
                <Line type="monotone" dataKey="rating" name="Rating" stroke="#c98a3a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
