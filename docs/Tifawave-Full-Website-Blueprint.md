# Tifawave Surf Stay — Full Website Blueprint
### Premium Design · UX · Conversion · Tamraght, Morocco

The complete page-by-page and flow-by-flow design specification. Same visual direction throughout — **minimal, cinematic, emotional, premium, trustworthy** — ocean/sand/sunset palette, Fraunces + Inter, clay-only primary CTAs, dark→light→dark rhythm. **No code here on purpose.** This is the experience architecture: what every page does, the order it does it in, and how each one quietly moves the guest toward a direct booking.

Companion files: `Tifawave-UX-Blueprint.md` (strategy) · `Tifawave-Build-Spec-NextJS.md` (tokens & components) · `tifawave-homepage.html` (live look & feel).

---

## 0. Design Constants (apply to every page)

These never change page-to-page — consistency *is* the luxury signal.

- **Palette zones:** Ocean (deep cinematic dark), Sand (warm light, clarity), Sunset (clay CTA + sun highlights). Clay is reserved for the single primary action per view.
- **Type:** Fraunces (display, weight 300–400, size carries impact) + Inter (UI/body, 16px floor, tabular figures for prices/dates).
- **Rhythm:** sections alternate dark/light to feel filmic; one idea per screen; generous whitespace.
- **Motion:** scroll reveals (translateY + fade, once), card lift on hover, frosted nav on scroll, all transform/opacity, all reduced-motion safe.
- **Persistent conversion rails:** desktop = sticky nav `Check Availability` pill; mobile = sticky bottom Book + WhatsApp bar after the hero.
- **Trust everywhere:** ★4.9 rating, free-cancellation line, and "best price direct" sit beside every meaningful CTA.
- **Imagery:** full-bleed, cinematic, real (no stock-feeling clichés); captions add story, not decoration.

---

## 1. Complete Page Inventory (Site Map)

```
PRIMARY (in nav)
├── Home
├── Surf
│   ├── Surf Packages              ← core conversion page
│   ├── Coaching & Levels
│   ├── The Waves / Surf Guide
│   └── Surf Photography & Video
├── Stay
│   ├── Rooms & Suites             ← room conversion page
│   ├── The House / Spaces
│   └── Food & Table
├── Experiences
│   ├── Yoga & Wellness
│   ├── Beyond the Surf
│   └── Retreats & Group Buyouts
├── Story
│   ├── Our Story / Founders
│   ├── Tamraght & Morocco
│   └── Journal (blog index)  →  Journal Article (template)
└── Plan
    ├── Rates & Availability        ← booking engine entry
    ├── Getting Here
    ├── Good to Know / FAQ
    └── Reviews

GLOBAL / UTILITY
├── Book Now (booking flow — multi-step)
├── Gallery
├── Gift Cards
├── Contact / WhatsApp
├── Newsletter (footer)
├── Search (optional)
└── Legal: Privacy · Terms · Cancellation Policy · Cookie Notice

SYSTEM / TRANSACTIONAL (no nav)
├── Booking Summary
├── Checkout / Guest Details
├── Payment
├── Confirmation / Thank You
├── Booking-managed (modify / cancel via link)
├── 404 · 500 · Offline
└── Email templates (confirmation, pre-arrival, post-stay review request)

ADMIN (private, separate concept — see §13)
├── Availability & Blocked Dates calendar
├── Rates & Seasons
├── Bookings list
└── Content (rooms, packages, journal)
```

Navigation discipline: **5 primary nav items max** (Surf · Stay · Experiences · Story · Plan) + the `Check Availability` pill. Everything else lives in dropdown panels, the footer, or the booking flow. Secondary/utility items never crowd the top bar.

---

## 2. Homepage — Section Order & Intent

The scroll is a narrative; each section answers the next question in the guest's head, ending in a booking. (Detailed and prototyped already — summarized here for completeness.)

