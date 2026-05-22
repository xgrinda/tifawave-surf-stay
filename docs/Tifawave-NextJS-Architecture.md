# Tifawave Surf Stay — Production Build Architecture
### Next.js App Router · TypeScript · Tailwind · shadcn/ui · Framer Motion · Supabase · Resend · Vercel

Engineering architecture that realizes the premium blueprint **without compromise**. The cinematic direction (ocean/sand/sunset, Fraunces + Inter, clay CTAs, filmic dark→light rhythm) is preserved end to end; this document specifies how it's built, served fast, and operated safely.

Companion files: `Tifawave-Full-Website-Blueprint.md`, `Tifawave-Build-Spec-NextJS.md`, `tifawave-homepage.html`.

---

## 0. Architecture Principles

- **Server-first.** Default to React Server Components (RSC). Only leaf interactivity (`Nav`, `BookingWidget`, `Gallery lightbox`, `Reveal`, form steps) is `"use client"`. Keeps JS small and the cinematic imagery fast.
- **The database is the single source of truth for availability.** The public calendar is a pure reflection of Supabase `availability`/`bookings`/`blocked_dates`. Blocking a date is the one action that guarantees a guest can't book it.
- **No raw card data ever touches our servers.** Payments via Stripe (PCI-compliant hosted/Elements). Supabase stores only references + status.
- **Edge-cached marketing, dynamic booking.** Static/ISR for content pages; on-demand/dynamic for availability and admin.
- **Premium is non-negotiable** — performance budgets exist *to protect* the cinematic experience, not shrink it.

---

## 1. Complete Folder Structure

