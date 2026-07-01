import { User, Practitioner, Booking, Payment, Subscription, Review, Consultation, Event, Order } from "@/entities/all";

/** Platform economics. */
export const PLATFORM_FEE_RATE = 0.05; // platform keeps 5% of each paid session
export const TIER_PRICES: Record<string, number> = { basic: 0, preferred: 29, featured: 49 };
export const TIER_ORDER = ["basic", "preferred", "featured"] as const;

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (d: Date) => d.toLocaleString("en", { month: "short" });

function lastNMonths(n: number) {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: monthKey(d), label: monthLabel(d) });
  }
  return out;
}

export interface PlatformAnalytics {
  users: { total: number; clients: number; practitioners: number; admins: number; newThisMonth: number };
  practitioners: { total: number; verified: number; pending: number; rejected: number; tiers: Record<string, number>; tierRevenue: Record<string, number> };
  clients: { total: number; active: number; repeat: number; newThisMonth: number };
  bookings: { total: number; paid: number; completed: number; pending: number; cancelled: number; gmv: number; avgValue: number };
  revenue: { sessionFees: number; practitionerPayouts: number; subscriptionMRR: number; total: number; annualRunRate: number; byMonth: { month: string; sessions: number; subscriptions: number; total: number }[]; bySource: { name: string; value: number }[] };
  funnel: { signups: number; consultations: number; bookings: number; completed: number; reviews: number };
  quality: { avgRating: number; reviews: number; ratingDist: { rating: string; count: number }[] };
  marketplace: { orders: number; gmv: number };
  events: { total: number; upcoming: number };
  geo: { lat: number; lng: number; type: "practitioner"; label: string; weight: number; tier?: string }[];
}

