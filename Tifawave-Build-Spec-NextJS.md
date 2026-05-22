# Tifawave Surf Stay — Build Spec
### Next.js + Tailwind · Cinematic Luxury Surf Retreat

This is the implementation-ready companion to the UX Blueprint. It turns the strategy into design tokens, a wireframe, motion tokens, and copy-paste component code. Design feel: **minimal · cinematic · emotional · premium · trustworthy.** Explicitly *not* a hostel template — large imagery, generous whitespace, one idea per screen, editorial type, emotion before price.

> A working visual of all of this is in **`tifawave-homepage.html`** — open it to feel the motion, palette, and pacing.

---

## 1. Complete Homepage Wireframe

```
┌──────────────────────────────────────────────────────────┐
│ NAV (transparent → frosted on scroll)                      │
│ Tifawave.   Surf  Stay  Experiences  Story  Plan   [Book] │
└──────────────────────────────────────────────────────────┘
╔════════════════════════════ HERO · 100svh ════════════════╗
║  eyebrow: TAMRAGHT · MOROCCO                               ║
║                                                            ║
║   Surf the Atlantic.            (display serif, staggered) ║
║   Stay in the story.                                       ║
║                                                            ║
║   one-line emotional subhead (max 48ch)                    ║
║                                                            ║
║   [ Check Availability → ]   [ Explore Packages ]          ║
║   ★★★★★ 4.9 · 600+ guests · Free cancellation              ║
║                          ↓ scroll cue                      ║
╚════════════════════════════════════════════════════════════╝
│ TRUST STRIP  · 4.9 Google · 9.6 Booking · Press · 600+    │  (dark band)
├──────────────── THE PROMISE / PILLARS ────────────────────┤
│  H2 positioning line                                       │
│  [ The Wave ]   [ The Stay ]   [ The Craft ]   (3 cards)   │
├──────────────────── SURF PACKAGES (dark) ─────────────────┤
│  [ Surf&Stay ]  [ Coached Week ★ ]  [ Private ]            │  ← core conversion
│   img/from-price/3 inclusions/Book   (middle = featured)   │
├──────────────────── THE STAY (split) ─────────────────────┤
│  [   image   ] | H2 + 2 lines + "From €59" + view rooms→   │
├──────────────── A DAY AT TIFAWAVE (timeline) ─────────────┤
│  06:30 → 09:00 → 11:00 → 15:00 → 18:00 → 20:00 (h-scroll)  │
├─────────────────── THE PLACE (split, reversed) ───────────┤
│  H2 Tamraght + map proximity | [   image   ]               │
├──────────────────── REVIEWS (dark, centered) ─────────────┤
│  ★★★★★  large pull-quote  — name · country · package       │
│  Google / Booking / TripAdvisor scores                     │
├──────────────────── FINAL CTA (sunset gradient) ──────────┤
│  "Your wave is waiting."                                   │
│  [ Check in | Guests | See available dates ]  glass bar    │
├──────────────────────── FOOTER (dark) ────────────────────┤
│  brand + newsletter | Explore | Plan | Contact             │
│  © · Privacy · Terms · Cancellation · EN/FR/DE/ES          │
└────────────────────────────────────────────────────────────┘
[ MOBILE ONLY: sticky bottom bar → Check Availability · WhatsApp ]
```

---

## 2. Exact Section Order

1. Nav (fixed, transparent over hero → frosted glass on scroll)
2. **Hero** — emotion + primary CTA (100svh, video/gradient)
3. **Trust strip** — credibility before the ask
4. **The Promise / 3 Pillars** — what this place is
5. **Surf Packages** — core conversion (dark section, 3 tiers, middle featured)
6. **The Stay** — editorial split, room desire
7. **A Day at Tifawave** — horizontal timeline, immersion
8. **The Place (Tamraght)** — reversed split, differentiation
9. **Reviews** — social proof at decision point (dark, centered)
10. **Final CTA** — sunset gradient + date picker (closing conversion)
11. **Footer** — newsletter, utility, policies
12. *(mobile)* persistent Book / WhatsApp bar appears after hero

Rhythm principle: **dark → light → dark → light**. Cinematic dark sections (hero, packages, reviews, final) carry emotion; light sections (pillars, stay, day) carry clarity. The alternation is what makes it feel like a film, not a brochure.