```
tifawave/
├── app/
│   ├── (marketing)/                  # public site, ISR-cached
│   │   ├── layout.tsx                # Nav + Footer + MobileBookBar + WhatsAppFab
│   │   ├── page.tsx                  # Home
│   │   ├── surf/
│   │   │   ├── packages/page.tsx
│   │   │   ├── packages/[slug]/page.tsx
│   │   │   ├── coaching/page.tsx
│   │   │   ├── waves/page.tsx
│   │   │   └── photography/page.tsx
│   │   ├── stay/
│   │   │   ├── rooms/page.tsx
│   │   │   ├── rooms/[slug]/page.tsx
│   │   │   ├── spaces/page.tsx
│   │   │   └── food/page.tsx
│   │   ├── experiences/[slug]/page.tsx
│   │   ├── story/
│   │   │   ├── page.tsx
│   │   │   ├── tamraght/page.tsx
│   │   │   └── journal/
│   │   │       ├── page.tsx
│   │   │       └── [slug]/page.tsx
│   │   ├── plan/
│   │   │   ├── availability/page.tsx
│   │   │   ├── getting-here/page.tsx
│   │   │   ├── faq/page.tsx
│   │   │   └── reviews/page.tsx
│   │   ├── gallery/page.tsx
│   │   ├── gift-cards/page.tsx
│   │   └── contact/page.tsx
│   │
│   ├── (booking)/                    # transactional, dynamic, noindex
│   │   ├── layout.tsx                # minimal chrome + StepIndicator + SummaryRail
│   │   └── book/
│   │       ├── page.tsx              # step orchestrator (dates→choose→addons→summary)
│   │       ├── guest/page.tsx
│   │       ├── payment/page.tsx
│   │       └── confirmation/[ref]/page.tsx
│   │
│   ├── (admin)/                      # private, auth-gated, noindex
│   │   ├── layout.tsx                # AdminShell (sidebar), session guard
│   │   └── admin/
│   │       ├── page.tsx              # dashboard
│   │       ├── calendar/page.tsx     # availability & blocked dates
│   │       ├── bookings/page.tsx
│   │       ├── bookings/[id]/page.tsx
│   │       ├── rates/page.tsx
│   │       ├── content/[type]/page.tsx
│   │       └── login/page.tsx
│   │
│   ├── api/                          # route handlers (see §14)
│   │   ├── availability/route.ts
│   │   ├── bookings/route.ts
│   │   ├── bookings/[id]/route.ts
│   │   ├── checkout/route.ts
│   │   ├── webhooks/stripe/route.ts
│   │   ├── ical/export/[roomId]/route.ts
│   │   ├── ical/import/route.ts          # POST trigger (cron)
│   │   ├── newsletter/route.ts
│   │   └── revalidate/route.ts           # on-demand ISR (CMS webhook)
│   │
│   ├── sitemap.ts
│   ├── robots.ts
│   ├── manifest.ts
│   ├── opengraph-image.tsx           # dynamic OG (per route via generateImageMetadata)
│   ├── not-found.tsx                 # on-brand 404
│   ├── error.tsx  / global-error.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                           # shadcn primitives (button, dialog, sheet, calendar, accordion, form, input, select, sonner…)
│   ├── primitives/                   # brand wrappers (Container, Eyebrow, SectionHeading, Badge)
│   ├── motion/                       # Reveal, Stagger, ParallaxImage, CountUp, PageTransition
│   ├── layout/                       # Nav, Footer, MobileBookBar, WhatsAppFab, AdminShell
│   ├── sections/                     # Hero, TrustStrip, Pillars, Packages, StaySplit, DayTimeline, PlaceSplit, Reviews, FinalCTA, LevelMatcher
│   ├── cards/                        # PackageCard, RoomCard, ReviewCard, TimelineCard, GalleryTile
│   ├── booking/                      # DateRangePicker, GuestSelector, AddOnList, SummaryRail, StepIndicator, GuestForm, PaymentPanel
│   ├── gallery/                      # GalleryGrid, Lightbox, FilterChips
│   └── admin/                        # AvailabilityCalendar, RateEditor, BookingTable, SyncStatus
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts                 # RSC/server client (cookies, service role on server-only paths)
│   │   ├── client.ts                 # browser client (anon)
│   │   └── admin.ts                  # service-role client (server-only, never imported client-side)
│   ├── booking/
│   │   ├── availability.ts           # core blocked-date / overlap logic
│   │   ├── pricing.ts                # rate + season + add-on calc
│   │   ├── rules.ts                  # min-stay, arrival-day, lead-time
│   │   └── hold.ts                   # temporary holds during checkout
│   ├── ical/
│   │   ├── export.ts                 # generate VEVENTs from bookings/blocks
│   │   └── import.ts                 # parse external feeds → blocked_dates
│   ├── email/                        # Resend senders + react-email templates ref
│   ├── seo/                          # metadata helpers, JSON-LD builders
│   ├── cms/                          # content fetchers (Supabase or Sanity adapter)
│   ├── stripe.ts
│   ├── cn.ts  /  validation.ts (zod schemas)  /  constants.ts  /  fonts.ts
│
├── emails/                           # react-email templates (Confirmation, PreArrival, PostStay, OwnerAlert)
├── content/                          # MDX journal (if MDX route) or fetched from CMS
├── supabase/
│   ├── migrations/                   # SQL migrations (versioned)
│   └── seed.sql
├── public/                           # static brand assets, icons, manifest icons
├── types/                            # generated DB types (supabase gen types) + domain types
├── middleware.ts                     # admin auth, locale, security headers
├── tailwind.config.ts  /  next.config.mjs  /  tsconfig.json
└── .env.local                        # secrets (see §15)
```

**Route groups** isolate concerns: `(marketing)` (cached, indexed), `(booking)` (dynamic, noindex), `(admin)` (auth, noindex) — each with its own `layout.tsx` and chrome.

---

## 2. Route Structure & Rendering Strategy

