# Tifawave Surf Stay — Tamraght
### World-Class Luxury Surf Camp Website · UX & Design Blueprint

> *"Where the Atlantic meets the desert. Wake to offshore winds, sleep to the swell."*

A complete, conversion-optimized, mobile-first blueprint for a premium boutique surf-stay brand. Built around a cinematic surf aesthetic, modern luxury-travel polish, and a single obsession: **getting the right guest to book directly.**

---

## 1. Brand Positioning & Strategy

**One-line positioning:** *Tamraght's boutique surf sanctuary — premium stays, expert coaching, and slow-luxury Moroccan living a barefoot walk from the lineup.*

**Who we're selling to (primary personas):**

- **The Aspirational Improver** (28–42, professional, travels 2–4×/yr). Wants to *actually get better* at surfing in a beautiful place, with great food and a calm room to recover in. Books for the transformation + the aesthetic.
- **The Remote-Work Nomad** (25–38). Stays 2–4 weeks. Cares about wifi, workspace, community, and morning sessions before the laptop.
- **The Couple / Soft Adventurer** (30–50). One surfs, one wants yoga, hammam, sunset terraces, and a trip that photographs beautifully.

**What we sell (the real product):** not a bed — a *feeling of arrival*. The site must sell the **transformation and the atmosphere first**, the room second, the price last.

