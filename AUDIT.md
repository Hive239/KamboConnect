# KamboConnect — Platform Audit & Replication Notes

> Source: Base44 app `68bac5b4bfadf52cba257f6d` (workspace `68bac58ca0d1677cd0816b83`).
> Full source (138 files) extracted into this folder. Data model + raw app metadata in `_base44_export/`.
> Captured: 2026-06-30.

## 1. What this product is
A two-sided **marketplace / directory for Kambo practitioners**. Clients discover and book verified
practitioners; practitioners manage profiles, availability, bookings, and events; admins verify
practitioners and moderate content. Includes community forum, events, messaging, favorites, reviews,
payments (Stripe), and an education/"Learn" section.

## 2. Tech stack (as built on Base44)
- **Build/Runtime:** Vite 6 + React 18, JavaScript (JSX, not TS), `react-router-dom` v6.
- **UI:** shadcn/ui (Radix primitives) + Tailwind CSS 3 + `framer-motion`, `lucide-react` icons.
- **Data/fetch:** `@tanstack/react-query` v5.
- **Maps:** `react-leaflet` (practitioner map view).
- **Payments:** `@stripe/react-stripe-js` + `@stripe/stripe-js`.
- **Rich content:** `react-quill` (forum posts), `react-markdown`, `jspdf` + `html2canvas` (PDF/export),
  `recharts` (admin analytics), `three` (some 3D/visual), `canvas-confetti`.
- **Backend:** **Base44-managed** — no custom serverless functions (`function_names: []`).
  Data access is via the Base44 SDK virtual modules (`@/entities/*`, `@/integrations/Core`).

### Base44 platform couplings to replace on migration
- `@base44/sdk` + `@base44/vite-plugin` — generate the `@/entities/*` and `@/integrations/*` virtual modules.
- `src/api/base44Client.js` — the SDK client (auth + entity CRUD).
- `@/integrations/Core`: **`SendEmail`** (11 uses) and **`UploadFile`** (7 uses).
- Auth: `base44.auth.me / logout / redirectToLogin` and `base44.appLogs.logUserInApp`.

## 3. Pages (20) — `src/pages/` + nav in `src/Layout.jsx`
Public: Directory (home, 33KB — biggest), Community, Events, Market, Education ("Learn", 33KB), Disclaimer, Post, NewPost.
Auth'd: Bookings ("My Bookings"), Messages, Favorites, Profile, MyAccount, PractitionerDashboard,
PractitionerProfile, PractitionerApplication, BookingRequest.
Admin-only: AdminDashboard, Verification ("Admin Verification").
Main page = `Directory`.

## 4. Component map — `src/components/`
- `admin/` AdminSettings, ContentModeration, DisputeResolution, PlatformAnalytics, UserManagement, VerificationManagement
- `booking/` DirectBookingModal · `bookings/` BookingReviewModal, ClientBookingsView, PractitionerBookingsView
- `community/` ForumView, ResourcesView
- `directory/` DailyQuote, FilterModal, MapView, PractitionerCard, PractitionerModal, ReviewForm
- `events/` EventCard, EventModal, RegistrationModal
- `favorites/` FavoriteButton · `messages/` Conversation*/Message* (thread UI)
- `notifications/` NotificationCenter, NotificationService
- `practitioner/` Application, AvailabilitySettings, BlockedDatesManager, BookingCalendar, EventManagement,
  ExceptionManager, MessagingCenter, ProfileManagement, ApplicationSuccess
- `profile/` AccountSettings, BookingHistory, ProfilePictureUpload, ReportButton, ReviewHistory, etc.
- `ui/` full shadcn set (~50 components)

## 5. Data model — 17 entities (+ Base44 built-in `User`)
Schemas saved individually in `_base44_export/entities/*.json`.

| Entity | Purpose / key fields |
|---|---|
| **Practitioner** | profile, geo (lat/lng), bio, certifications[], specializations[], `is_verified`, `verification_level` (pending/basic/advanced/master/rejected), `listing_tier` (verified/featured/premium), pricing_range ($–$$$$), CPR/Kambo cert URLs |
| **Review** | practitioner ratings/reviews |
| **Event** / **EventRegistration** | practitioner events + signups |
| **Post** / **Reply** | community forum |
| **CommunityResource** | learn/resources content |
| **Booking** | client↔practitioner sessions |
| **Conversation** / **Message** | direct messaging |
| **PractitionerAvailability** / **PractitionerBlockedDate** / **PractitionerException** | scheduling |
| **Payment** | Stripe payment records |
| **Notification** | in-app notifications |
| **Favorite** | saved practitioners |
| **Report** | content/user moderation reports |

Roles inferred: `user` (client), `practitioner`, `admin` (`adminOnly` nav + admin pages).

## 6. Design tokens — current state (a known weakness)
`src/index.css` ships the **default shadcn neutral palette** (primary ≈ `0 0% 9%` near-black).
The visible **brand green is hardcoded** in component classes, not tokenized. Light + dark var sets exist
but dark mode likely isn't fully exercised. → Rebuild should tokenize a real brand palette + typography.

## 7. Migration target → Git + Vercel + Supabase
Replacement plan (high level):
1. **Entities → Supabase Postgres tables** — generate SQL/migrations from `_base44_export/entities/*.json`.
   Add RLS policies for the 3 roles.
2. **Auth** — Base44 auth → **Supabase Auth** (email + OAuth; the live account used GitHub login).
3. **Storage** — `Core.UploadFile` → **Supabase Storage** buckets (profile images, cert docs).
4. **Email** — `Core.SendEmail` → transactional provider (e.g., Resend) via a Vercel/Supabase Edge fn.
5. **Data layer** — replace `@/entities/*` SDK calls with a thin typed client over Supabase (keep
   react-query). Strip `@base44/sdk` + `@base44/vite-plugin`.
6. **Payments** — Stripe stays; move secret-side to a Vercel serverless route / Supabase Edge fn.
7. **Deploy** — Vite app on Vercel; env vars for Supabase + Stripe.

## 8. Open items to confirm before rebuild
- Confirm role model & permissions (RLS) per entity.
- Decide JS→TS for the rebuild (recommended).
- Brand palette + UX direction for the "way better" redesign.
</content>
</invoke>