| Route | Render | Cache | Notes |
|-------|--------|-------|-------|
| `/` and marketing pages | RSC + **ISR** | `revalidate: 3600` + on-demand | Content from CMS; revalidate on publish webhook |
| `/surf/packages/[slug]`, `/stay/rooms/[slug]` | RSC + `generateStaticParams` + ISR | static-ish | "From" prices shown; live availability fetched client-side in the price rail |
| `/story/journal/[slug]` | RSC, MDX/CMS, ISR | static | SEO pillar/cluster |
| `/plan/availability` | RSC shell + client calendar | dynamic data | calls `/api/availability` |
| `/book/*` | dynamic (`force-dynamic`) | none | session/hold state; `noindex` |
| `/admin/*` | dynamic, auth-gated | none | `middleware` redirects unauthenticated; `noindex` |
| `/api/*` | route handlers | per-endpoint | see §14 |

**Locale:** `[lang]` segment or middleware-rewrite for `en|fr|de|es` with `hreflang`. Marketing pages localized first; booking flow strings i18n via dictionary.

---

## 3. Reusable Component System

**Three tiers, strict boundaries:**

1. **shadcn/ui primitives** (`components/ui/`) — Button, Dialog, Sheet, Calendar, Accordion, Form, Input, Select, Tabs, Sonner (toasts), Popover, Skeleton. Installed via CLI, owned in-repo, **restyled to brand tokens** (Radius 18–22px, clay primary, Fraunces never on tiny UI). Keep accessibility (Radix) intact.
2. **Brand primitives** (`components/primitives/`) — thin wrappers enforcing the design language: `Container` (max-w + gutters), `Eyebrow`, `SectionHeading`, `Badge`, `Prose`. These are the only place spacing/measure rules live.
3. **Domain components** (`sections/`, `cards/`, `booking/`, `gallery/`, `admin/`) — composed from the two tiers above. Sections are RSC; only interactive parts opt into `"use client"`.

**Variant strategy:** `cva` (class-variance-authority) + `tailwind-merge` via a `cn()` util for every variant-bearing component (Button, Card, Badge). One source of truth per component; no ad-hoc class soup.

**Token enforcement:** colors/spacing/radius/easing live only in `tailwind.config.ts` + CSS vars. No raw hex in components (lint rule). Dark/light surfaces use semantic tokens so the dark→light rhythm is consistent.

**Server/Client contract:** data fetched in RSC → passed as serializable props to client leaves. Client components never fetch secrets; they call typed API routes or server actions.

---

## 4. Supabase Schema (core)

PostgreSQL via Supabase. RLS on every table. `service_role` used only in server-only code paths (booking writes, admin). Types generated with `supabase gen types typescript`.

```sql
-- ===== Reference / content =====
create table rooms (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  bed_config text,
  view text,
  size_sqm int,
  max_guests int not null default 2,
  base_price_cents int not null,           -- nightly, before season modifiers
  sort int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table room_images (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  url text not null, alt text, width int, height int, sort int default 0
);

create table packages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  best_for text,
  nights int,
  base_price_cents int not null,
  inclusions jsonb default '[]',
  is_featured boolean default false,
  is_active boolean default true
);

create table add_ons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_cents int not null,
  unit text default 'per_stay',            -- per_stay | per_night | per_person
  is_active boolean default true
);

-- ===== Rates & seasons =====
create table seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,                      -- Low / Shoulder / High / Peak
  start_date date not null,
  end_date date not null,
  price_modifier numeric default 1.0       -- multiplier on base_price
);

-- ===== Bookings (see §5) =====
-- ===== Blocked dates / availability (see §6) =====
-- ===== Reviews, FAQ, journal, newsletter =====
create table reviews (
  id uuid primary key default gen_random_uuid(),
  guest_name text, country text, level text, package_slug text,
  rating int check (rating between 1 and 5),
  body text, source text, is_published boolean default false, created_at timestamptz default now()
);
create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null, locale text, created_at timestamptz default now()
);
```

**RLS posture:** `rooms`, `packages`, `add_ons`, `seasons`, published `reviews` → public `select`. `bookings`, `blocked_dates`, drafts, subscribers → no public access; reads/writes via server (service role) or admin role only.

---

## 5. Booking Tables

