import { User, Practitioner, Booking, Payment, Subscription, Review, Consultation, Event, Order, Message, ConsentRecord, ScreeningResponse, Credential, ActivityEvent, CourseworkEnrollment, ErrorLog, EmailEvent } from "@/entities/all";
import { TRACKS, allLessons } from "@/data/coursework";
import { callAnalyticsRpc } from "@/lib/analyticsRpc";

export interface Delta { value: number; prevValue: number; pct: number | null }
const delta = (value: number, prevValue: number): Delta => ({
  value, prevValue, pct: prevValue > 0 ? Math.round(((value - prevValue) / prevValue) * 100) : (value > 0 ? 100 : 0),
});

const median = (arr: number[]) => { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);
const DAY = 86400000;

/** Platform economics. */
const PLATFORM_FEE_RATE = 0.05; // platform keeps 5% of each paid session
export const TIER_PRICES: Record<string, number> = { basic: 0, preferred: 29, featured: 49 };

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
  revenue: { sessionFees: number; practitionerPayouts: number; subscriptionMRR: number; courseRevenue: number; total: number; annualRunRate: number; byMonth: { month: string; sessions: number; subscriptions: number; total: number }[]; bySource: { name: string; value: number }[] };
  funnel: { signups: number; consultations: number; bookings: number; completed: number; reviews: number };
  quality: { avgRating: number; reviews: number; ratingDist: { rating: string; count: number }[] };
  marketplace: { orders: number; gmv: number };
  events: { total: number; upcoming: number };
  geo: { lat: number; lng: number; type: "practitioner"; label: string; weight: number; tier?: string }[];
  engagement: { dau: number; wau: number; mau: number; trend: { day: string; users: number }[] };
  acquisition: { source: string; count: number }[];
  churn: { activeSubs: number; cancelledSubs: number; churnRate: number; nrr: number };
  funnelRates: { from: string; to: string; rate: number }[];
  bookingHealth: { cancellationRate: number; declineRate: number; noShowRate: number; avgLeadTimeDays: number; avgTimeToConfirmHrs: number };
  leaderboard: { name: string; earnings: number; bookings: number; rating: number }[];
  geoRevenue: { region: string; practitioners: number; bookings: number; revenue: number }[];
  safety: { flaggedRate: number; waiverCompletion: number; credentialsExpiring: number; credentialsExpired: number };
  clientValue: { avgLtv: number; topClients: { name: string; spend: number }[] };
  retention: { cohort: string; size: number; booked: number; repeat: number }[];
  responsiveness: { medianFirstReplyHrs: number; medianTimeToFirstBookingDays: number };
  payouts: { liability: number; refunds: number };
  coursework: {
    enrollments: number; active: number; completed: number; completionRate: number; revenue: number;
    byTrack: { track: string; title: string; enrollments: number; completed: number; completionRate: number }[];
    dropoff: { track: string; steps: { lesson: string; reached: number }[] }[];
  };
  eventFunnel: { step: string; count: number; rate: number }[];
  topSearches: { query: string; count: number }[];
  topViewed: { name: string; views: number }[];
  reliability: { errors7d: number; topErrors: { message: string; count: number }[] };
  email: { sent: number; failed: number; opened: number; clicked: number; openRate: number; clickRate: number };
  deltas: { rangeDays: number | null; revenue: Delta; bookingsPaid: Delta; usersNew: Delta; gmv: Delta; enrollments: Delta } | null;
}

/** Loads everything and computes the full platform analytics snapshot.
 *  `opts.sinceDays` scopes the period-over-period deltas (default 30; null = all-time, no deltas). */
