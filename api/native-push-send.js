// Native push sender (FCM HTTP v1 — Android natively, iOS via FCM+APNs key).
// Mirrors push-send.js: real once FCM_SERVICE_ACCOUNT is set, otherwise no-ops
// (sent:0) so notify() never throws. See MOBILE.md.
//
// Env: FCM_SERVICE_ACCOUNT = the full JSON of a Firebase service-account key
//   (Firebase Console → Project Settings → Service accounts → Generate new key).
// The client stores native tokens in push_subscriptions with keys.platform.
import crypto from "node:crypto";

function base64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Mint a short-lived OAuth token from the service account (FCM messaging scope).
async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const jwt = `${header}.${claim}.${base64url(signer.sign(sa.private_key))}`;
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const j = await resp.json();
  if (!j.access_token) throw new Error(j.error_description || "token exchange failed");
  return j.access_token;
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const { subscriptions = [], title = "KamboGuide", body = "", url = "/" } = req.body || {};
  // Only native subs (tagged with keys.platform). Their endpoint is the FCM/APNs token.
  const tokens = subscriptions.filter((s) => s?.keys?.platform).map((s) => s.endpoint).filter(Boolean);

  const RAW = process.env.FCM_SERVICE_ACCOUNT;
  if (!RAW || tokens.length === 0) {
    res.status(200).json({ sent: 0, configured: !!RAW, tokens: tokens.length });
    return;
  }

  let sa, accessToken, project;
  try {
    sa = JSON.parse(RAW);
    project = sa.project_id;
    accessToken = await getAccessToken(sa);
  } catch (e) {
    res.status(200).json({ sent: 0, configured: true, error: String(e?.message || e) });
    return;
  }

  let sent = 0;
  await Promise.all(tokens.map(async (token) => {
    try {
      const r = await fetch(`https://fcm.googleapis.com/v1/projects/${project}/messages:send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            data: { url: String(url) },
            // iOS via FCM needs an APNs key uploaded in Firebase.
            apns: { payload: { aps: { sound: "default" } } },
          },
        }),
      });
      if (r.ok) sent++;
    } catch { /* skip bad token */ }
  }));

  res.status(200).json({ sent, configured: true });
}