```sql
create type booking_status as enum
  ('hold','pending_payment','confirmed','cancelled','completed','no_show');

create table bookings (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,          -- human ref e.g. TIF-7H3K2
  status booking_status not null default 'hold',

  room_id uuid references rooms(id),
  package_id uuid references packages(id),
  check_in date not null,
  check_out date not null,                 -- exclusive (departure morning)
  guests int not null default 2,
  level text,                              -- beginner|improver|advanced

  -- guest
  guest_name text, guest_email text, guest_phone text,
  notes text, dietary text, locale text default 'en',

  -- money (all integer cents, single currency col)
  currency text default 'EUR',
  room_total_cents int default 0,
  addons_total_cents int default 0,
  total_cents int not null default 0,
  deposit_cents int not null default 0,
  balance_cents int generated always as (total_cents - deposit_cents) stored,

  -- payment refs (NO card data)
  stripe_payment_intent text,
  stripe_customer text,
  deposit_paid_at timestamptz,

  -- lifecycle
  hold_expires_at timestamptz,             -- holds auto-expire (see §6)
  source text default 'direct',            -- direct | booking.com | airbnb (for imported)
  external_uid text,                       -- iCal UID for synced reservations
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table booking_add_ons (
  booking_id uuid references bookings(id) on delete cascade,
  add_on_id uuid references add_ons(id),
  qty int default 1,
  price_cents int not null,
  primary key (booking_id, add_on_id)
);

-- prevent overlapping confirmed/held stays per room (Postgres exclusion constraint)
create extension if not exists btree_gist;
alter table bookings
  add constraint no_overlap
  exclude using gist (
    room_id with =,
    daterange(check_in, check_out, '[)') with &&
  )
  where (status in ('hold','pending_payment','confirmed'));
```

The **exclusion constraint** is the database-level guarantee against double-booking — even under race conditions, two overlapping bookings for the same room cannot both commit. Application logic checks first (for nice UX), but the DB is the final arbiter.

`reference` generated in app (collision-checked). All money in integer cents to avoid float errors; `balance` is a generated column.

---

## 6. Blocked-Date Logic

Three things make a date unbookable for a room: an **active booking**, an **owner block**, and a **failed rule** (min-stay etc.). All resolve through one availability function.

```sql
create type block_reason as enum ('owner_stay','maintenance','private_buyout','seasonal_close','external_ical');

create table blocked_dates (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  start_date date not null,
  end_date date not null,                  -- exclusive
  reason block_reason not null,
  source text default 'admin',             -- admin | airbnb | booking.com
  external_uid text,                       -- for iCal-imported blocks (idempotent upsert)
  note text,
  created_by uuid,
  created_at timestamptz default now()
);

create table booking_rules (
  room_id uuid references rooms(id) on delete cascade primary key,
  min_nights int default 2,
  max_nights int,
  arrival_days int[] ,                     -- e.g. {6} = Saturdays only; null = any
  lead_time_days int default 0
);
```

**Resolution flow (server, `lib/booking/availability.ts`):**

```
isRangeAvailable(roomId, checkIn, checkOut):
  1. reject if any blocked_dates row for roomId overlaps [checkIn, checkOut)
  2. reject if any bookings row (status in hold/pending/confirmed, not expired) overlaps
  3. reject if violates booking_rules (min/max nights, arrival day, lead time)
  4. else available
```

**Holds:** when a guest enters the booking flow, create a `bookings` row `status='hold'` with `hold_expires_at = now() + 12 min`. The overlap constraint reserves the dates *during checkout* so two people can't race the same room. A scheduled job (Supabase cron / Vercel cron hitting an API) sweeps expired holds back to availability.

**Public calendar feed:** `/api/availability?roomId=&from=&to=` returns a per-day map `open|booked|blocked` + applicable rules, so the client `DateRangePicker` disables dates *and explains why* on tap (never silent). Cached briefly (e.g. 60s, `stale-while-revalidate`) and revalidated on any write.

**Truth direction:** admin block → `blocked_dates` insert → public calendar reflects it immediately (cache busted). This is the operational safeguard the blueprint promised.

---

## 7. iCal Sync Logic (two-way, anti-double-booking)

