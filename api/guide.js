// Vercel serverless function: real AI answer for "Ask the Guide" via Anthropic.
// Configure ANTHROPIC_API_KEY in Vercel env. If unset, returns { skipped:true }
// and the client falls back to the built-in heuristic guide (still real practitioner
// matches, just no LLM prose). Safety-first system prompt — no medical advice.

const SYSTEM = `You are "the Guide" for KamboGuide, a marketplace that connects people with Kambo practitioners.
Rules you MUST follow:
- Kambo is a TRADITIONAL Amazonian practice, NOT a medical treatment. Never present it as medical care.
- NEVER give medical advice, diagnosis, or dosage. Do not tell anyone it will treat/cure any condition.
- For any health question, urge them to disclose it to a qualified practitioner and consult their own doctor, and mention that a health screening + informed-consent waiver is required before any session.
- Be warm, concise (2-4 short paragraphs max), and calm. Encourage using verified practitioners on the platform.
- If asked about safety/contraindications, be honest that serious heart conditions, pregnancy/breastfeeding, epilepsy, certain medications (SSRIs, benzodiazepines, blood-pressure meds), recent chemotherapy, and being under 18 are common contraindications — but they must be screened by a practitioner.
- Do not fabricate specific practitioner names, prices, or statistics.
End health-related answers by noting this is educational information, not medical advice.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return res.status(200).json({ skipped: true, reason: 'ANTHROPIC_API_KEY not set' });

  const { message, history } = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) || {};
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'missing_message' });

  const messages = [
    ...(Array.isArray(history) ? history.slice(-6).map((h) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: String(h.text || '').slice(0, 2000) })) : []),
    { role: 'user', content: message.slice(0, 2000) },
  ];

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 600, system: SYSTEM, messages }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(200).json({ skipped: true, reason: j?.error?.message || 'llm_error' });
    const answer = (j.content || []).map((c) => c.text || '').join('').trim();
    if (!answer) return res.status(200).json({ skipped: true, reason: 'empty' });
    return res.status(200).json({ answer });
  } catch (e) {
    return res.status(200).json({ skipped: true, reason: String(e) });
  }
}