**Brand pillars** (every page reinforces at least one):
1. **The Wave** — world-class, consistent, beginner-to-advanced Atlantic breaks (Banana Point, Devil's Rock, Boilers, Anchor Point nearby).
2. **The Stay** — design-led rooms, rooftop terraces, slow mornings, real Moroccan hospitality.
3. **The Craft** — small-group coaching, video analysis, certified guides, ocean knowledge.
4. **The Place** — Tamraght's argan hills, fishing village rhythm, tagine dinners, hammam evenings.

**Conversion thesis:** Direct booking wins on *trust + clarity + emotion*. We out-design the OTAs (Booking, Hostelworld) by making the site feel like a place you already miss.

---

## 2. Complete Site Map

```
HOME
│
├── SURF
│   ├── Surf Packages            (the money page — packages & pricing)
│   ├── Coaching & Levels        (beginner → advanced, what each level gets)
│   ├── The Waves / Surf Guide   (breaks, seasons, swell, skill match)
│   └── Surf Photography & Video (add-on, social proof engine)
│
├── STAY
│   ├── Rooms & Suites           (room types, galleries, amenities)
│   ├── The House / Spaces       (rooftop, pool, lounge, co-work nook)
│   └── Food & Table             (breakfast, family dinners, dietary)
│
├── EXPERIENCES
│   ├── Yoga & Wellness          (sunrise yoga, hammam, massage)
│   ├── Beyond the Surf          (Paradise Valley, argan, souk, desert)
│   └── Retreats & Groups        (private buyouts, corporate, women's weeks)
│
├── STORY
│   ├── Our Story / The Founders (why Tamraght, why us)
│   ├── Tamraght & Morocco       (place storytelling)
│   └── Journal                  (SEO + inspiration blog)
│
├── PLAN YOUR TRIP
│   ├── Rates & Availability     (booking engine entry)
│   ├── Getting Here             (Agadir airport, transfers, FAQ)
│   ├── Good to Know / FAQ       (deposits, cancellation, what to pack)
│   └── Reviews                  (aggregated proof)
│
├── BOOK NOW   ← persistent, global, primary CTA
│
└── Footer utility
    ├── Contact / WhatsApp
    ├── Gift Cards
    ├── Newsletter
    ├── Careers
    └── Legal (Privacy, Terms, Cancellation Policy)
```

**Navigation rules applied:**
- **Top nav (desktop):** 5 primary items max → `Surf · Stay · Experiences · Story · Plan` + a high-contrast **Book** button pinned right. (Rule: *bottom-nav-limit / nav-hierarchy*.)
- **Mobile:** sticky top bar (logo + hamburger + Book), and a **persistent bottom action bar** with `Book · WhatsApp` after the hero scrolls past. (Rule: *fixed-element-offset, safe-area-awareness, primary-action*.)
- Current location always highlighted; back behavior preserves scroll + filter state. (*nav-state-active, state-preservation*.)

---

## 3. Homepage Structure & Section Order

Designed as a **scroll narrative** — each section answers the next question in the guest's head and pushes gently toward Book. Order is deliberate.

| # | Section | Job to be done | Conversion role |
|---|---------|----------------|-----------------|
| 1 | **Cinematic Hero** | "Wow. I want to be there." | Emotion + primary CTA |
| 2 | **Trust Strip** | "Is this legit?" | Ratings, awards, press logos |
| 3 | **The Promise (intro)** | "What is this place?" | Positioning in 2 sentences |
| 4 | **Surf Packages** | "What can I book?" | **Core conversion** |
| 5 | **The Stay / Rooms** | "Where do I sleep?" | Desire + visual proof |
| 6 | **A Day at Tifawave** | "What's it actually like?" | Storytelling / immersion |
| 7 | **The Waves & Seasons** | "Is it right for my level / dates?" | Reduce uncertainty |
| 8 | **Experiences beyond surf** | "What else?" | Widen appeal, raise basket |
| 9 | **Social Proof / Reviews** | "Do people love it?" | Trust at decision point |
| 10 | **The Place (Tamraght)** | "Why Morocco, why here?" | Differentiation |
| 11 | **Founders' Note** | "Who's behind this?" | Human trust |
| 12 | **Final CTA / Availability** | "OK — when can I go?" | **Closing conversion** |
| 13 | **Footer** | Reassurance + utility | FAQ, contact, policies |

### Section-by-section detail

**1 · Cinematic Hero (full-bleed, 100dvh)**
- Looping muted background video: a slow dawn lineup, offshore spray backlit by sun, a single surfer dropping in — graded warm/gold over teal. Poster image loads first; video lazy-swaps. (*image-optimization, font-display swap, min-h-dvh*.)
- Headline (editorial serif, large): **"Surf the Atlantic. Stay in the story."**
- Subline: *Boutique surf stays in Tamraght, Morocco — coaching, design, and slow mornings by the sea.*
- Primary CTA: **Check Availability**. Secondary, ghost: **Explore Packages**.
- Micro inline trust: ★ 4.9 · 600+ guests · Featured in [press].
- A subtle scroll cue (animated chevron / "scroll to dive in").

**2 · Trust Strip** — thin band: review score, "Superhost"-equivalent badges, press logos in muted monochrome. Builds credibility before the ask.

**3 · The Promise** — one large editorial sentence + 3 pillar tiles (Wave / Stay / Craft) with line icons. Sets the frame.

**4 · Surf Packages** — 3 tiered cards (see §9 Packages). Horizontal scroll on mobile, grid on desktop. Each card: image, name, "best for," 3 inclusions, from-price, **View / Book**. One card flagged *Most Popular* (anchor pricing). (*primary-action, number-tabular for prices*.)

**5 · The Stay** — alternating image/text "editorial split" rows for room categories. Big imagery, restrained copy, "From €X / night."

**6 · A Day at Tifawave** — horizontal timeline: 6:30 dawn patrol → breakfast → video review session → free surf → hammam → rooftop tagine dinner. Cinematic, immersive, sells the *rhythm*.

**7 · Waves & Seasons** — interactive: select your **level** (Beginner / Intermediate / Advanced) and **month**, see matched breaks + a "best for you" note. Reduces the #1 booking anxiety. (*progressive disclosure, inline help*.)

**8 · Experiences** — bento grid: Yoga, Hammam, Paradise Valley, Argan & Souk, Sunset, Photography. Each tile hover-reveals a one-liner.

**9 · Reviews** — large pull-quote + carousel of guest stories with faces, dates, home country, and *what level they were*. Logos: Google, TripAdvisor, Booking score. (*color-not-only, real names/photos*.)

**10 · The Place** — full-bleed Tamraght storytelling: argan hills, fishing boats, call to prayer at dusk. Map snippet showing proximity to breaks + Agadir airport.

**11 · Founders' Note** — portrait + signature, 3 sentences on why they built Tifawave. Humanizes the brand.

**12 · Final CTA** — full-width, warm gradient, a single date-range picker → "See available dates." Repeats ★ rating + "Free cancellation up to 30 days" reassurance.

**13 · Footer** — newsletter ("Swell reports & quiet-season offers"), WhatsApp, contact, FAQ links, policies, social, language switch (EN / FR / DE / ES).

---

## 4. Color Palette

A **cinematic surf-meets-Moroccan-luxury** system. Dark "cinema" sections for emotion (hero, story), warm light "editorial" sections for clarity (packages, rooms). Defined as **semantic tokens**, not raw hex in components. (*color-semantic, dark-mode-pairing, color-accessible-pairs*.)

### Core palette

| Token | Hex | Role |
|-------|-----|------|
| `--ink` (Deep Atlantic) | `#0B1F2A` | Cinematic dark backgrounds, footer, hero overlay |
| `--ink-700` | `#13303D` | Dark surface cards |
| `--bone` (Sand light) | `#F6F1E7` | Primary light background |
| `--linen` | `#FBF8F2` | Elevated light surface |
| `--clay` (Terracotta) | `#C9683E` | **Primary accent / CTA** — Moroccan, warm, high-energy |
| `--clay-deep` | `#A8502C` | CTA hover / pressed |
| `--seaglass` (Atlantic teal) | `#2E8B8B` | Secondary accent, links, surf-data |
| `--sun` (Golden hour) | `#E9B872` | Highlights, badges, "Most Popular" flag |
| `--text-strong` | `#0B1F2A` | Body text on light (contrast ≈ 14:1) |
| `--text-on-dark` | `#F1ECE2` | Text on ink (contrast ≈ 12:1) |
| `--muted` | `#6B7B82` | Secondary text, captions |
| `--line` | `#E3DBCC` | Dividers on light / `#1E3A47` on dark |

### Functional / semantic

| Token | Hex | Use |
|-------|-----|-----|
| `--success` | `#3F8F6B` | Availability "open", confirmations |
| `--warning` | `#D8973C` | "2 rooms left", urgency |
| `--danger` | `#C0473B` | Errors, sold-out |

**Contrast guarantees:** body text ≥ 4.5:1 in both modes; large display ≥ 3:1; functional colors always paired with an icon or label, never color alone. (*color-not-decorative-only*.)

**Usage discipline:** Clay is rare and precious — reserved almost exclusively for the *primary action* on any view. Teal carries surf/data. Sun is for delight accents only. This restraint is what reads as "luxury" rather than "busy."

---

## 5. Typography System

Editorial luxury = **high-contrast display serif + clean neutral grotesque**. Numbers tabular for prices & swell data. (*font-pairing, font-scale, number-tabular, weight-hierarchy*.)

**Premium (licensed) pairing — the "dream" spec:**
- **Display / Headings:** *Canela* or *Ogg* (Klim/Sharp) — cinematic, fashion-editorial serif.
- **Body / UI:** *Söhne* or *Suisse Int'l* — Swiss-precise grotesque.

**Production-ready Google Fonts pairing (free, ships today):**
- **Display / Headings:** **Fraunces** (high optical contrast, soft serif — luxurious yet warm). Alt: *Playfair Display*.
- **Body / UI:** **Inter** or **Satoshi** (Fontshare). Clean, legible, variable.
- **Accent / labels (optional):** **Archivo** or all-caps **Inter** with wide tracking for eyebrow labels.

### Type scale (rem · mobile → desktop)

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| Display XL | 2.75 → 4.5 | 300/400 | Hero headline |
| H1 | 2.0 → 3.0 | 400 | Section titles |
| H2 | 1.5 → 2.0 | 500 | Sub-sections |
| H3 | 1.25 → 1.5 | 500 | Card titles |
| Body L | 1.125 | 400 | Lead paragraphs |
| Body | 1.0 (16px min) | 400 | Default — never below 16px on mobile (*readable-font-size*) |
| Caption | 0.875 | 500 | Meta, captions |
| Eyebrow | 0.75 | 600, +0.12em tracking, uppercase | Section labels |

**Rules:** body line-height 1.5–1.65; measure 60–75 chars desktop / 35–60 mobile; headings tight (1.05–1.15); prices and swell heights use tabular figures so cards don't jitter. Respect Dynamic Type / system scaling.

---

## 6. UI Ideas (signature components & moments)

- **Editorial split rows** — large duotone-graded image one side, a single sentence + thin clay underline link the other. Quietly expensive.
- **"Most Popular" package card** — slightly raised, sun-gold ribbon, subtle scale on hover; anchors the middle tier.
- **Glass availability bar** — frosted, sticky date-range + guests selector that docks to the top after the hero (blur indicates it floats above content, not decoration). (*blur-purpose, fixed-element-offset*.)
- **Swell/level matcher** — segmented control (Beginner / Inter / Advanced) + month chips → live "These breaks suit you" result. Turns anxiety into confidence.
- **Day-rhythm timeline** — horizontal, snap-scrolling cards from dawn patrol to dinner.
- **Bento experiences grid** — mixed tile sizes; image tiles reveal a one-line caption on hover/tap.
- **Review cards with context** — face, country flag, dates, *and the guest's surf level* ("Total beginner → standing up by day 3").
- **Persistent mobile action bar** — `Book` (clay, primary) + `WhatsApp` (ghost) pinned bottom, safe-area aware.
- **Map-of-breaks micro-module** — stylized coastline with pin dots for Banana Point, Devil's Rock, Anchor Point + drive times.
- **Quiet-season offer banner** — dismissible, warm, non-intrusive (no countdown gimmicks).
- **Gallery lightbox** — full-bleed, swipeable, captions; pinch-zoom on mobile.
- **Gift-card / refer-a-friend** module in footer for repeat & word-of-mouth.

---

## 7. Animation Ideas

All motion is **meaningful, interruptible, and respects `prefers-reduced-motion`**. Durations 150–300ms for micro, ≤400ms for transitions; transform/opacity only (no width/height). (*motion-meaning, transform-performance, reduced-motion, interruptible*.)

- **Hero:** slow Ken-Burns drift on the video poster; headline words **stagger-fade up** (40ms apart); scroll-cue gently bobs.
- **Scroll reveals:** sections fade + rise 16–24px as they enter (IntersectionObserver), staggered 30–50ms for grids. One-time, never on scroll-back.
- **Parallax (subtle):** hero foreground/background separate at ~0.85/1.0; capped, disabled under reduced-motion.
- **Package cards:** hover lifts 4px + soft shadow + image scales 1.03 inside a fixed frame (no layout shift). Press scales to 0.98.
- **Sticky availability bar:** crossfades + slides down 12px when it docks (motion shows where it came from).
- **Number/price count-up** on first view of pricing (respects reduced-motion → shows final value instantly).
- **Image lazy-in:** blur-up / dominant-color placeholder → sharp, never a layout jump.
- **Page transitions:** directional — forward navigations slide left/up, back slides right/down; shared-element hero image when opening a room or package detail.
- **Booking confirmation:** a single restrained checkmark draw + haptic on mobile. Celebrate once, briefly.

---

## 8. Premium References (study these, don't copy)

Use as **benchmarks for craft, pacing, and restraint** — create original work.

- **Aman / Six Senses** — luxury hospitality: cinematic imagery, generous whitespace, slow reveals, emotion-before-price.
- **Nihi Sumba** — adventure-luxury storytelling; sells a feeling and a place, not a room list.
- **Soneva** — immersive scroll narrative, editorial typography.
- **The Surf Club / Soho House** — membership-feel, warm-luxury tone, beautiful "spaces" galleries.
- **Saint Laurent / Aesop** — typographic restraint, monochrome discipline, premium product-page calm.
- **Airbnb Luxe / Plum Guide** — best-in-class booking UX, trust components, transparent policies.
- **Tropicfeel / Finisterre** — modern outdoor brand energy, motion done tastefully.
- **Surf-specific:** look at how high-end surf travel (e.g. premium camps in Portugal/Sri Lanka) handle level-matching and package clarity — then do it cleaner.

What to steal conceptually: *imagery scale, whitespace, one idea per screen, emotion-first sequencing, and trust placed exactly at the decision moment.*

---

## 9. Surf Packages (recommended structure)

Three tiers + add-ons. Clear "best for," transparent inclusions, anchored middle option.

| | **Surf & Stay** | **Coached Surf Week** ★ Most Popular | **Private Progression** |
|---|---|---|---|
| Best for | Independent surfers / nomads | Improvers who want results | Couples, fast progress, privacy |
| Length | Flexible nights | 7 nights | 5–7 nights |
| Surf | Daily guided sessions | 5× coached + video analysis | 1:1 / 1:2 daily coaching |
| Stay | Shared or private room | Private room | Suite |
| Includes | Breakfast, board storage | Breakfast + 3 family dinners, yoga 2× | All meals, hammam, transfers |
| Transfers | Add-on | Airport transfer included | Included |
| From | €X / night | €XXX / week | €XXXX / week |

**Add-ons (raise basket value):** photo/video package, extra 1:1 coaching, hammam & massage, Paradise Valley day trip, board & wetsuit upgrade, single-supplement, airport transfer.

**Package page UX:** sticky summary rail (dates, guests, running total), inclusions as scannable checklists, "what a day looks like," level guidance, real reviews from that package's guests, transparent deposit + free-cancellation note, then **Book**. (*progressive-disclosure, error-clarity, multi-step-progress*.)

---

## 10. Best User Flow (conversion-optimized)

**Primary path (mobile-first):**

```
Hero (emotion + Check Availability)
   ↓
Packages (choose intent)  ←——————┐
   ↓                              │  (reassurance loops back:
Package / Room detail             │   reviews, policy, "a day here")
   ↓                              │
Date + Guests (sticky bar)  ——————┘
   ↓
Booking summary (price breakdown, free cancellation, deposit only)
   ↓
Guest details  →  Payment  →  Confirmation (+ WhatsApp + add-to-calendar)
   ↓
Post-book email sequence (pre-arrival, packing, transfer, what to expect)
```

**Conversion principles baked in:**
- **One primary CTA per screen**, always clay, always above the fold or sticky.
- **WhatsApp as the trust shortcut** — many surf-travel bookings close via chat; make it one tap everywhere.
- **Direct-book incentive** — visible "Best price guaranteed when you book direct + free cancellation 30 days" beats the OTAs at the decision moment.
- **Reduce uncertainty** before asking for money: level-matcher, seasons, real reviews, transparent policy.
- **Scarcity, honestly** — "2 rooms left for these dates" only when true; no fake countdowns.
- **Frictionless forms** — semantic input types, autofill, inline (on-blur) validation, errors below the field with a fix, autosave the date selection. (*input-type-keyboard, inline-validation, form-autosave, focus-management*.)
- **Confirmation that reassures** — summary, what happens next, WhatsApp, calendar add, "we'll send your pre-trip guide."
- **Exit-intent / abandonment** — gentle email capture ("Save these dates / get the swell report"), not a nag.

---

## 11. Conversion & Trust Checklist

- ★ Aggregate rating + review count visible in hero and at every CTA.
- Press / partner logos in muted monochrome (trust strip).
- Transparent pricing: from-price on cards, full breakdown before payment, no surprise fees.
- Free-cancellation and deposit terms stated *next to* the Book button.
- Real guest photos, names, countries, and *surf level* in reviews.
- WhatsApp + response-time promise ("we usually reply within an hour").
- Secure-payment badges at checkout; never store/handle raw card data on-page.
- FAQ that pre-empts the top 10 hesitations (airport, transfers, level, solo travel, dietary, wifi, what to pack, weather, refunds, group/private).
- Multi-currency + multi-language (EN/FR/DE/ES) for the European core market.

---

## 12. Accessibility & Quality Bar (non-negotiable)

- Contrast ≥ 4.5:1 body / 3:1 large; verified in both cinema-dark and editorial-light sections.
- Touch targets ≥ 44×44pt, ≥ 8px apart; hit-area extended for small icons.
- Visible focus rings; full keyboard nav; logical heading hierarchy h1→h6.
- All meaningful media has alt text; icon-only buttons have aria-labels; video muted + captioned, never autoplay-with-sound.
- `prefers-reduced-motion` honored everywhere; nothing relies on hover alone.
- Forms: visible labels, helper text, aria-live errors, focus first invalid field.
- Performance: WebP/AVIF, lazy-load below fold, reserve image space (CLS < 0.1), font-display swap, route-level code splitting, skeleton states > 300ms loads.
- Mobile-first breakpoints 375 / 768 / 1024 / 1440; `min-h-dvh`; safe-area-aware fixed bars; no horizontal scroll; zoom never disabled.

---

## 13. Suggested Build Stack

- **Front-end:** Next.js (App Router) + Tailwind, or Astro for content-heavy speed. Framer Motion for tasteful, reduced-motion-aware animation.
- **CMS:** Sanity / Storyblok (visual editing for rooms, packages, journal, seasons).
- **Booking engine:** a direct PMS/channel manager (e.g. Cloudbeds, Lodgify, or Beds24) embedded or API-driven — keep the booking *on your domain* so the brand experience never breaks.
- **Comms:** WhatsApp Business API + transactional email (pre-arrival sequence).
- **Analytics:** privacy-first (Plausible/Fathom) + funnel events on package → date → checkout.

---

### Next steps I can take for you
1. Turn this into a **clickable homepage prototype** (HTML/React) you can scroll on your phone.
2. Build the **Surf Packages page** with the booking summary rail.
3. Produce a **moodboard / hero mockup** in the brand palette.
4. Draft the **homepage copy** (headlines, package descriptions, founders' note).

*Prepared as a design blueprint — original creative direction inspired by, never copied from, the referenced brands.*
