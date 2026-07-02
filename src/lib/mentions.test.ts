import { describe, it, expect } from 'vitest';
import { parseMentions } from './mentions';

const people = [
  { id: 'u1', name: 'Maria Santos' },
  { id: 'u2', name: 'Mar' },
  { id: 'u3', name: 'Daniel Okafor' },
];

describe('parseMentions', () => {
  it('matches a full name after @', () => {
    const m = parseMentions('thanks @Maria Santos for the tip', people);
    expect(m.map((x) => x.id)).toEqual(['u1']);
  });
  it('is case-insensitive and matches multiple', () => {
    const m = parseMentions('cc @daniel okafor and @Maria Santos', people);
    expect(m.map((x) => x.id).sort()).toEqual(['u1', 'u3']);
  });
  it('does not partial-match a longer name', () => {
    // "@Mar" should match u2 (Mar) exactly, not u1 (Maria Santos)
    const m = parseMentions('hi @Mar', people);
    expect(m.map((x) => x.id)).toEqual(['u2']);
  });
  it('returns nothing without @', () => {
    expect(parseMentions('no mentions here', people)).toEqual([]);
  });
});
