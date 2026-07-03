import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface AnalyticsOverview {
  usersTotal: number; usersNew: number; clients: number; practitioners: number; admins: number;
  bookingsTotal: number; bookingsPaid: number; bookingsCompleted: number; gmv: number;
  subscriptionMRR: number; courseRevenue: number; enrollments: number; refunds: number;
  dau: number; wau: number; mau: number;
  evSearch: number; evView: number; evBookStart: number; evBookDone: number;
  errors7d: number; emailSent: number; emailFailed: number; emailOpened: number; emailClicked: number;
}

/**
 * Server-side aggregate for a window via the `kg_analytics_overview` SQL function.
 * Returns null when Supabase isn't configured or the RPC/migration isn't present —
 * callers then fall back to client-side compute.
 */
export async function callAnalyticsRpc(since: Date, until: Date): Promise<AnalyticsOverview | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.rpc("kg_analytics_overview", {
      since: since.toISOString(),
      until: until.toISOString(),
    });
    if (error || !data) return null;
    return data as AnalyticsOverview;
  } catch {
    return null;
  }
}
