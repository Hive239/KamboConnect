/**
 * Human-readable venue text for an event. The events table stores `address` as a
 * STRUCTURED jsonb object ({city, country, …}) and `location_details` as the
 * free-text venue; `location` is a legacy/mock string. Rendering the raw address
 * object crashes React ("Objects are not valid as a React child"), so always
 * resolve to a string through this helper.
 */
export function eventLocationText(e: any): string {
  if (!e) return "";
  if (e.is_online) return "Online";
  if (e.location_details) return String(e.location_details);
  if (typeof e.location === "string" && e.location) return e.location;
  const a = e.address;
  if (a && typeof a === "object") return [a.street, a.city, a.state_province, a.country].filter(Boolean).join(", ");
  if (typeof a === "string" && a) return a;
  return "";
}