---

## 3. Premium Typography Pairing

**Production (free, ships today):**
- **Display / Headings — Fraunces** (variable, high optical contrast soft serif). Weights 300/400 only for headings; let size carry impact, not boldness.
- **Body / UI — Inter** (variable). Weights 400/500/600.

**Dream spec (licensed alternative):** *Canela* or *Ogg* (display) + *Söhne* (body).

```ts
// app/fonts.ts
import { Fraunces, Inter } from "next/font/google";

export const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500"],
  variable: "--font-display",
});
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});
```

**Type scale (Tailwind, mobile → desktop via clamp):**

| Role | clamp() | Tracking / leading |
|------|---------|--------------------|
| Display | `clamp(2.75rem,8vw,6.5rem)` | -0.02em / 1.05 |
| H1 | `clamp(1.9rem,5vw,3.4rem)` | -0.01em / 1.1 |
| H2 | `clamp(1.5rem,3.5vw,2.25rem)` | normal / 1.2 |
| H3 | `1.5rem` | normal / 1.3 |
| Body-L | `1.125rem` | 1.6 |
| Body | `1rem` (16px floor) | 1.6 |
| Eyebrow | `0.75rem` | +0.18em uppercase 600 |

**Rules:** headings never below weight 300 of Fraunces look thin-luxe; body never under 16px; prices/dates use `font-variant-numeric: tabular-nums`; measure capped 60–75ch desktop / 35–60ch mobile.

---

## 4. Ocean / Sand / Sunset Color Palette

Three temperature zones: **Ocean** (deep, cinematic, trust), **Sand** (warm light, clarity), **Sunset** (the accent that converts).

| Token | Hex | Zone / Role |
|-------|-----|-------------|
| `ink` | `#0B1F2A` | Ocean — hero/footer/dark sections |
| `ink-700` | `#13303D` | Ocean — dark surface |
| `bone` | `#F6F1E7` | Sand — primary light bg |
| `linen` | `#FBF8F2` | Sand — elevated light surface |
| `clay` | `#C9683E` | **Sunset — PRIMARY CTA** |
| `clay-deep` | `#A8502C` | Sunset — CTA hover/press |
| `coral` | `#E08A5B` | Sunset — gradient mid |
| `sun` | `#E9B872` | Sunset — golden-hour highlight / badges |
| `seaglass` | `#2E8B8B` | Ocean — secondary accent, links, surf data |
| `muted` | `#6B7B82` | Secondary text (light) |
| `muted-dark`| `#9DB0B6` | Secondary text (dark) |
| `line` | `#E3DBCC` | Divider light / `#1E3A47` dark |
| `success` `warning` `danger` | `#3F8F6B` `#D8973C` `#C0473B` | functional (always + icon/label) |

**Signature gradients**
- Hero sky: `radial-gradient(120% 80% at 70% 20%, sun/45%, transparent), radial(140% 90% at 20% 90%, seaglass/35%, transparent), linear(180deg, #10303d, ink, #081821)`
- Final CTA (sunset): `radial(100% 120% at 80% 0%, sun/50%, transparent), linear(135deg, clay, clay-deep 55%, ink)`

