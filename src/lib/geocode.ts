/**
 * Address → coordinates via OpenStreetMap Nominatim (free, no API key).
 * Cached in-memory + throttled to respect Nominatim's ~1 req/sec policy.
 * Always resolves (returns null on failure) so callers never block a save.
 */
import type { Address } from '@/types/entities';

export interface GeoResult { lat: number; lng: number }

const cache = new Map<string, GeoResult | null>();
let lastCall = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function addressToQuery(a?: Address | null): string {
  if (!a) return '';
  return [a.street, a.city, a.state_province, a.postal_code, a.country]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(', ');
}

/** Geocode an address. Returns null if empty/unresolvable. */
export async function geocodeAddress(address?: Address | null): Promise<GeoResult | null> {
  const q = addressToQuery(address);
  // Require at least a city-level query to avoid meaningless hits.
  if (!q || q.length < 3) return null;
  if (cache.has(q)) return cache.get(q)!;

  // Throttle to stay under Nominatim's rate limit.
  const wait = 1100 - (Date.now() - lastCall);
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const hit = Array.isArray(data) ? data[0] : null;
    const result: GeoResult | null =
      hit && hit.lat && hit.lon ? { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) } : null;
    cache.set(q, result);
    return result;
  } catch {
    cache.set(q, null);
    return null;
  }
}

/** Convenience: returns {latitude, longitude} spread-ready for a Practitioner update. */
export async function geocodeToLatLng(
  address?: Address | null,
): Promise<{ latitude?: number; longitude?: number }> {
  const geo = await geocodeAddress(address);
  return geo ? { latitude: geo.lat, longitude: geo.lng } : {};
}