**Export (we → OTAs):** `GET /api/ical/export/[roomId]` returns a `text/calendar` feed of `VEVENT`s for every confirmed booking **and** owner block on that room (`DTSTART/DTEND`, stable `UID`, `SUMMARY: Unavailable`). Each room has its own feed URL (token-protected). Paste into Airbnb/Booking.com "import calendar."

**Import (OTAs → us):** scheduled pull (Vercel Cron, e.g. every 30 min → `POST /api/ical/import`):
```
for each external feed URL (stored per room/channel):
  fetch + parse VEVENTs
  for each event:
    upsert into blocked_dates
      (room_id, start=DTSTART, end=DTEND, reason='external_ical',
       source=<channel>, external_uid=UID)   -- idempotent on external_uid
  delete blocked_dates where source=<channel> and external_uid no longer present (cancelled OTA booking re-opens date)
  bust availability cache for affected rooms
```

**Idempotency & safety:**
- `external_uid` unique-upsert prevents duplicate blocks on repeated syncs.
- Removed external events → corresponding blocks deleted (date re-opens).
- Direct bookings remain the authoritative `bookings` rows; OTA reservations live as `blocked_dates` (source-tagged) so we don't try to charge/deposit them.
- Sync status + `last_synced_at` surfaced in admin (`SyncStatus`); failures alert the owner (Resend) but never silently corrupt availability.
- **Caveat documented:** iCal is poll-based (not instant) — a ~15–30 min window exists; mitigated by short cron interval + the DB exclusion constraint as the hard backstop.

---

## 8. Admin Architecture

- **Route group `(admin)`** behind `middleware.ts` (Supabase Auth session check; role `owner|staff` in a `profiles` table; redirect to `/admin/login` otherwise). `noindex` + no caching.
- **AdminShell** — left sidebar nav (Dashboard, Calendar, Bookings, Rates, Content, Sync), brand-consistent but utility-dense; mobile-usable (owner often on phone) with a collapsible drawer.
- **Availability Calendar** (`components/admin/AvailabilityCalendar`) — month/room grid; legend Open/Booked/Blocked/Held using **color + label + pattern** (never color alone). Drag-select to block; click a booking → detail. Writes go through server actions using the service-role client; optimistic UI with rollback on error; confirm dialogs on destructive/bulk actions; undo toast.
- **Bookings** — sortable table (shadcn DataTable), filters by status/date, detail view to trigger pre-arrival email, modify, or process cancellation (owner-confirmed, never auto-destructive; refunds via Stripe with explicit confirm).
- **Rates & Seasons** — per-room base + season modifiers, deposit %, currency, package & add-on prices. Live preview of resulting nightly price.
- **Content** — CMS surface (§9).
- **Auth:** Supabase Auth (email magic link / OAuth). Service-role key never reaches the browser; all privileged mutations are server actions / API routes that re-check the session.

---

## 9. CMS Architecture

Two viable adapters behind a single `lib/cms/` interface (swap without touching components):

- **Option A — Supabase-as-CMS (recommended for tight booking integration):** content tables (`rooms`, `packages`, `journal_posts`, `faq_items`, `pages`, `gallery_images`, `experiences`) edited in the admin `Content` module. Pros: one datastore, rooms/packages are *already* the booking source of truth, no sync drift. Editing publishes → triggers `/api/revalidate` (on-demand ISR).
- **Option B — Sanity/Storyblok (recommended if non-technical editors want rich visual editing & scheduling):** marketing content (journal, pages, gallery, story) in the headless CMS; rooms/packages/availability stay in Supabase. CMS webhook → `/api/revalidate?tag=...`. Pros: best editing UX, draft previews, scheduling.

**Content fetching:** `lib/cms/` exposes typed fetchers (`getRoom(slug)`, `getJournalPost(slug)`, `getFaq()`) used in RSC. Tagged caching (`unstable_cache` / `revalidateTag`) so a single article publish revalidates only its page + index.

