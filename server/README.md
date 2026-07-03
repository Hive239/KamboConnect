# Guide sidecar — CLI-backed AI for the live domain

Runs the `claude` CLI on a box you control so kamboguide.com's `/api/guide` can proxy
to it (real AI answers, no API key). See `guide-cli-server.mjs`.

## What only you can do (needs your accounts / a human login)
1. **A server**: any always-on Linux box (VPS ~$5/mo, or a spare machine).
2. **CLI login**: `claude` must be authenticated as you on that box (interactive, once).
3. **DNS/HTTPS**: expose it at a URL (Cloudflare Tunnel is easiest — no DNS edits needed).

## Setup (on the box) — copy/paste
```bash
# 1. Node 20+ and the CLI
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs
sudo npm i -g @anthropic-ai/claude-code pm2

# 2. Authenticate the CLI as you (interactive, once)
claude            # follow the login prompt, then Ctrl-C once you see the prompt
#   (or: claude setup-token)

# 3. Get this repo + a secret
git clone <your-repo-url> kamboguide && cd kamboguide
export GUIDE_SHARED_SECRET="$(openssl rand -hex 24)"; echo "SECRET=$GUIDE_SHARED_SECRET"   # save this

# 4. Run it persistently on :8787
GUIDE_SHARED_SECRET="$GUIDE_SHARED_SECRET" PORT=8787 pm2 start server/guide-cli-server.mjs --name guide-sidecar
pm2 save && pm2 startup    # run the command pm2 prints, so it survives reboot
```

## Expose over HTTPS (pick one)
**Cloudflare Tunnel (recommended — no open ports, no DNS editing):**
```bash
sudo npm i -g cloudflared        # or the apt package
cloudflared tunnel --url http://localhost:8787
# prints a public https URL like https://xxxx.trycloudflare.com  → your endpoint is that + /guide
```
**or systemd instead of pm2:** see `guide-sidecar.service` in this folder.

## Wire it to the live site (Vercel)
Set two env vars (Vercel dashboard → Settings → Environment Variables, or the CLI):
```bash
vercel env add GUIDE_PROXY_URL production      # value: https://<your-url>/guide
vercel env add GUIDE_PROXY_SECRET production    # value: the GUIDE_SHARED_SECRET from step 3
vercel --prod                                   # redeploy
```
Now kamboguide.com's Guide answers via your box (`via: "proxy"`). Verify:
```bash
curl -s -X POST https://<your-url>/guide -H "authorization: Bearer $GUIDE_SHARED_SECRET" \
  -H 'content-type: application/json' -d '{"message":"is kambo safe in pregnancy?"}'
```

## Notes
- Keep `GUIDE_SHARED_SECRET` private (it's the only thing stopping others from using your Claude account).
- CLI tokens can expire → re-run `claude` to re-auth if answers stop.
- Low/medium traffic only — all requests use *your* Claude account. For public scale, set `ANTHROPIC_API_KEY` on Vercel instead (no box needed).
