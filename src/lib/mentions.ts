/**
 * Find @mentions in text against a known set of people (thread participants).
 * Matches `@Full Name` (case-insensitive) — reliable without an autocomplete UI
 * because we only match names that already exist in the conversation.
 */
export function parseMentions(text: string, people: { id: string; name?: string }[]): { id: string; name?: string }[] {
  if (!text || !text.includes("@")) return [];
  const found = new Map<string, { id: string; name?: string }>();
  for (const p of people) {
    if (!p.name || !p.id) continue;
    const esc = p.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // @Name not immediately followed by another word char (so "@Mar" doesn't match "Maria").
    const re = new RegExp("@" + esc + "\\b", "i");
    if (re.test(text)) found.set(p.id, p);
  }
  return [...found.values()];
}