/** Loads everything and computes the full platform analytics snapshot. */
export async function computePlatformAnalytics(): Promise<PlatformAnalytics> {
  const [profiles, pracs, bookings, payments, subs, reviews, consults, events, orders] = await Promise.all([
    User.list().catch(() => []),
    Practitioner.list().catch(() => []),
    Booking.list().catch(() => []),
    Payment.list().catch(() => []),
    Subscription.list().catch(() => []),
    Review.list().catch(() => []),
    Consultation.list().catch(() => []),
    Event.list().catch(() => []),
    Order.list().catch(() => []),
  ]);

  const now = new Date();
  const thisMonthKey = monthKey(now);
  const inThisMonth = (r: any) => r.created_date && monthKey(new Date(r.created_date)) === thisMonthKey;

  // Users
  const role = (u: any) => u.role || "client";
  const admins = profiles.filter((u: any) => role(u) === "admin").length;
  const practitionerUsers = profiles.filter((u: any) => role(u) === "practitioner").length;
  const clients = profiles.filter((u: any) => role(u) === "client" || role(u) === "user").length;

  // Practitioners (from listings — source of truth for tiers/verification)
  const verified = pracs.filter((p: any) => p.is_verified).length;
  const pending = pracs.filter((p: any) => p.verification_level === "pending").length;
  const rejected = pracs.filter((p: any) => p.verification_level === "rejected").length;
  const tiers: Record<string, number> = { basic: 0, preferred: 0, featured: 0 };
  pracs.forEach((p: any) => { const t = p.listing_tier && tiers[p.listing_tier] !== undefined ? p.listing_tier : "basic"; tiers[t] += 1; });
  const tierRevenue: Record<string, number> = {
    basic: tiers.basic * TIER_PRICES.basic,
    preferred: tiers.preferred * TIER_PRICES.preferred,
    featured: tiers.featured * TIER_PRICES.featured,
  };

  // Bookings + GMV (paid sessions)
  const isPaid = (b: any) => b.payment_status === "paid";
  const paidBookings = bookings.filter(isPaid);
  const gmv = paidBookings.reduce((s: number, b: any) => s + (b.price || 0), 0);
  const bk = {
    total: bookings.length,
    paid: paidBookings.length,
    completed: bookings.filter((b: any) => b.status === "completed").length,
    pending: bookings.filter((b: any) => b.status === "pending").length,
    cancelled: bookings.filter((b: any) => b.status === "cancelled" || b.status === "declined").length,
    gmv,
    avgValue: paidBookings.length ? Math.round(gmv / paidBookings.length) : 0,
  };

  // Revenue
  const sessionFees = Math.round(gmv * PLATFORM_FEE_RATE);
  const practitionerPayouts = Math.round(gmv * (1 - PLATFORM_FEE_RATE));
  const activeSubs = subs.filter((s: any) => s.status === "active");
  const subscriptionMRR = activeSubs.reduce((s: number, x: any) => s + (x.price || TIER_PRICES[x.tier] || 0), 0)
    || (tierRevenue.preferred + tierRevenue.featured); // fallback from tier counts
  const totalRev = sessionFees + subscriptionMRR;

  // Revenue by month (last 6)
  const months = lastNMonths(6);
  const byMonth = months.map((m) => {
    const monthSessions = paidBookings.filter((b: any) => b.created_date && monthKey(new Date(b.created_date)) === m.key)
      .reduce((s: number, b: any) => s + (b.price || 0) * PLATFORM_FEE_RATE, 0);
    const monthSubs = payments.filter((p: any) => p.payment_type === "subscription" && p.created_date && monthKey(new Date(p.created_date)) === m.key)
      .reduce((s: number, p: any) => s + (p.amount || 0), 0);
    return { month: m.label, sessions: Math.round(monthSessions), subscriptions: Math.round(monthSubs || (m.key === thisMonthKey ? subscriptionMRR : 0)), total: Math.round(monthSessions + (monthSubs || (m.key === thisMonthKey ? subscriptionMRR : 0))) };
  });

  // Clients
  const bookerIds = bookings.map((b: any) => b.client_id).filter(Boolean);
  const bookingsPerClient = new Map<string, number>();
  bookerIds.forEach((id: string) => bookingsPerClient.set(id, (bookingsPerClient.get(id) || 0) + 1));
  const clientStats = {
    total: clients,
    active: bookingsPerClient.size,
    repeat: [...bookingsPerClient.values()].filter((n) => n > 1).length,
    newThisMonth: profiles.filter((u: any) => (role(u) === "client" || role(u) === "user") && inThisMonth(u)).length,
  };

  // Quality
  const ratings = reviews.map((r: any) => r.overall_rating || r.rating).filter((n: any) => typeof n === "number");
  const avgRating = ratings.length ? Math.round((ratings.reduce((s: number, n: number) => s + n, 0) / ratings.length) * 10) / 10 : 0;
  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({ rating: `${r}★`, count: ratings.filter((n: number) => Math.round(n) === r).length }));

  // Geo (practitioners with coords; weight = their booking count)
  const bookingsByPrac = new Map<string, number>();
  bookings.forEach((b: any) => bookingsByPrac.set(b.practitioner_id, (bookingsByPrac.get(b.practitioner_id) || 0) + 1));
  const geo = pracs
    .filter((p: any) => typeof p.latitude === "number" && typeof p.longitude === "number")
    .map((p: any) => ({ lat: p.latitude, lng: p.longitude, type: "practitioner" as const, label: p.full_name, weight: bookingsByPrac.get(p.id) || 1, tier: p.listing_tier }));

  return {
    users: { total: profiles.length, clients, practitioners: practitionerUsers || pracs.length, admins, newThisMonth: profiles.filter(inThisMonth).length },
    practitioners: { total: pracs.length, verified, pending, rejected, tiers, tierRevenue },
    clients: clientStats,
    bookings: bk,
    revenue: { sessionFees, practitionerPayouts, subscriptionMRR, total: totalRev, annualRunRate: totalRev * 12, byMonth, bySource: [{ name: "Session fees (5%)", value: sessionFees }, { name: "Subscriptions", value: subscriptionMRR }] },
    funnel: { signups: profiles.length, consultations: consults.length, bookings: bookings.length, completed: bk.completed, reviews: reviews.length },
    quality: { avgRating, reviews: reviews.length, ratingDist },
    marketplace: { orders: orders.length, gmv: orders.reduce((s: number, o: any) => s + (o.total || 0), 0) },
    events: { total: events.length, upcoming: events.filter((e: any) => e.start_date && new Date(e.start_date) >= now).length },
    geo,
  };
}