**Journal authoring:** MDX (in-repo `content/` + `next-mdx-remote`) or CMS rich text — both render through the same `Prose` brand primitive for consistent editorial typography.

---

## 10. SEO Architecture

- **Metadata API:** every route exports `generateMetadata` (title, description, canonical, `openGraph`, `twitter`, `alternates.languages` for hreflang). Centralized builders in `lib/seo/`.
- **Dynamic OG images:** `opengraph-image.tsx` per route group via `next/og` (ImageResponse) — branded, room/package-aware.
- **Structured data (JSON-LD)** injected per page type from `lib/seo/jsonld.ts`:
  - `LodgingBusiness`/`Resort` (global), `Product`+`Offer` (packages, with price/availability/currency), `FAQPage` (FAQ), `Review`+`AggregateRating` (reviews), `BreadcrumbList`, `Organization`, `WebSite`.
- **Sitemap & robots:** `app/sitemap.ts` (dynamic — pulls slugs from CMS/DB, includes hreflang alternates), `app/robots.ts` (allow marketing, **disallow** `/book`, `/admin`, `/api`).
- **URL design:** clean, hierarchical (`/surf/packages/coached-week`, `/stay/rooms/rooftop-suite`, `/story/journal/best-time-to-surf-morocco`). Canonicals on filterable pages (gallery filters use query params, canonical to base).
- **Pillar/cluster content** (from blueprint §10) lives in `journal` + dedicated pillar pages, internally linked to money pages.
- **i18n SEO:** `hreflang` for en/fr/de/es; localized titles/descriptions; locale-specific OG.
- **Performance = SEO:** the media + responsive + RSC strategy keeps Core Web Vitals green (LCP via priority hero image, CLS via reserved dimensions, INP via minimal client JS).

---

## 11. Image & Video Optimization Strategy

**Images**
- `next/image` everywhere with explicit `width/height` or `fill`+`sizes` → zero CLS. Formats AVIF→WebP via Next's optimizer.
- Storage: **Supabase Storage** (or Vercel Blob) → served through `next/image` with a configured remote loader; long-cache immutable assets.
- **Hero/LCP image:** `priority` + preloaded; the homepage video uses a high-quality poster as LCP so the cinematic feel loads instantly; video lazy-swaps after.
- Below-fold + gallery: `loading="lazy"`, blur-up placeholders (`placeholder="blur"`, blurDataURL from a tiny base64), responsive `sizes` per breakpoint.
- Art direction: different crops per breakpoint where needed (mobile vertical hero vs desktop wide).

**Video**
- Background hero: short (≤8s), muted, `playsInline`, `loop`, **poster-first**; encoded H.264 + a smaller poster; respects `prefers-reduced-motion` (shows poster, no autoplay) and saves data on slow connections (Network Information API / quality fallback).
- Heavier showcase video: lazy-mounted on intersection, served via a CDN/streaming provider (Mux/Cloudflare Stream) with adaptive bitrate; never blocks render.
- Gallery loops: muted autoplay only on capable viewports; static poster otherwise; tap-to-expand with sound.

**Budgets:** hero LCP < 2.5s on 4G; total initial JS for marketing pages kept lean (RSC); images never ship larger than their rendered box.

---

## 12. Responsive Strategy

- **Mobile-first**, Tailwind breakpoints `sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536` (design references 375/768/1024/1440).
- **Fluid type** via `clamp()` (already specced) so headings scale smoothly, not in jumps.
- **Container:** `max-w-content (1200px)` + adaptive gutters (24px mobile → larger on wide); long-form text capped at readable measure even on tablets/desktop.
- **Layout shifts by breakpoint:** package grid 1→3 cols; editorial splits stack (image first) on mobile; timeline horizontal-scroll on mobile, can expand on desktop; footer 1→2→4 cols.
- **Viewport units:** `min-h-[100svh]` for hero (not `vh`) to avoid mobile browser-chrome jump.
- **Fixed elements:** sticky nav + mobile book bar are **safe-area aware** (`env(safe-area-inset-*)`); content reserves padding so nothing hides behind them.
- **Touch:** all targets ≥44px, ≥8px apart; no hover-only interactions; `touch-action: manipulation` to kill tap delay.
- **Orientation:** landscape readable; no horizontal scroll anywhere; zoom never disabled.