**Discipline = luxury.** Clay appears *only* on the one primary action per view. Teal owns surf/data. Sun is for delight (ribbons, stars, links). All text pairs verified ≥ 4.5:1; functional color never alone.

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0B1F2A", 700: "#13303D", 800: "#0E2731" },
        bone: "#F6F1E7", linen: "#FBF8F2",
        clay: { DEFAULT: "#C9683E", deep: "#A8502C" },
        coral: "#E08A5B", sun: "#E9B872", seaglass: "#2E8B8B",
        muted: { DEFAULT: "#6B7B82", dark: "#9DB0B6" },
        line: { DEFAULT: "#E3DBCC", dark: "#1E3A47" },
        success: "#3F8F6B", warning: "#D8973C", danger: "#C0473B",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: { xl: "18px", "2xl": "22px" },
      maxWidth: { content: "1200px" },
      transitionTimingFunction: { lux: "cubic-bezier(.22,.61,.36,1)" },
    },
  },
} satisfies Config;
```

---

## 5. Motion & Animation Direction

Tokens (global, consistent rhythm):

```css
--ease-lux: cubic-bezier(.22,.61,.36,1);  /* default ease-out */
--dur-micro: 200ms;   /* hover, press, toggles */
--dur-enter: 800ms;   /* section reveal */
--dur-exit:  280ms;   /* ~65% of enter */
--stagger:   80ms;    /* per item in a group */
```

Direction (every motion has a reason):
- **Hero:** background slow Ken-Burns drift (18s, scale 1.04→1.12); headline lines clip-mask **rise** from below, staggered 120ms; subhead + actions fade in after.
- **Section reveals:** `IntersectionObserver` at 0.15 threshold → translateY(28px)+opacity, 800ms ease-lux, one-time (`unobserve`), grids stagger 80ms.
- **Package cards:** hover lift 8px + image scale 1.06 inside a clipped frame (zero layout shift); press scale 0.98.
- **Sticky nav:** transparent→frosted crossfade on scroll>60px; padding tightens.
- **Mobile book bar:** slides up from below once hero is 70% scrolled (motion shows where it came from).
- **Numbers:** price count-up on first view (skipped under reduced-motion → final value instantly).
- **Page transitions (Next):** forward = slide left/up, back = slide right/down; shared-element hero image into room/package detail (Framer Motion `layoutId`).
- **Confirmation:** single checkmark draw + haptic.

Non-negotiables: transform/opacity only; ≤400ms for transitions; everything wrapped in `@media (prefers-reduced-motion: reduce)` that disables motion and shows final state; animations interruptible, never block input.

```tsx
// components/Reveal.tsx — reusable scroll-reveal
"use client";
import { motion } from "framer-motion";
export function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
```

---

## 6. Mobile-First Booking UX

Flow: **Hero CTA → Package → Sticky date/guest bar → Summary (deposit + free-cancel) → Details → Payment → Confirmation (+ WhatsApp + calendar)**.

Principles applied to the booking widget:
- **Sticky bottom action bar** (Book + WhatsApp), safe-area aware (`env(safe-area-inset-bottom)`), appears post-hero.
- **Inputs ≥ 44px**, semantic types (`type="date"`, `inputmode="numeric"`), autofill (`autocomplete`), labels visible (never placeholder-only).
- **Inline validation on blur**, error *below* field stating cause + fix, `aria-live="polite"`, auto-focus first invalid field.
- **Progressive disclosure** — dates → guests → package → extras, one decision at a time; step indicator with back nav; **autosave** the date selection so a dropped session isn't lost.
- **Reassurance at the ask:** "Deposit only today · Free cancellation 30 days · Best price direct" sits next to the button.
- **Honest scarcity** ("2 rooms left these dates") only when true; no fake timers.
- **WhatsApp one-tap** everywhere — many surf bookings close in chat.

```tsx
// components/BookingBar.tsx (mobile-first, sticky)
"use client";
export function BookingBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-90 flex gap-2 border-t border-white/10
                    bg-ink/85 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]
                    backdrop-blur-xl md:hidden">
      <a href="#book" className="flex-1 rounded-full bg-clay px-4 py-3.5 text-center
                                 font-semibold text-white active:scale-95 transition">
        Check Availability
      </a>
      <a href="https://wa.me/..." aria-label="Chat on WhatsApp"
         className="flex-1 rounded-full border border-white/25 bg-white/10 px-4 py-3.5
                    text-center font-semibold text-white active:scale-95 transition">
        WhatsApp
      </a>
    </div>
  );
}
```

---

## 7. Luxury Surf Retreat Visual References

Study for craft and restraint — create original work, never copy.

- **Aman / Six Senses / Soneva** — emotion-first scroll, generous whitespace, slow reveals.
- **Nihi Sumba** — sells a feeling and a place, not a room list (gold standard for adventure-luxury).
- **The Surf Club (Miami) / Soho House** — warm-luxury membership feel, beautiful "spaces."
- **Aesop / Saint Laurent** — typographic restraint, monochrome discipline, calm product pages.
- **Finisterre / Tropicfeel** — modern surf/outdoor energy, tasteful motion.
- **Airbnb Luxe / Plum Guide** — best-in-class booking trust components and transparent policy UX.

Conceptual takeaways: imagery at full scale, one idea per screen, trust placed exactly at the decision moment, and price introduced only after desire is built.

---

## 8. Component System (Next.js + Tailwind)

Recommended structure (App Router):

```
app/
  layout.tsx            // fonts, <Nav/>, <Footer/>, <BookingBar/>
  page.tsx              // composes homepage sections
  surf/packages/page.tsx
  stay/[room]/page.tsx
