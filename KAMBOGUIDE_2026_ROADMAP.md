# KamboGuide — UI/UX & Visual Modernization Roadmap (2026)

> Rebrand: **KamboConnect → KamboGuide** (done in-app: wordmark, SEO titles, manifest,
> emails, calendar UID, JSON-LD). The name shift from *Connect* (directory) to *Guide*
> (a companion that guides you through a safe journey) is the strategic anchor for
> everything below — lean into **guidance, journey, and trust**.

---

## Audit — where it stands today

**Strengths (keep these):**
- Fully tokenized "elevated earthy / healing" palette (forest green + sand + terracotta clay), light + dark, in `src/index.css`.
- Fraunces display serif + Inter, Phosphor duotone icons, framer-motion basics (animated nav pill, page transitions), collapsible rail, ⌘K command palette, i18n (en/es/pt), PWA, Supabase backend.
- Solid IA: directory, map, matchmaking, community, events, market, bookings, dashboards.

**Gaps that read as "2023 shadcn default" rather than "2026 premium wellness":**
1. **Flat surfaces** — only Tailwind's stock `shadow-sm/md/lg`; no tokenized elevation, no depth, no material language.
2. **Generic Landing** — the front door is plain cards on flat paper. No hero atmosphere, no motion, no proof.
3. **Underused typography** — Fraunces exists but the type scale is small and uniform; no editorial rhythm or fluid sizing.
4. **No signature texture** — flat color blocks; nothing organic (grain, gradient mesh, aurora) despite a "healing/earth" brand.
5. **Fixed-width cards** — `PractitionerCard` uses `w-48/w-64` pixel widths, not a responsive grid; thin info hierarchy.
6. **Static motion** — no scroll-reveal, stagger, magnetic/press affordances beyond the nav pill.
7. **No "Guide" layer** — the new name promises guidance the product doesn't yet deliver (concierge, journeys, personalized home).
8. **Thin feedback states** — plain spinners; no branded skeletons, illustrated empty states, or optimistic polish.

---

## The 2026 direction — "Living Earth"

A tactile, editorial, calming aesthetic: warm paper with subtle **film grain**, **organic gradient-mesh** atmospheres in forest/clay, generous whitespace, big Fraunces headlines, soft **layered elevation** (not glassmorphism), and spring-based motion that feels alive but never busy. Dark mode becomes a genuine **"Ceremony" night theme**.

---

## Roadmap (tranches, each independently shippable)

### Tranche 1 — Visual foundation (design system)
- **Elevation tokens**: `--shadow-sm/md/lg/xl` tuned warm (green-tinted, low-opacity, layered) + Tailwind `shadow-*` mapping. Replace stock shadows app-wide.
- **Fluid type scale**: `clamp()` display/heading sizes, tighter tracking on Fraunces, looser leading on body. New `.text-display`, `.text-hero` utilities.
- **Texture layer**: reusable `<Grain />` overlay + `<GradientMesh />` background component (forest→clay→sand), respects `prefers-reduced-motion` & dark mode.
- **Motion primitives**: `Reveal` (scroll-in stagger), `Magnetic` button, spring presets in a `src/lib/motion.ts`. Wire View Transitions for route changes.
- **Refined primitives**: Button (soft shadow + subtle gradient on primary + magnetic), Card (elevation + hover lift), Badge, Input (larger, softer focus glow).

### Tranche 2 — Landing as a showpiece
- Full-bleed hero: gradient-mesh + grain, oversized Fraunces headline, animated word rotation, floating verified-practitioner avatars.
- Live stats counter, "How it works" as an animated 3-step journey, practitioner spotlight carousel (embla), testimonial marquee, interactive mini-map preview, trust/safety band, sticky CTA. Real footer with brand.

### Tranche 3 — The "Guide" (signature 2026 feature, matches the name)
- **KamboGuide concierge**: a calm conversational assistant (drawer + ⌘K entry) that answers safety/contraindication questions, recommends practitioners (reuses `Matchmaking.scoreMatches`), and explains the process. Backed by existing heuristics now; Claude API-ready seam for later.
- **Guided Journey**: a personalized, staged path — Learn → Screen → Match → Consult → Book → Integrate — with progress, surfaced on a new **"For You" home**.

### Tranche 4 — Directory & profiles glow-up
- Responsive card grid (kill fixed widths), richer `PractitionerCard`: modality chips, availability dot, verified/tier hierarchy, hover media reveal.
- Filter UX as a calm sticky rail + chips; grid/map/list toggle.
- Practitioner profile: editorial layout, media gallery/lightbox, availability heatmap, sticky booking panel, review highlights.

### Tranche 5 — Feedback & polish everywhere
- Branded skeleton shimmer, illustrated empty states, toast polish, optimistic UI, page-level loading choreography, 404/error art. Micro-interactions on favorite/follow/book.

### Tranche 6 — Mobile & a11y finish
- Bottom-nav elevation + haptic-style press, swipe gestures, pull-to-refresh feel, larger tap targets, safe-area insets, full focus-visible pass, reduced-motion parity.

---

## Not-in-source (flag before touching)
- Folder `/Users/mpari/Desktop/Hive:Omar/KamboConnect`, GitHub repo `Hive239/KamboConnect`,
  Vercel project `kambo-connect`, Supabase ref — still named KamboConnect. Renaming these is
  outward-facing/infra and should be a separate, explicit decision.
