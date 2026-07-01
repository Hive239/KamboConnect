import { describe, it, expect } from 'vitest';
import { googleCalendarUrl, buildIcs } from './calendar';

const ev = {
  title: 'Kambo Circle',
  details: 'Morning ceremony',
  location: 'Sedona, AZ',
  start: '2026-08-01T15:00:00.000Z',
  end: '2026-08-01T17:00:00.000Z',
};

describe('googleCalendarUrl', () => {
  it('builds a render-template URL with encoded title and dates', () => {
    const url = googleCalendarUrl(ev);
    expect(url).toContain('https://calendar.google.com/calendar/render');
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('text=Kambo+Circle');
    expect(url).toContain('dates=20260801T150000Z%2F20260801T170000Z');
  });

  it('defaults the end time to 90 minutes after start when omitted', () => {
    const url = googleCalendarUrl({ title: 'X', start: '2026-08-01T15:00:00.000Z' });
    expect(url).toContain('dates=20260801T150000Z%2F20260801T163000Z');
  });
});

describe('buildIcs', () => {
  it('produces a valid VEVENT block with escaped fields', () => {
    const ics = buildIcs({ ...ev, details: 'a; b, c' });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:Kambo Circle');
    expect(ics).toContain('DTSTART:20260801T150000Z');
    expect(ics).toContain('DTEND:20260801T170000Z');
    expect(ics).toContain('DESCRIPTION:a\\; b\\, c');
    expect(ics).toContain('END:VCALENDAR');
  });
});