| # | Section | Question it answers | Conversion role | Zone |
|---|---------|---------------------|-----------------|------|
| 1 | Cinematic hero (100svh) | "Do I want to be there?" | Emotion + primary CTA | Ocean |
| 2 | Trust strip | "Is this legit?" | Credibility | Ocean |
| 3 | The Promise / 3 pillars | "What is this place?" | Positioning | Sand |
| 4 | **Surf Packages** | "What can I book?" | **Core conversion** | Ocean |
| 5 | The Stay (split) | "Where do I sleep?" | Desire | Sand |
| 6 | A Day at Tifawave (timeline) | "What's it actually like?" | Immersion | Sand |
| 7 | The Waves & Seasons (matcher) | "Right for my level/dates?" | Reduce anxiety | Sand |
| 8 | Experiences (bento) | "What else?" | Widen appeal / raise basket | Sand |
| 9 | Reviews | "Do people love it?" | Trust at decision | Ocean |
| 10 | The Place (Tamraght) | "Why here?" | Differentiation | Sand |
| 11 | Founders' note | "Who's behind this?" | Human trust | Sand |
| 12 | Final CTA + date picker | "When can I go?" | **Closing conversion** | Sunset |
| 13 | Footer | reassurance + utility | FAQ, contact, policy | Ocean |

Conversion logic: emotion first, packages early (while excitement is high), proof and reassurance placed *exactly* at the two CTA moments (packages, final). Price is never the lead.

---

## 3. Rooms & Suites Page

**Goal:** turn "nice place" into "I can picture *my* stay" → push to dates. Sells calm and design, not bullet lists of amenities.

**Section order**
1. **Slim hero** (40–60vh, not full) — one cinematic room/rooftop image, eyebrow "The Stay", H1 "Rooms that feel like the calm after a session," one line of copy. Keeps focus on the rooms below, not another giant hero.
2. **Intro band** — 2 sentences on the design philosophy (lime-wash, linen, light, sea air) + 3–4 house-wide inclusions as quiet inline chips (breakfast · rooftop · board storage · fast wifi).
3. **Room cards (the core)** — vertical stack of editorial rows, *alternating* image-left / image-right so it reads like a magazine, not a grid of identical tiles:
   - Each row: large gallery-linked image (hover = subtle zoom + "View gallery" affordance), room name (Fraunces), 1-line character description, sleeps/bed/view/size as small icon facts, **From €X/night** (tabular), and two actions — **Check dates** (primary clay) + **See gallery** (ghost).
   - Room tiers (example): *Sea Breeze Double · Garden Twin · Rooftop Suite · Private Studio*.
4. **The House / Spaces** — bento grid of shared spaces (rooftop terrace, pool, lounge, co-work nook, hammam) — sells the *between-surf* life.
5. **What's included** — clean comparison strip across room types (bed, view, ensuite, AC, balcony, max guests) — tabular, scannable, honest.
6. **A day / mornings here** — small reuse of the day-rhythm idea, room-focused (waking to offshore wind).
7. **Reviews filtered to stay** — guests talking about the room/comfort specifically.
8. **CTA band** — "Find your room for these dates" + inline date/guest selector → availability.

**Room detail (sub-page or expanded panel)**
- Full-width gallery (swipeable, pinch-zoom, captions) with a shared-element transition from the card image.
- Sticky right rail (desktop) / sticky bottom bar (mobile): dates, guests, live price, **Reserve**. Rail updates as dates change; shows "Free cancellation 30 days · deposit only."
- Honest detail: exact bed config, floor, view, what's included vs add-on, accessibility notes.
- "Best paired with" → relevant surf package (cross-sell, raises basket).
- Mini-map: distance to break, beach, village, airport.

**UX rules:** images with reserved dimensions (no CLS), one primary CTA per row, prices tabular, gallery captions descriptive, all touch targets ≥44px.

---

## 4. Surf Packages Page (core conversion)

