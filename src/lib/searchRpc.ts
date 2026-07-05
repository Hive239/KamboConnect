import { supabase } from "@/lib/supabase";

/**
 * Keyless practitioner search via the Postgres `search_practitioners` RPC
 * (full-text + typo-tolerant trigram). Returns matching rows, or null when the RPC
 * is unavailable so callers can fall back to the client-side substring filter.
 */
export async function searchPractitioners(q: string): Promise<any[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc("search_practitioners", { q: q || "" });
    if (error) return null;
    return Array.isArray(data) ? data : [];
  } catch {
    return null;
  }
}
