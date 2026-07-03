// KamboGuide — "guide sidecar" server.
// Run this on a machine/VPS where the `claude` CLI is installed AND authenticated.
// It exposes POST /guide → runs `claude -p` and returns the answer as JSON, so the
// public site (Vercel) can proxy to it and get real AI answers without an API key.
//
// SETUP (on the box):
//   npm i -g @anthropic-ai/claude-code       # install the CLI
//   claude                                    # log in once (interactive), or: claude setup-token
//   export GUIDE_SHARED_SECRET="<long-random-string>"   # must match Vercel's GUIDE_PROXY_SECRET
//   export PORT=8787
//   node server/guide-cli-server.mjs
// Keep it running with pm2 or systemd, and put HTTPS in front (Caddy / nginx / Cloudflare Tunnel).
//
// SECURITY: requires the shared-secret bearer header, caps request size, and never
// passes user input through a shell (execFile with an args array).

import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileP = promisify(execFile);

const PORT = Number(process.env.PORT || 8787);
const SECRET = process.env.GUIDE_SHARED_SECRET || '';

const SYSTEM = `You are "the Guide" for KamboGuide, a marketplace connecting people with Kambo practitioners.
- Kambo is a TRADITIONAL Amazonian practice, NOT medical treatment. Never present it as medical care.
- NEVER give medical advice, diagnosis, or dosage. Do not claim it treats/cures any condition.
- For health questions, urge disclosing to a qualified practitioner and consulting their own doctor; note a health screening + informed-consent waiver is required before any session.
- Warm, concise (2-4 short paragraphs). Encourage using verified practitioners.
- Do not fabricate practitioner names, prices, or statistics. Do not use tools or read files.
End health-related answers by noting this is educational information, not medical advice.`;

const send = (res, code, obj) => {
  res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
  res.end(JSON.stringify(obj));
};

const server = createServer((req, res) => {
  if (req.method !== 'POST' || !req.url.startsWith('/guide')) return send(res, 404, { error: 'not_found' });
  if (!SECRET || req.headers.authorization !== `Bearer ${SECRET}`) return send(res, 401, { error: 'unauthorized' });

  let body = '';
  let tooBig = false;
  req.on('data', (c) => { body += c; if (body.length > 12_000) { tooBig = true; req.destroy(); } });
  req.on('end', async () => {
    if (tooBig) return;
    try {
      const { message, history } = JSON.parse(body || '{}');
      if (!message || typeof message !== 'string') return send(res, 400, { error: 'missing_message' });
      const convo = (Array.isArray(history) ? history.slice(-6) : [])
        .map((h) => `${h.role === 'user' ? 'User' : 'Guide'}: ${String(h.text || '').slice(0, 800)}`).join('\n');
      const prompt = (convo ? convo + '\n' : '') + `User: ${message.slice(0, 2000)}\nGuide:`;
      const { stdout } = await execFileP('claude', ['-p', prompt, '--system-prompt', SYSTEM],
        { timeout: 45000, maxBuffer: 1024 * 1024, windowsHide: true });
      const answer = (stdout || '').trim();
      return answer ? send(res, 200, { answer, via: 'cli' }) : send(res, 200, { skipped: true });
    } catch (e) {
      return send(res, 200, { skipped: true, reason: String(e).slice(0, 200) });
    }
  });
});

server.listen(PORT, () => console.log(`[guide-sidecar] listening on :${PORT} (secret ${SECRET ? 'set' : 'MISSING — set GUIDE_SHARED_SECRET'})`));