**Goal:** match the guest to the right package with zero anxiety, then book. This is where money is made — design for clarity and confidence.

**Section order**
1. **Hero (medium)** — "Choose your week," one line on transparent pricing + real coaching, ★ rating inline.
2. **Level matcher (anxiety-killer, place it high)** — segmented control *Beginner / Improver / Advanced* + month chips → live result: "These breaks and this package suit you." Removes the #1 hesitation before they scroll the prices.
3. **Package tiers (3 cards)** — *Surf & Stay · Coached Surf Week ★ · Private Progression*. Middle featured (sun ribbon, slight raise) to anchor. Each card: image, "best for," 3 headline inclusions, **From price** (tabular), **View / Book**.
4. **Full comparison table** — every inclusion across tiers (nights, coached sessions, video analysis, room type, meals, transfers, yoga, hammam). Sticky header row; mobile collapses to per-column accordion. Honest, exhaustive — luxury buyers verify.
5. **What a day looks like** — the timeline, framed around progression.
6. **Coaching & levels explainer** — what beginner→advanced actually gets, certified guides, video analysis, group size cap. Builds trust in the *craft* pillar.
7. **Add-ons (basket-raisers)** — photo/video package, extra 1:1 coaching, hammam & massage, Paradise Valley trip, board/wetsuit upgrade, airport transfer, single-supplement. Shown as selectable chips that preview added cost.
8. **Reviews filtered to the package** — "Total beginner → standing by day 3" with level + country.
9. **Transparent policy band** — deposit %, free-cancellation window, what's refundable. Removes friction before the ask.
10. **CTA** — "Check availability for your week" → dates → booking flow.

**Package detail / booking entry**
- Sticky summary rail: selected package, dates, guests, running total with add-ons, deposit due today, **Continue to book**.
- Inclusions as scannable checklists (icon + text), add-ons as toggles updating the total live.
- Progressive disclosure: choose package → dates → room/level → add-ons → summary. One decision per step, step indicator, back nav, autosave.

**Conversion rules:** anchor on the featured middle tier; from-prices on cards, full breakdown only at summary (no surprise fees); scarcity only when true; WhatsApp shortcut for "not sure which package?" questions.

---

## 5. Booking Flow UX (end-to-end)

The whole point of the site. Mobile-first, calm, reassuring, reversible until payment.

**The path**
```
Entry (hero / package / room / final CTA / availability page)
  → 1 DATES & GUESTS
  → 2 CHOOSE (room or package + level)
  → 3 ADD-ONS (optional, skippable)
  → 4 SUMMARY (price breakdown + policy + deposit)
  → 5 GUEST DETAILS
  → 6 PAYMENT (deposit)
  → 7 CONFIRMATION (+ WhatsApp + calendar + pre-trip promise)
```

**Step principles**
- **Step indicator** at top (1–4 of the pre-payment steps), each step a clear single decision — *progressive disclosure*, never a wall of fields.
- **Persistent summary** (right rail desktop / collapsible top sheet mobile): dates, nights, guests, line items, running total, deposit due today, **free cancellation 30 days**. Always visible so there are no surprises.
- **Calendar UX:** unavailable dates clearly disabled (not hidden — explained on tap: "min 3-night stay" / "arrivals Sat only" if applicable); selected range highlighted; min/max-stay rules surfaced inline; price-per-night hint on hover/tap; today's currency shown, switchable.
- **Form UX:** visible labels (never placeholder-only), semantic input types (email/tel/number triggering correct mobile keyboard), autofill enabled, inline validation **on blur** with error *below* the field stating cause + fix, auto-focus first invalid field, `aria-live` announcements, **autosave** so an interrupted session restores.
- **Payment:** deposit-only model to lower the leap; secure-payment badges; **the site never handles raw card data** — payment is via the embedded PCI-compliant provider/booking engine. Clear "you'll be charged €X deposit now, balance on arrival/30 days before."
- **Reassurance at the ask:** policy summary, response-time promise, "questions? WhatsApp us" one tap.
- **Confirmation page:** big calm checkmark, booking reference, what's included, **what happens next**, add-to-calendar, WhatsApp link, "we'll email your pre-arrival guide (transfers, packing, tides)." A single celebratory moment, then useful.
- **Abandonment recovery:** if email captured early, gentle "your dates are saved" follow-up — never a nag, no fake countdowns.
- **Edge states:** dates just became unavailable → friendly message + nearest open dates suggested; payment fail → retry with clear cause; timeout → retry option.

