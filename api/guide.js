// Vercel serverless function: real AI answer for "Ask the Guide".
// Backends, in priority order:
//   1. ANTHROPIC_API_KEY  → Anthropic Messages API (works on Vercel cloud).
//   2. local `claude` CLI → used when the CLI is installed (local `vercel dev` or a
//      self-hosted server). No API key needed. NOT available on Vercel's cloud.
//   3. neither            → { skipped:true }; the client falls back to the built-in
//      heuristic guide (still real practitioner matches, just no LLM prose).
// Safety-first system prompt — never medical advice.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileP = promisify(execFile);

const SYSTEM = `You are "the Guide" for KamboGuide, a marketplace that connects people with Kambo practitioners.
Rules you MUST follow:
- Kambo is a TRADITIONAL Amazonian practice, NOT a medical treatment. Never present it as medical care.
- NEVER give medical advice, diagnosis, or dosage. Do not claim it treats/cures any condition.
- For any health question, urge the person to disclose it to a qualified practitioner and consult their own doctor, and mention a health screening + informed-consent waiver is required before any session.
- Be warm, concise (2-4 short paragraphs), and calm. Encourage using verified practitioners on the platform.
- Common contraindications to mention when relevant: serious heart conditions, pregnancy/breastfeeding, epilepsy, certain medications (SSRIs, benzodiazepines, blood-pressure meds), recent chemotherapy, and being under 18 — but a practitioner must screen them.
- Do not fabricate specific practitioner names, prices, or statistics.
- Answer ONLY the user's question as the Guide. Do not use tools, do not write code, do not read files.
End health-related answers by noting this is educational information, not medical advice.`;

/** Try the Anthropic HTTP API. Returns answer text or null. */
async function viaApi(messages) {
  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return null;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 600, system: SYSTEM, messages }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return null;
    const answer = (j.content || []).map((c) => c.text || '').join('').trim();
    return answer || null;
  } catch { return null; }
}

/** Try a self-hosted "guide sidecar" (a box running server/guide-cli-server.mjs with
 *  the claude CLI). Lets the Vercel cloud function get CLI-backed answers. Returns null
 *  when GUIDE_PROXY_URL isn't configured or the call fails. */
async function viaProxy(message, history) {
  const url = process.env.GUIDE_PROXY_URL;
  const secret = process.env.GUIDE_PROXY_SECRET;
  if (!url) return null;
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(secret ? { authorization: `Bearer ${secret}` } : {}) },
      body: JSON.stringify({ message, history }),
    });
    const j = await r.json().catch(() => ({}));
    return j?.answer ? String(j.answer) : null;
  } catch { return null; }
}

/** Try the local `claude` CLI (print mode). Returns answer text or null.
 *  Uses execFile with an args array (no shell) so the user message can't inject commands. */
async function viaCli(message, history) {
  try {
    const convo = (Array.isArray(history) ? history.slice(-6) : [])
      .map((h) => `${h.role === 'user' ? 'User' : 'Guide'}: ${String(h.text || '').slice(0, 800)}`)
      .join('\n');
    const prompt = (convo ? convo + '\n' : '') + `User: ${message}\nGuide:`;
    const { stdout } = await execFileP(
      'claude',
      ['-p', prompt, '--system-prompt', SYSTEM],
      { timeout: 45000, maxBuffer: 1024 * 1024, windowsHide: true },
    );
    const answer = (stdout || '').trim();
    return answer || null;
  } catch { return null; } // CLI not installed (e.g. Vercel cloud) or errored
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const { message, history } = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) || {};
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'missing_message' });
  const msg = message.slice(0, 2000);

  const messages = [
    ...(Array.isArray(history) ? history.slice(-6).map((h) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: String(h.text || '').slice(0, 2000) })) : []),
    { role: 'user', content: msg },
  ];

  // 1) API key, 2) local CLI, 3) self-hosted sidecar proxy, 4) skip → client heuristic.
  const apiAnswer = await viaApi(messages);
  if (apiAnswer) return res.status(200).json({ answer: apiAnswer, via: 'api' });

  const cliAnswer = await viaCli(msg, history);
  if (cliAnswer) return res.status(200).json({ answer: cliAnswer, via: 'cli' });

  const proxyAnswer = await viaProxy(msg, history);
  if (proxyAnswer) return res.status(200).json({ answer: proxyAnswer, via: 'proxy' });

  return res.status(200).json({ skipped: true, reason: 'no ANTHROPIC_API_KEY, claude CLI, or GUIDE_PROXY_URL' });
}
