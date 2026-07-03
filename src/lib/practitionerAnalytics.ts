import { Booking, Payment, Review, ActivityEvent } from "@/entities/all";

const DAY = 86400000;
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (d: Date) => d.toLocaleString("en", { month: "short" });
function lastNMonths(n: number) {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); out.push({ key: monthKey(d), label: monthLabel(d) }); }
  return out;
}

export interface PractitionerAnalytics {
  profileViews: number;
  viewsThisMonth: number;
  bookingsTotal: number;
  completed: number;
  upcoming: number;
  conversionRate: number;       // bookings ÷ profile views
  earningsTotal: number;
  avgRating: number;
  reviews: number;
  repeatClients: number;
  byMonth: { month: string; bookings: number; earnings: number; views: number }[];
  ratingTrend: { month: string; rating: number }[];
}

/** Per-practitioner analytics from live Booking / Payment / Review / ActivityEvent data. */
export async function computePractitionerAnalytics(practitionerId: string): Promise<PractitionerAnalytics> {
  const [bookings, payments, reviews, views] = await Promise.all([
    Booking.filter({ practitioner_id: practitionerId }).catch(() => []),
    Payment.filter({ practitioner_id: practitionerId }).catch(() => []),
    Review.filter({ practitioner_id: practitionerId }).catch(() => []),
    ActivityEvent.filter({ type: "profile_viewed", entity_id: practitionerId }).catch(() => []),
  ]);

  const now = new Date();
  const thisMonth = monthKey(now);
  const profileViews = views.length;
  const viewsThisMonth = views.filter((v: any) => v.created_date && monthKey(new Date(v.created_date)) === thisMonth).length;
  const completed = bookings.filter((b: any) => b.status === "completed").length;
  const upcoming = bookings.filter((b: any) => ["pending", "confirmed"].includes(b.status)).length;
  const earningsTotal = Math.round(payments.filter((p: any) => p.payment_status === "completed").reduce((s: number, p: any) => s + (p.amount || 0), 0));
  const ratingVals = reviews.map((r: any) => r.overall_rating || r.rating).filter((n: any) => typeof n === "number");
  const avgRating = ratingVals.length ? Math.round((ratingVals.reduce((s: number, n: number) => s + n, 0) / ratingVals.length) * 10) / 10 : 0;
  const clientIds = new Set<string>();
  const repeat = new Set<string>();
  bookings.forEach((b: any) => { if (!b.client_id) return; if (clientIds.has(b.client_id)) repeat.add(b.client_id); else clientIds.add(b.client_id); });

  const months = lastNMonths(6);
  const byMonth = months.map((m) => ({
    month: m.label,
    bookings: bookings.filter((b: any) => b.created_date && monthKey(new Date(b.created_date)) === m.key).length,
    earnings: Math.round(payments.filter((p: any) => p.payment_status === "completed" && p.created_date && monthKey(new Date(p.created_date)) === m.key).reduce((s: number, p: any) => s + (p.amount || 0), 0)),
    views: views.filter((v: any) => v.created_date && monthKey(new Date(v.created_date)) === m.key).length,
  }));
  const ratingTrend = months.map((m) => {
    const rs = reviews.filter((r: any) => r.created_date && monthKey(new Date(r.created_date)) === m.key).map((r: any) => r.overall_rating || r.rating).filter((n: any) => typeof n === "number");
    return { month: m.label, rating: rs.length ? Math.round((rs.reduce((s: number, n: number) => s + n, 0) / rs.length) * 10) / 10 : 0 };
  });

  return {
    profileViews, viewsThisMonth,
    bookingsTotal: bookings.length, completed, upcoming,
    conversionRate: profileViews > 0 ? Math.round((bookings.length / profileViews) * 100) : 0,
    earningsTotal, avgRating, reviews: reviews.length,
    repeatClients: repeat.size,
    byMonth, ratingTrend,
  };
}