components/
  layout/   Nav.tsx  Footer.tsx  BookingBar.tsx  Container.tsx
  ui/       Button.tsx  Eyebrow.tsx  Reveal.tsx  Badge.tsx
  sections/ Hero.tsx  TrustStrip.tsx  Pillars.tsx  Packages.tsx
            StaySplit.tsx  DayTimeline.tsx  PlaceSplit.tsx
            Reviews.tsx  FinalCTA.tsx
  cards/    PackageCard.tsx  RoomCard.tsx  ReviewCard.tsx  TimelineCard.tsx
lib/  cn.ts  motion.ts  booking.ts
```

Primitives:

```tsx
// components/ui/Container.tsx
export const Container = ({ children, className = "" }: any) => (
  <div className={`mx-auto w-full max-w-content px-6 ${className}`}>{children}</div>
);

// components/ui/Eyebrow.tsx
export const Eyebrow = ({ children, dark = false }: any) => (
  <span className={`text-xs font-semibold uppercase tracking-[0.18em]
    ${dark ? "text-sun" : "text-seaglass"}`}>{children}</span>
);
```

```tsx
// components/cards/PackageCard.tsx
import { Button } from "@/components/ui/Button";
type Pkg = { name:string; best:string; items:string[]; price:string; unit:string; featured?:boolean };
export function PackageCard({ name, best, items, price, unit, featured }: Pkg) {
  return (
    <article className={`group flex flex-col overflow-hidden rounded-2xl border bg-ink-700
        transition duration-400 ease-lux hover:-translate-y-2
        ${featured ? "border-sun" : "border-line-dark"}`}>
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-clay-deep to-sun
                        transition-transform duration-500 ease-lux group-hover:scale-105" />
        {featured && (
          <span className="absolute right-3.5 top-3.5 rounded-full bg-sun px-3 py-1.5
                           text-[11px] font-bold uppercase tracking-wider text-ink">
            Most Popular
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-2xl font-normal text-white">{name}</h3>
        <span className="mb-5 text-sm font-medium text-sun">{best}</span>
        <ul className="mb-6 flex flex-col gap-3">
          {items.map((t) => (
            <li key={t} className="flex items-start gap-2.5 text-[15px] text-[#CFDADD]">
              <CheckIcon /> {t}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-center justify-between">
          <p className="tabular-nums">
            <span className="block text-[11px] uppercase tracking-widest text-muted-dark">From</span>
            <span className="font-display text-3xl text-white">{price}</span>
            <span className="text-xs text-muted-dark"> /{unit}</span>
          </p>
          <Button href="#book">Book</Button>
        </div>
      </div>
    </article>
  );
}
```

Each section is a server component; only interactive bits (`Nav`, `BookingBar`, `Reveal`, count-up) are `"use client"`. Images via `next/image` with explicit `width/height`/`fill` + `sizes` to keep CLS < 0.1. Icons from **Lucide** (consistent 1.8 stroke). No emoji as icons.

---

## 9. Premium CTA Design

The single most important pixel on the site. Anatomy:

- **Shape:** fully rounded pill (100px radius) — softer, more "hospitality" than sharp corners.
- **Color:** `clay` fill, white label. The *only* element on the screen wearing clay.
- **Depth:** warm tinted shadow `0 10px 30px -8px rgba(201,104,62,.6)` — glows like sunset, not a generic gray drop.
- **Label:** verb-first and specific — *"Check Availability"* (intent), not "Submit"/"Learn more". Pair with a thin arrow icon that nudges 5px right on hover.
- **Motion:** hover lifts -3px + shadow deepens (200ms ease-lux); press scales 0.98; loading state swaps label for spinner and disables.
- **Secondary CTA:** glass ghost (`bg-white/8 + border-white/28 + blur`) — clearly subordinate, never competes.
- **One primary per view.** On dark sections the primary stays clay; on the sunset final-CTA it inverts to a white pill on the gradient for contrast.

```tsx
// components/ui/Button.tsx
import { cn } from "@/lib/cn";
type Props = { href?: string; variant?: "primary" | "ghost"; loading?: boolean; children: React.ReactNode };
export function Button({ href, variant = "primary", loading, children }: Props) {
  const base = "inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold " +
    "transition duration-200 ease-lux active:scale-[0.98] disabled:opacity-50";
  const styles = {
    primary: "bg-clay text-white shadow-[0_10px_30px_-8px_rgba(201,104,62,.6)] " +
             "hover:-translate-y-0.5 hover:bg-clay-deep hover:shadow-[0_16px_40px_-10px_rgba(201,104,62,.7)]",
    ghost:   "border border-white/28 bg-white/10 text-white backdrop-blur hover:-translate-y-0.5 hover:bg-white/16",
  }[variant];
  const cls = cn(base, styles);
  const inner = loading ? <Spinner /> : children;
  return href ? <a href={href} className={cls}>{inner}</a>
              : <button className={cls} disabled={loading}>{inner}</button>;
}
```

---

## 10. Navbar & Footer Structure

### Navbar
- **Layout:** logo left · 5 primary links center · `Check Availability` pill right. Mobile collapses to logo + Book + hamburger.
- **Behavior:** transparent over hero (white text), transitions to frosted glass (`bg-ink/72 + backdrop-blur-18px + 1px white/8 border`) on scroll > 60px; height tightens slightly.
- **State:** active route highlighted (color + weight); links 14.5px, 88%→100% opacity on hover.
- **A11y:** real `<nav>` + `<a>`, focus rings, hamburger toggles an accessible drawer (focus-trapped, swipe-down/Esc to close), 44px targets.
- **Primary nav max 5** items; secondary stuff (gift cards, careers, language) lives in footer/drawer — never crammed up top.

```tsx
// components/layout/Nav.tsx (behavior sketch)
"use client";
import { useEffect, useState } from "react";
const LINKS = [["Surf","#packages"],["Stay","#stay"],["Experiences","#experiences"],["Story","#story"],["Plan","#plan"]];
export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h, { passive: true }); h();
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-100 transition-all duration-400
      ${scrolled ? "border-b border-white/10 bg-ink/70 backdrop-blur-xl" : ""}`}>
      <nav className="mx-auto flex max-w-content items-center justify-between px-6 py-4">
        <a href="/" className="font-display text-xl text-bone">Tifawave<span className="text-sun">.</span></a>
        <ul className="hidden gap-8 md:flex">
          {LINKS.map(([l,h]) => (
            <li key={l}><a href={h} className="text-[14.5px] font-medium text-bone/90 hover:text-bone">{l}</a></li>
          ))}
        </ul>
        <a href="#book" className="rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-white
                                   transition hover:-translate-y-0.5 hover:bg-clay-deep">Check Availability</a>
      </nav>
    </header>
  );
}
```

### Footer
Four-column on desktop, stacks on mobile:

| Brand (1.6fr) | Explore | Plan | Contact |
|---------------|---------|------|---------|
| Logo + one-line positioning + **newsletter** ("Swell reports & quiet-season offers") | Surf Packages · Rooms & Suites · Experiences · Our Story | Rates & Availability · Getting Here · FAQ · Reviews | WhatsApp · email · Gift Cards · Language (EN/FR/DE/ES) |

Bottom bar: `© 2026 Tifawave Surf Stay · Tamraght` left; `Privacy · Terms · Cancellation Policy` right; social icons (Lucide). Dark `ink-800` background, `muted-dark` text, links hover to `sun`. Generous top padding (80px) so it reads calm, not crammed.

---

## Quality Gate (pre-launch)
- Contrast ≥ 4.5:1 verified in both ocean-dark and sand-light zones.
- Touch targets ≥ 44px, ≥ 8px apart; nav, cards, booking inputs all pass.
- `prefers-reduced-motion` disables every animation and shows final state.
- `next/image` everywhere with dimensions; fonts `display: swap`; route-level code splitting; CLS < 0.1.
- Mobile-first 375/768/1024/1440; `min-h-[100svh]`; safe-area-aware fixed bars; no horizontal scroll; zoom enabled.
- One primary (clay) CTA per view; secondary always subordinate.
- All icons Lucide, 1.8 stroke; zero emoji-as-icon.

---
*Companion files: `Tifawave-UX-Blueprint.md` (strategy) · `tifawave-homepage.html` (live cinematic prototype).*
