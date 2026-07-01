# KamboConnect — Potential Future Upgrades

A backlog of larger bets to take the platform further, captured during the 12-upgrade build phase.
Items 1–3 are approved-but-deferred (they need a real backend or are large standalone efforts); items 4–13
are new concepts. Each: what it is · why it matters · rough lift (S/M/L/XL) · main blocker.

> Most of these are unlocked once the data layer moves from the mock adapter (`src/data/*`) to **Supabase**.

## Deferred from the approved list
1. **Structured Learning Hub / LMS (#3)** — courses, newcomer journeys ("Is Kambo right for me?"), practitioner CE,
   progress tracking + certificates, vetted safety library. *Why:* the "education" pillar at full depth. *Lift:* L.
   *Blocker:* content model + media hosting; pairs well with the AI assistant (#7 below).
2. **Real payments — Stripe Connect (#9)** — practitioner connected accounts, deposits, refunds, payouts, commission
   + ticketing fees. *Why:* turns the mock Payment/Order/Subscription flows into real revenue. *Lift:* L.
   *Blocker:* needs a backend (Vercel functions/Supabase Edge) for secrets, webhooks, payouts.
3. **Events 2.0 + telehealth / video consults (#14)** — event map discovery, ticketing/waitlists, recurring circles,
   in-app video sessions, calendar sync (Google/Apple/ICS). *Why:* deepens connection + a second revenue line.
   *Lift:* L–XL. *Blocker:* video infra (Daily/LiveKit) + calendar OAuth.

## New concepts
4. **Native mobile apps (React Native / Expo)** — true app-store presence sharing the design system. *Why:* mobile-first
   audience, real push, camera/location. *Lift:* XL. *Blocker:* separate app shell; the PWA bridges this near-term.
5. **SSR / prerendering for true SEO** — Next.js or a Vercel prerender so practitioner/event pages are crawlable.
   *Why:* the client-side meta + JSON-LD shipped now is only a partial SEO win. *Lift:* L. *Blocker:* framework move/host.
6. **Real web-push + transactional email pipeline** — browser push + Resend/Postmark for booking/message/review emails.
   *Why:* re-engagement; the in-app + Notification-API alerts shipped now don't reach offline users. *Lift:* M. *Blocker:* backend + service worker push keys.
7. **AI guidance assistant (RAG over vetted content)** — a safe, citable chat assistant grounded only in approved
   safety/education content. *Why:* newcomer guidance + reduces unsafe advice. *Lift:* M–L. *Blocker:* vector store + Claude API + content curation.
8. **Practitioner CE & certification-body integrations** — verify credentials directly with issuing bodies (e.g. IAKP),
   track continuing education. *Why:* the strongest possible trust signal. *Lift:* L. *Blocker:* third-party APIs/partnerships.
9. **Insurance / booking protection & escrow** — hold funds until session completion; optional session insurance.
   *Why:* buyer confidence for a sensitive, high-intent purchase. *Lift:* L. *Blocker:* payments + legal/partners.
10. **Referral / ambassador & reputation rewards** — invite credits, practitioner referral payouts, reputation perks.
    *Why:* organic growth loop on both sides of the marketplace. *Lift:* M. *Blocker:* payments + abuse controls.
11. **Trust scoring & background-check integrations** — composite trust score (verification + reviews + tenure + checks).
    *Why:* a single legible signal of safety/credibility. *Lift:* M. *Blocker:* background-check vendor + policy.
12. **Multi-region data residency & compliance** — GDPR/CCPA tooling, health-data handling (HIPAA-adjacent for screening),
    consent/audit logs, data export/delete. *Why:* required to operate globally with health data. *Lift:* L. *Blocker:* backend + legal.
13. **Public API & partner integrations / calendar sync** — let studios/retreat platforms list via API; two-way calendar.
    *Why:* supply growth + ecosystem. *Lift:* L. *Blocker:* backend + auth/rate-limiting.
14. **Advanced analytics & recommendation ML** — learned ranking/matching beyond heuristics, cohort analytics, churn.
    *Why:* better discovery + business insight as data grows. *Lift:* L. *Blocker:* data volume + pipeline.
15. **Community livestreams / circles & audio rooms** — live sessions, AMAs, audio "integration circles." *Why:* real-time
    belonging and practitioner reach. *Lift:* L. *Blocker:* streaming infra + moderation.

---
*Maintained alongside the active build plan at `~/.claude/plans/`. When Supabase lands, re-evaluate priority — many of
these become straightforward once there's a real backend.*