export async function computePlatformAnalytics(opts?: { sinceDays?: number | null }): Promise<PlatformAnalytics> {
  const rangeDays = opts?.sinceDays === undefined ? 30 : opts.sinceDays;
  const [profiles, pracs, bookings, payments, subs, reviews, consults, events, orders, messages, consents, screenings, credentials, activity] = await Promise.all([
    User.list().catch(() => []),
    Practitioner.list().catch(() => []),
    Booking.list().catch(() => []),
    Payment.list().catch(() => []),
    Subscription.list().catch(() => []),
    Review.list().catch(() => []),
    Consultation.list().catch(() => []),
    Event.list().catch(() => []),
    Order.list().catch(() => []),
    Message.list().catch(() => []),
    ConsentRecord.list().catch(() => []),
    ScreeningResponse.list().catch(() => []),
    Credential.list().catch(() => []),
    ActivityEvent.list("-created_date", 5000).catch(() => []),
  ]);
  const cwEnrollments = await CourseworkEnrollment.list().catch(() => []);
  const [errorLogs, emailEvents] = await Promise.all([
    ErrorLog.list("-created_date", 2000).catch(() => []),
    EmailEvent.list("-created_date", 5000).catch(() => []),
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
  // Coursework revenue — 100% platform revenue (KamboGuide's own courses).
  const courseRevenue = Math.round(payments
    .filter((p: any) => p.payment_type === "course" && p.payment_status !== "refunded" && p.payment_status !== "failed")
    .reduce((s: number, p: any) => s + (p.amount || 0), 0));
  const totalRev = sessionFees + subscriptionMRR + courseRevenue;

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

  // Engagement (DAU/WAU/MAU) from activity events
  const nowTs = now.getTime();
  const distinctUsersSince = (ms: number) => new Set(activity.filter((e: any) => e.created_date && nowTs - new Date(e.created_date).getTime() <= ms).map((e: any) => e.user_id)).size;
  const trend = lastNMonths(1).length ? Array.from({ length: 14 }, (_, i) => {
    const d = new Date(nowTs - (13 - i) * DAY); const key = d.toISOString().slice(0, 10);
    const users = new Set(activity.filter((e: any) => e.created_date && new Date(e.created_date).toISOString().slice(0, 10) === key).map((e: any) => e.user_id)).size;
    return { day: `${d.getMonth() + 1}/${d.getDate()}`, users };
  }) : [];
  const engagement = { dau: distinctUsersSince(DAY), wau: distinctUsersSince(7 * DAY), mau: distinctUsersSince(30 * DAY), trend };

  // Acquisition
  const acqMap = new Map<string, number>();
  profiles.forEach((u: any) => { const s = u.acquisition?.source || "direct"; acqMap.set(s, (acqMap.get(s) || 0) + 1); });
  const acquisition = [...acqMap.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);

  // Churn / NRR
  const cancelledSubs = subs.filter((s: any) => s.status === "cancelled").length;
  const everActive = activeSubs.length + cancelledSubs;
  const churnRate = pct(cancelledSubs, everActive);
  const churn = { activeSubs: activeSubs.length, cancelledSubs, churnRate, nrr: Math.max(0, 100 - churnRate) };

  // Funnel drop-off rates
  const fSteps = [["Signup", profiles.length], ["Consultation", consults.length], ["Booking", bookings.length], ["Completed", bk.completed], ["Review", reviews.length]] as [string, number][];
  const funnelRates = fSteps.slice(1).map((step, i) => ({ from: fSteps[i][0], to: step[0], rate: pct(step[1], fSteps[i][1]) }));

  // Booking health
  const declined = bookings.filter((b: any) => b.status === "declined").length;
  const cancelled = bookings.filter((b: any) => b.status === "cancelled").length;
  const noShows = bookings.filter((b: any) => b.status === "no_show").length;
  const leadTimes = bookings.filter((b: any) => b.created_date && b.requested_date).map((b: any) => (new Date(b.requested_date).getTime() - new Date(b.created_date).getTime()) / DAY).filter((d: number) => d >= 0);
  const confirmTimes = bookings.filter((b: any) => (b.status === "confirmed" || b.status === "completed") && b.created_date && b.updated_date).map((b: any) => (new Date(b.updated_date).getTime() - new Date(b.created_date).getTime()) / 3600000).filter((h: number) => h >= 0);
  const bookingHealth = { cancellationRate: pct(cancelled, bookings.length), declineRate: pct(declined, bookings.length), noShowRate: pct(noShows, bookings.length), avgLeadTimeDays: Math.round(median(leadTimes)), avgTimeToConfirmHrs: Math.round(median(confirmTimes)) };

  // Leaderboard
  const earnByPrac = new Map<string, number>();
  payments.forEach((p: any) => { if (p.practitioner_id && p.payment_type !== "subscription") earnByPrac.set(p.practitioner_id, (earnByPrac.get(p.practitioner_id) || 0) + (p.amount || 0)); });
  const leaderboard = pracs.map((p: any) => ({
    name: p.full_name, earnings: Math.round(earnByPrac.get(p.id) || 0), bookings: bookingsByPrac.get(p.id) || 0,
    rating: reviews.filter((r: any) => r.practitioner_id === p.id).reduce((s: number, r: any, _i: number, arr: any[]) => s + (r.overall_rating || r.rating || 0) / arr.length, 0),
  })).map((r: any) => ({ ...r, rating: Math.round(r.rating * 10) / 10 })).sort((a, b) => b.earnings - a.earnings).slice(0, 8);

  // Geographic revenue & supply
  const region = (p: any) => [p.address?.state_province, p.address?.country].filter(Boolean).join(", ") || "Unknown";
  const pracById = new Map(pracs.map((p: any) => [p.id, p]));
  const geoMap = new Map<string, { region: string; practitioners: number; bookings: number; revenue: number }>();
  pracs.forEach((p: any) => { const r = region(p); const g = geoMap.get(r) || { region: r, practitioners: 0, bookings: 0, revenue: 0 }; g.practitioners += 1; geoMap.set(r, g); });
  paidBookings.forEach((b: any) => { const p = pracById.get(b.practitioner_id); const r = p ? region(p) : "Unknown"; const g = geoMap.get(r) || { region: r, practitioners: 0, bookings: 0, revenue: 0 }; g.bookings += 1; g.revenue += (b.price || 0) * PLATFORM_FEE_RATE; geoMap.set(r, g); });
  const geoRevenue = [...geoMap.values()].map((g) => ({ ...g, revenue: Math.round(g.revenue) })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Safety
  const flaggedRate = pct(screenings.filter((s: any) => s.flagged).length, screenings.length);
  const waiverCompletion = pct(consents.length, bookings.length);
  const in60 = nowTs + 60 * DAY;
  const credentialsExpiring = credentials.filter((c: any) => c.expiry_date && new Date(c.expiry_date).getTime() > nowTs && new Date(c.expiry_date).getTime() <= in60).length;
  const credentialsExpired = credentials.filter((c: any) => c.expiry_date && new Date(c.expiry_date).getTime() <= nowTs).length;
  const safety = { flaggedRate, waiverCompletion, credentialsExpiring, credentialsExpired };

  // Client LTV
  const spendByClient = new Map<string, number>();
  payments.forEach((p: any) => { if (p.user_id && p.payment_type !== "subscription") spendByClient.set(p.user_id, (spendByClient.get(p.user_id) || 0) + (p.amount || 0)); });
  const nameById = new Map(profiles.map((u: any) => [u.id, u.full_name || u.email || "Client"]));
  const ltvs = [...spendByClient.values()];
  const clientValue = {
    avgLtv: ltvs.length ? Math.round(ltvs.reduce((s, n) => s + n, 0) / ltvs.length) : 0,
    topClients: [...spendByClient.entries()].map(([id, spend]) => ({ name: nameById.get(id) || "Client", spend: Math.round(spend) })).sort((a, b) => b.spend - a.spend).slice(0, 5),
  };

  // Cohort retention (by signup month)
  const cohortMap = new Map<string, { size: number; booked: Set<string>; repeat: Set<string> }>();
  profiles.filter((u: any) => role(u) === "client" || role(u) === "user").forEach((u: any) => {
    if (!u.created_date) return; const k = monthKey(new Date(u.created_date));
    const c = cohortMap.get(k) || { size: 0, booked: new Set(), repeat: new Set() }; c.size += 1;
    const n = bookingsPerClient.get(u.id) || 0; if (n >= 1) c.booked.add(u.id); if (n >= 2) c.repeat.add(u.id); cohortMap.set(k, c);
  });
  const retention = [...cohortMap.entries()].sort().slice(-6).map(([cohort, c]) => ({ cohort, size: c.size, booked: pct(c.booked.size, c.size), repeat: pct(c.repeat.size, c.size) }));

  // Responsiveness: median first practitioner reply + time-to-first-booking
  const pracUserIds = new Set(pracs.map((p: any) => p.id));
  const byConvo = new Map<string, any[]>();
  messages.forEach((m: any) => { if (!m.conversation_id) return; const a = byConvo.get(m.conversation_id) || []; a.push(m); byConvo.set(m.conversation_id, a); });
  const replyLatencies: number[] = [];
  byConvo.forEach((msgs) => {
    const sorted = msgs.filter((m: any) => m.created_date).sort((a: any, b: any) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());
    const firstClient = sorted.find((m: any) => !pracUserIds.has(m.sender_id));
    if (!firstClient) return;
    const reply = sorted.find((m: any) => pracUserIds.has(m.sender_id) && new Date(m.created_date).getTime() > new Date(firstClient.created_date).getTime());
    if (reply) replyLatencies.push((new Date(reply.created_date).getTime() - new Date(firstClient.created_date).getTime()) / 3600000);
  });
  const firstBookingByClient = new Map<string, number>();
  bookings.forEach((b: any) => { if (!b.client_id || !b.created_date) return; const t = new Date(b.created_date).getTime(); const cur = firstBookingByClient.get(b.client_id); if (cur === undefined || t < cur) firstBookingByClient.set(b.client_id, t); });
  const ttfb: number[] = [];
  profiles.forEach((u: any) => { const fb = firstBookingByClient.get(u.id); if (fb && u.created_date) { const d = (fb - new Date(u.created_date).getTime()) / DAY; if (d >= 0) ttfb.push(d); } });
  const responsiveness = { medianFirstReplyHrs: Math.round(median(replyLatencies) * 10) / 10, medianTimeToFirstBookingDays: Math.round(median(ttfb) * 10) / 10 };

  // Payouts & refunds
  const liability = Math.round(bookings.filter((b: any) => isPaid(b) && b.status !== "completed").reduce((s: number, b: any) => s + (b.price || 0) * (1 - PLATFORM_FEE_RATE), 0));
  const refunds = Math.round(payments.filter((p: any) => p.payment_status === "refunded").reduce((s: number, p: any) => s + (p.amount || 0), 0));

  // Coursework — enrollment, completion, per-lesson drop-off
  const paidEnr = cwEnrollments.filter((e: any) => e.status !== "pending");
  const cwCompleted = paidEnr.filter((e: any) => !!e.completed_at).length;
  const cwByTrack = TRACKS.map((t) => {
    const rows = paidEnr.filter((e: any) => e.track === t.id);
    const comp = rows.filter((e: any) => !!e.completed_at).length;
    return { track: t.id, title: t.title, enrollments: rows.length, completed: comp, completionRate: pct(comp, rows.length) };
  });
  const cwDropoff = TRACKS.map((t) => {
    const rows = paidEnr.filter((e: any) => e.track === t.id);
    const steps = allLessons(t).map((l) => ({
      lesson: l.title,
      reached: rows.filter((e: any) => e.progress?.[l.id]?.completed).length,
    }));
    return { track: t.title, steps };
  });
  const coursework = {
    enrollments: paidEnr.length,
    active: paidEnr.filter((e: any) => !e.completed_at).length,
    completed: cwCompleted,
    completionRate: pct(cwCompleted, paidEnr.length),
    revenue: courseRevenue,
    byTrack: cwByTrack,
    dropoff: cwDropoff,
  };
  const payoutsRefunds = { liability, refunds };

  // Event funnel (from typed activity events) — search → view → booking started → submitted → completed
  const evCount = (t: string) => activity.filter((e: any) => e.type === t).length;
  const fSearch = evCount("search_performed");
  const fView = evCount("profile_viewed");
  const fStart = evCount("booking_started");
  const fSubmit = evCount("booking_submitted");
  const fComplete = bk.completed;
  const funnelBase = fSearch || fView || fStart || 1;
  const eventFunnel = [
    { step: "Searches", count: fSearch },
    { step: "Profile views", count: fView },
    { step: "Booking started", count: fStart },
    { step: "Booking submitted", count: fSubmit },
    { step: "Completed", count: fComplete },
  ].map((s) => ({ ...s, rate: pct(s.count, funnelBase) }));

  // Top searches + most-viewed practitioners (from event meta / entity_id)
  const searchCounts = new Map<string, number>();
  activity.filter((e: any) => e.type === "search_performed" && e.meta?.query).forEach((e: any) => {
    const q = String(e.meta.query).toLowerCase().trim();
    searchCounts.set(q, (searchCounts.get(q) || 0) + 1);
  });
  const topSearches = [...searchCounts.entries()].map(([query, count]) => ({ query, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  const viewCounts = new Map<string, number>();
  activity.filter((e: any) => e.type === "profile_viewed" && e.entity_id).forEach((e: any) => viewCounts.set(e.entity_id, (viewCounts.get(e.entity_id) || 0) + 1));
  const pracName = new Map<string, string>(pracs.map((p: any) => [p.id, p.full_name]));
  const topViewed = [...viewCounts.entries()].map(([id, views]) => ({ name: pracName.get(id) || "Unknown", views })).sort((a, b) => b.views - a.views).slice(0, 8);

  // Reliability (errors) + email engagement
  const wk = now.getTime() - 7 * DAY;
  const errors7d = errorLogs.filter((e: any) => e.created_date && new Date(e.created_date).getTime() >= wk).length;
  const errMsg = new Map<string, number>();
  errorLogs.forEach((e: any) => { const m = (e.message || "unknown").slice(0, 80); errMsg.set(m, (errMsg.get(m) || 0) + 1); });
  const topErrors = [...errMsg.entries()].map(([message, count]) => ({ message, count })).sort((a, b) => b.count - a.count).slice(0, 6);
  const emailBy = (t: string) => emailEvents.filter((e: any) => e.type === t).length;
  const emSent = emailBy("sent"), emFailed = emailBy("failed"), emOpened = emailBy("opened"), emClicked = emailBy("clicked");
  const email = { sent: emSent, failed: emFailed, opened: emOpened, clicked: emClicked, openRate: pct(emOpened, emSent), clickRate: pct(emClicked, emSent) };

  // Period-over-period deltas — prefer server RPC; fall back to client compute.
  let deltas: PlatformAnalytics["deltas"] = null;
  if (rangeDays) {
    const until = now;
    const since = new Date(now.getTime() - rangeDays * DAY);
    const prevSince = new Date(now.getTime() - 2 * rangeDays * DAY);
    const inWin = (d: any, a: Date, b: Date) => d && new Date(d).getTime() >= a.getTime() && new Date(d).getTime() < b.getTime();
    const [cur, prev] = await Promise.all([callAnalyticsRpc(since, until), callAnalyticsRpc(prevSince, since)]);
    if (cur && prev) {
      deltas = {
        rangeDays,
        revenue: delta(cur.gmv * PLATFORM_FEE_RATE + cur.courseRevenue, prev.gmv * PLATFORM_FEE_RATE + prev.courseRevenue),
        bookingsPaid: delta(cur.bookingsPaid, prev.bookingsPaid),
        usersNew: delta(cur.usersNew, prev.usersNew),
        gmv: delta(cur.gmv, prev.gmv),
        enrollments: delta(cur.enrollments, prev.enrollments),
      };
    } else {
      // Client fallback
      const paidIn = (a: Date, b: Date) => paidBookings.filter((x: any) => inWin(x.created_date, a, b));
      const enrIn = (a: Date, b: Date) => paidEnr.filter((x: any) => inWin(x.created_date, a, b)).length;
      const usersIn = (a: Date, b: Date) => profiles.filter((x: any) => inWin(x.created_date, a, b)).length;
      const courseIn = (a: Date, b: Date) => payments.filter((p: any) => p.payment_type === "course" && p.payment_status !== "refunded" && inWin(p.created_date, a, b)).reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const gmvCur = paidIn(since, until).reduce((s: number, x: any) => s + (x.price || 0), 0);
      const gmvPrev = paidIn(prevSince, since).reduce((s: number, x: any) => s + (x.price || 0), 0);
      deltas = {
        rangeDays,
        revenue: delta(Math.round(gmvCur * PLATFORM_FEE_RATE + courseIn(since, until)), Math.round(gmvPrev * PLATFORM_FEE_RATE + courseIn(prevSince, since))),
        bookingsPaid: delta(paidIn(since, until).length, paidIn(prevSince, since).length),
        usersNew: delta(usersIn(since, until), usersIn(prevSince, since)),
        gmv: delta(Math.round(gmvCur), Math.round(gmvPrev)),
        enrollments: delta(enrIn(since, until), enrIn(prevSince, since)),
      };
    }
  }

  return {
    users: { total: profiles.length, clients, practitioners: practitionerUsers || pracs.length, admins, newThisMonth: profiles.filter(inThisMonth).length },
    practitioners: { total: pracs.length, verified, pending, rejected, tiers, tierRevenue },
    clients: clientStats,
    bookings: bk,
    revenue: { sessionFees, practitionerPayouts, subscriptionMRR, courseRevenue, total: totalRev, annualRunRate: totalRev * 12, byMonth, bySource: [{ name: "Session fees (5%)", value: sessionFees }, { name: "Subscriptions", value: subscriptionMRR }, { name: "Coursework", value: courseRevenue }] },
    funnel: { signups: profiles.length, consultations: consults.length, bookings: bookings.length, completed: bk.completed, reviews: reviews.length },
    quality: { avgRating, reviews: reviews.length, ratingDist },
    marketplace: { orders: orders.length, gmv: orders.reduce((s: number, o: any) => s + (o.total || 0), 0) },
    events: { total: events.length, upcoming: events.filter((e: any) => e.start_date && new Date(e.start_date) >= now).length },
    geo,
    engagement,
    acquisition,
    churn,
    funnelRates,
    bookingHealth,
    leaderboard,
    geoRevenue,
    safety,
    clientValue,
    retention,
    responsiveness,
    payouts: payoutsRefunds,
    coursework,
    eventFunnel, topSearches, topViewed,
    reliability: { errors7d, topErrors },
    email,
    deltas,
  };
}