---

## 13. Animation Implementation Strategy

**Framer Motion**, governed by global tokens (consistent rhythm), all reduced-motion safe.

- **Tokens** in `lib/motion.ts`: `easeLux = [0.22,0.61,0.36,1]`, durations (micro 0.2 / enter 0.8 / exit 0.28), stagger 0.08.
- **`Reveal` / `Stagger`** (client): `whileInView` + `viewport={{ once:true, amount:0.15 }}` — section reveals, grid staggers. Wrap children of RSC sections.
- **Hero:** headline clip-mask rise (CSS keyframes for first paint, no JS dependency), background Ken-Burns via CSS; subhead/actions fade. (First impression must not wait on hydration.)
- **Cards:** hover lift + image scale inside clipped frame (transform only → no CLS); press scale 0.98.
- **Page transitions:** `<PageTransition>` using Framer + App Router `template.tsx` for directional slide/fade; **shared-element** (room/package image → detail) via `layoutId`.
- **Nav:** scroll-driven frosted transition (passive scroll listener, `useState`).
- **Booking:** step transitions slide horizontally (forward left / back right); success checkmark draw + optional haptic.
- **CountUp:** prices animate on first view; **skipped entirely** under reduced-motion (shows final value).
- **Rules enforced:** transform/opacity only; ≤400ms transitions; `useReducedMotion()` gates every non-essential animation; animations interruptible; never block input. Respect `prefers-reduced-motion` at the CSS layer too (global fallback).

---

## 14. State Management Approach

Deliberately minimal — the right tool per layer, no global store cult.

- **Server state (availability, prices, content):** fetched in RSC; mutations via **Server Actions** + `revalidatePath/Tag`. For client-side availability fetching (calendar), **TanStack Query** (caching, background refetch, `staleTime` ~60s) against `/api/availability`.
- **Booking flow state:** a scoped **Zustand** store (`useBookingStore`) holding the in-progress selection (dates, room/package, guests, add-ons, derived totals). **Persisted to `sessionStorage`** (autosave / survive accidental refresh) and synced to the server `hold` row. Cleared on confirmation.
- **URL as state:** dates/guests/filters live in **searchParams** where shareable (`/plan/availability?from=&to=&guests=`) — deep-linkable, back-button friendly.
- **Forms:** **React Hook Form + Zod** (shared schemas in `lib/validation.ts`, reused server-side for trust). Inline validation on blur, `aria-live` errors, focus first invalid.
- **UI ephemeral state:** local `useState` (modals, accordions) — shadcn/Radix manage their own.
- **Toasts:** Sonner (shadcn) with `aria-live`, no focus steal.
- **No Redux.** Zustand only for the booking funnel; everything else is server state or URL.

---

## 15. API Route Structure

