/**
 * Client-side "Add to Calendar" helpers — no backend required.
 * `googleCalendarUrl` opens a prefilled Google Calendar event; `downloadIcs`
 * produces an .ics file that works with Apple Calendar, Outlook, and Google.
 */

export interface CalendarEvent {
  title: string;
  details?: string;
  location?: string;
  start: Date | string;
  end?: Date | string;
}

const DEFAULT_DURATION_MS = 90 * 60 * 1000; // 90 minutes

function toDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

/** UTC timestamp in the compact form both Google and ICS expect: YYYYMMDDTHHMMSSZ. */
function toStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function resolveRange(ev: CalendarEvent): { start: Date; end: Date } {
  const start = toDate(ev.start);
  const end = ev.end ? toDate(ev.end) : new Date(start.getTime() + DEFAULT_DURATION_MS);
  return { start, end };
}

export function googleCalendarUrl(ev: CalendarEvent): string {
  const { start, end } = resolveRange(ev);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title || "Event",
    dates: `${toStamp(start)}/${toStamp(end)}`,
  });
  if (ev.details) params.set("details", ev.details);
  if (ev.location) params.set("location", ev.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Escape per RFC 5545 (commas, semicolons, backslashes, newlines). */
function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function buildIcs(ev: CalendarEvent): string {
  const { start, end } = resolveRange(ev);
  const uid = `${toStamp(start)}-${Math.abs(hashCode(ev.title))}@kamboguide`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KamboGuide//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toStamp(new Date(start))}`,
    `DTSTART:${toStamp(start)}`,
    `DTEND:${toStamp(end)}`,
    `SUMMARY:${escapeIcs(ev.title || "Event")}`,
    ev.details ? `DESCRIPTION:${escapeIcs(ev.details)}` : "",
    ev.location ? `LOCATION:${escapeIcs(ev.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < (s || "").length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
  return h;
}

export function downloadIcs(ev: CalendarEvent): void {
  const blob = new Blob([buildIcs(ev)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(ev.title || "event").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