**Why deposit + free-cancellation:** lowers commitment anxiety, beats OTAs on flexibility, and the direct-price guarantee removes the reason to go check Booking.com.

---

## 6. Mobile Sticky Booking Bar

The persistent conversion engine on phones.

- **Appears** after the hero scrolls ~70% out of view (slides up from below — motion shows origin). Hidden over the hero so it never blocks the cinematic first impression.
- **Contents:** primary **Check Availability** (clay pill) + secondary **WhatsApp** (glass). On room/package detail pages it becomes contextual: shows live **From €X · dates** and the action becomes **Reserve**.
- **Behavior:** safe-area aware (sits above the gesture bar), doesn't cover content (page reserves bottom padding), stays out of the way while typing in forms (hides when a keyboard/input is focused).
- **Contextual intelligence:** on a room page → "Sea Breeze Double · €59/night · Check dates"; in the booking flow → replaced by the step's own primary action; on FAQ/legal → simplified to a single Book button.
- **Tap target ≥44px**, 8px gap between the two buttons, clear pressed feedback.
- **Never** two competing primaries — WhatsApp is visually subordinate (ghost), Book is clay.

---

## 7. WhatsApp Flow (trust shortcut & soft-close)

Surf-travel decisions often close in chat. WhatsApp is the low-friction human channel — not a gimmick, a conversion tool.

- **Entry points:** mobile sticky bar, footer, contact page, a "Not sure which package? Ask us" link on the packages page, and the confirmation page.
- **Pre-filled context:** tapping opens WhatsApp with a smart pre-filled message based on where they tapped — e.g. from a room page: *"Hi Tifawave! I'm looking at the Sea Breeze Double for [dates] — is it available?"* — so the conversation starts warm and specific (the guest can edit before sending).
- **Response promise:** "We usually reply within an hour (GMT)" shown near every WhatsApp entry — sets expectation, builds trust.
- **Business hours handling:** outside hours, a one-line note ("we'll reply first thing — meanwhile, check live availability") + link back to the booking flow so momentum isn't lost.
- **Use cases it serves:** level/package uncertainty, dietary or accessibility questions, group/private buyouts, airport transfer timing, "can you hold these dates?" — all the questions that otherwise cause abandonment.
- **Privacy:** no auto-sending, no capturing of contact details without consent; the guest initiates and controls the message.
- **Visual:** WhatsApp green only on the icon glyph; the button itself stays on-brand (glass/ghost) so it never clashes with the palette.

---

## 8. Gallery

**Goal:** sell the feeling at full scale — the strongest emotional asset on the site.

- **Layout:** editorial masonry / bento mix (varied tile sizes), *not* a uniform thumbnail grid. Large hero image leads.
- **Filter chips:** *All · Surf · Rooms · Spaces · Food · Tamraght · Sunsets · People.* One tap to curate by intent (a surfer filters Surf; a couple filters Rooms/Sunsets).
- **Lightbox:** full-bleed, swipeable, pinch-zoom on mobile, keyboard-navigable on desktop, captions that tell a micro-story ("Dawn at Banana Point, offshore and empty"), counter (3/24), and a contextual **Book your stay** CTA inside the lightbox.
- **Performance:** lazy-load below fold, blur-up placeholders, reserved dimensions (no jump), WebP/AVIF, virtualize if very large.
- **Video tiles:** muted autoplay loops on capable devices (respect reduced-motion → static poster), tap to expand with sound.
- **Conversion tie-in:** every few images, a quiet inline prompt or the persistent book bar keeps the path open; gallery images deep-link to the relevant room/package where possible.
- **A11y:** descriptive alt text on every meaningful image; lightbox focus-trapped with clear close/Esc/swipe-down.