Route handlers in `app/api/`. Auth-checked, Zod-validated, rate-limited (Upstash) where public-writable. Service-role Supabase only server-side.

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/availability` | GET | per-day open/booked/blocked + rules for a room/range | public (cached SWR) |
| `/api/bookings` | POST | create **hold** (validate range, rules, create hold row) | public (rate-limited) |
| `/api/bookings/[id]` | PATCH/GET | update hold (guest details), fetch status | scoped token |
| `/api/checkout` | POST | create Stripe PaymentIntent for deposit; attach to booking | scoped |
| `/api/webhooks/stripe` | POST | `payment_intent.succeeded` → booking `confirmed`, send emails, bust cache | Stripe signature verify |
| `/api/ical/export/[roomId]` | GET | text/calendar feed (confirmed + blocks) | feed token |
| `/api/ical/import` | POST | cron-triggered pull → upsert blocked_dates | cron secret |
| `/api/revalidate` | POST | on-demand ISR from CMS webhook | webhook secret |
| `/api/newsletter` | POST | Resend audience add | public (rate-limited, honeypot) |
| `/api/cron/sweep-holds` | POST | expire stale holds | cron secret |

**Conventions:** every handler validates input with Zod, returns typed JSON + correct status, never leaks service-role to client, verifies webhook signatures, and busts the relevant availability cache on any write. Prefer **Server Actions** for first-party mutations (booking steps, admin); API routes for webhooks, cron, external feeds, and the public availability read.

**Email (Resend):** triggered server-side post-confirmation — Confirmation, Pre-arrival (scheduled N days before via cron), Post-stay review request, and Owner alerts (new booking, sync failure). Templates authored with **react-email** in `emails/`.

**Payments (Stripe):** deposit-only PaymentIntent; balance handled on arrival or a scheduled charge. Refunds via admin (explicit confirm). No PAN/CVC ever stored or transmitted by us.

---

## 16. Deployment Architecture (Vercel)

- **Hosting:** Vercel — Next.js App Router native. Marketing pages on the **Edge/CDN** (ISR), booking/admin/API as **serverless functions** (Node runtime where Supabase service role / Stripe / ical parsing needed; Edge for light reads).
- **Environments:** `production` (main) + `preview` (every PR, with a Supabase preview/branch DB) + `development` (local). Env vars scoped per environment in Vercel.
- **Database:** Supabase (managed Postgres) — separate projects/branches for prod vs preview; migrations in `supabase/migrations` applied via CI (`supabase db push`). Daily backups + PITR on prod.
- **Cron:** **Vercel Cron** → `/api/ical/import` (every ~30 min) and `/api/cron/sweep-holds` (every few min). Secured by a cron secret header.
- **Storage/CDN:** Supabase Storage or Vercel Blob for images, behind `next/image`; optional Mux/Cloudflare Stream for showcase video.
- **Caching:** ISR + `revalidateTag` for content; `stale-while-revalidate` headers on `/api/availability`; immutable cache on hashed assets.
- **Security:** `middleware.ts` sets security headers (CSP allowing Supabase/Stripe/Resend/fonts/Mux, HSTS, X-Frame-Options), gates `/admin`, handles locale. RLS on all tables. Secrets only in server env. Stripe + cron + webhook signature verification.
- **Observability:** Vercel Analytics + Speed Insights (Core Web Vitals), Sentry (errors), Supabase logs, Stripe dashboard, Resend delivery logs. Uptime monitor on `/api/availability`.
- **CI/CD:** GitHub → Vercel preview per PR; checks run `tsc`, ESLint (incl. no-raw-hex rule), `supabase gen types` drift check, and a Lighthouse CI budget gate (LCP/CLS/INP) so a regression in the premium experience fails the build.

**.env (shape):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `ICAL_FEED_TOKEN`, `CRON_SECRET`, `REVALIDATE_SECRET`, (CMS keys if Sanity).

---

## Build Sequence (recommended)

1. **Foundation** — repo, Tailwind tokens, fonts, shadcn init + brand restyle, layout shells, Supabase project + base schema + RLS + generated types.
2. **Spine** — Home, Nav/Footer/MobileBookBar/WhatsApp, motion system.
3. **Money pages** — Packages + Rooms (with live price rails calling `/api/availability`).
4. **Booking core** — availability logic + holds + exclusion constraint, booking flow steps (Zustand + RHF/Zod), Stripe deposit, confirmation, Resend emails.
5. **Operations** — admin auth + AvailabilityCalendar + bookings + rates; iCal export/import + cron; sync status + owner alerts.
6. **Content & reach** — CMS wiring, Gallery, FAQ (+schema), Plan pages, Reviews, Journal/SEO pillars, sitemap/robots/OG, i18n.
7. **Hardening** — Lighthouse CI budgets, reduced-motion/a11y audit, load test the booking race path, backups/monitoring, launch.

---

*Architecture only — premium direction fully preserved. Say the word and I'll scaffold the repo (Step 1–2) or build any single slice (e.g. the booking core with blocked-date logic) end to end.*