---

## 9. FAQ / Good to Know

**Goal:** pre-empt the top hesitations so they never become abandonment or an email.

- **Structure:** grouped accordions by theme, not one long list:
  - *Booking & Payment* (deposit, balance, cancellation, currencies, group bookings)
  - *Getting Here* (Agadir airport, transfers, taxis, drive time)
  - *Surfing* (levels, can total beginners join, board/wetsuit hire, group size, non-surfers)
  - *The Stay* (check-in/out, what's included, wifi, laundry, dietary needs, accessibility)
  - *Tamraght & Morocco* (weather by season, what to pack, money, safety, solo travel, alcohol, connectivity)
- **UX:** searchable/filterable; accordions animate open smoothly (not snap); only relevant group expanded; deep-linkable (`/faq#cancellation`) so support and emails can point straight to an answer.
- **Conversion:** each major group ends with a soft action — "Still unsure? WhatsApp us" or "Check live dates." The cancellation answer restates the free-cancellation reassurance.
- **Tone:** warm, honest, specific (real numbers: "20 min from Agadir (AGA) airport"). No corporate hedging — clarity reads as trustworthy.
- **SEO bonus:** FAQ content is structured for rich results (see §10).

---

## 10. SEO Page Structure

**Goal:** capture high-intent surf-travel search and feed direct bookings (reduce OTA dependence).

**Architecture & priority**
- **Pillar pages** (high-value, deeply built): `Surf Camp Morocco`, `Tamraght Surf`, `Learn to Surf Morocco`, `Surf & Yoga Retreat Morocco`. Each targets a head term, links down to packages/rooms.
- **Cluster / supporting:** Surf Guide (per break: Banana Point, Devil's Rock, Anchor Point), Best Time to Surf in Morocco, Beginner vs Intermediate guide, Getting to Tamraght from Agadir, Tamraght vs Taghazout.
- **Money pages:** Packages, Rooms, Rates & Availability — internally linked from every pillar/cluster article.
- **Journal (blog):** ongoing inspiration + long-tail ("what to pack for a surf trip to Morocco," "surfing in Morocco in winter") — each links to a relevant package.

**On-page system (every page)**
- One clear `H1`, logical `H2/H3` hierarchy (no skipped levels).
- Unique title tag + meta description per page; descriptive, human, keyword-aware (not stuffed).
- Clean, readable URLs: `/surf/packages`, `/stay/rooms/rooftop-suite`, `/journal/best-time-to-surf-morocco`.
- Descriptive alt text on imagery (doubles as a11y).
- Internal linking: pillars → clusters → money pages; breadcrumbs on 3+ level pages.
- Fast Core Web Vitals (the perf rules already specced) — speed is ranking + conversion.

**Structured data (schema.org)**
- `LodgingBusiness` / `Resort` (name, geo, amenities, price range, rating).
- `Product` + `Offer` on packages (price, availability, currency).
- `FAQPage` on the FAQ (rich-result eligible).
- `Review` / `AggregateRating` from real guest reviews.
- `BreadcrumbList`, `Organization`, `WebSite` (sitelinks search).

**Local & multilingual**
- Local SEO: Google Business Profile alignment, NAP consistency, Tamraght/Agadir geo signals.
- Multilingual (EN/FR/DE/ES) with `hreflang`; translate pillar + money pages first.
- `sitemap.xml` + sensible `robots.txt`; canonical tags to avoid duplicate (e.g. filtered gallery/room variants).

---

## 11. Cross-Page Conversion System (summary)

What runs across the whole site, not any single page:
- **Two persistent rails:** desktop nav CTA + mobile sticky bar.
- **Trust triad at every CTA:** ★ rating · free cancellation · best-price-direct.
- **WhatsApp soft-close** wherever uncertainty lives.
- **Honest scarcity** only when real.
- **Emotion → desire → proof → price → ask**, in that order, on every conversion page.
- **One primary (clay) CTA per view**, always.

---

## 12. System & Edge Pages (UX intent)

- **404 / 500:** on-brand (cinematic dark, a calm line — "This wave didn't break"), with search + links back to Home/Packages/Book. Never a dead end.
- **Offline (PWA):** friendly message + cached key info; queue any form intent.
- **Empty states:** "No dates match — here are the closest open weeks" with a one-tap adjust.
- **Loading:** skeletons/shimmer for anything >300ms (gallery, availability), never a blank frame or endless spinner.
- **Cookie/consent:** privacy-first default, decline-friendly, never blocks content with a wall.

---

## 13. Admin / Blocked-Date Concept

> A separate, private surface — not part of the public site experience, but designed so the public booking flow always reflects truth.

**Purpose:** let the owner control availability, rates, and content without a developer, and ensure the public calendar never shows a date that's actually taken.

**Core modules**
1. **Availability & Blocked Dates calendar (the key one)**
   - Month/week view of every room.
   - Owner can **block** dates (maintenance, owner's stay, private buyout), set them as **booked**, or **open** them. Blocked/booked dates instantly flow to the public booking calendar as disabled (with the right reason rule, e.g. min-stay).
   - **Channel sync:** two-way iCal/channel-manager sync so Booking.com / Airbnb reservations auto-block the direct calendar (and vice-versa) — prevents double-booking. This is the single most important operational safeguard.
   - Rules engine: minimum-stay, arrival/departure-day restrictions, lead time, seasonal closures — all surfaced to the guest as clear inline messaging, never silent failures.
2. **Rates & Seasons**
   - Per-room, per-season pricing; package pricing; add-on pricing; deposit %; currency. Optional dynamic rules (weekend uplift, last-minute, long-stay discount).
3. **Bookings**
   - List + detail of direct bookings: guest, dates, package, balance, status. Trigger pre-arrival email, modify, or process cancellation per policy. (Cancellation/refund actions are owner-confirmed, never automated destructively.)
4. **Content**
   - Edit rooms, packages, gallery, journal, FAQ, seasons copy via CMS — visual, no code.

**Design/UX intent for admin** (kept consistent with brand, but utility-first):
- Same tokens (calmer, denser): clear calendar legend (Open / Booked / Blocked / Held), color **plus** label/pattern (never color alone).
- Confirmation on destructive or bulk actions; undo where possible; autosave.
- Mobile-usable (owner often on phone) but optimized for quick desktop calendar work.
- Clear audit: who blocked what, when; sync status indicator ("last synced 4 min ago").

**Conceptual data the public site reads:** `availability[roomId][date] = open | booked | blocked` + `rules` (min-stay, arrival days) + `rates[roomId][season]`. The public calendar is purely a *reflection* of this — so blocking a date in admin is the one action that guarantees the guest can't book it.

---

## 14. Build Order Recommendation (when you're ready)

Design/spec is done. Suggested implementation sequence (highest conversion value first):
1. Home + Nav/Footer + sticky bars + booking flow skeleton (the spine).
2. Surf Packages + Rooms (the two money pages).
3. Booking engine integration + admin/blocked-date sync (the operational core).
4. Gallery, FAQ, Plan/Getting-Here, Reviews.
5. Story, Experiences, Journal + SEO pillar pages.
6. Multilingual + structured data + polish pass.

---

*Design, UX, and conversion blueprint only — no code, as requested. Ready to turn any single page (or the booking flow) into a build whenever you say go.*
