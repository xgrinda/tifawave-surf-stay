# Tifawave Production QA Checklist

Use this checklist before a production launch, after migrations, and after any booking or CMS-related release. Test on production-like data first, then repeat the critical booking/admin checks after deployment.

## Public Guest Flow

### Homepage

- [ ] Hero loads quickly on mobile and desktop.
- [ ] Primary CTAs link to working pages, especially `/book`, `/stay`, and `/surf/packages`.
- [ ] Final booking/date CTA sends guests to `/book` with any selected query values preserved.
- [ ] Stay preview uses CMS room imagery when available.
- [ ] Tamraght/place visual uses CMS gallery imagery when available.
- [ ] Package cards do not show broken images or obvious placeholder copy.
- [ ] Empty or fallback visuals feel intentional and premium.
- [ ] Header, mobile menu, footer, and sticky booking bar work.

### `/stay`

- [ ] Active rooms are listed dynamically.
- [ ] Inactive rooms are hidden.
- [ ] Each room card links to the correct `/stay/[slug]` page.
- [ ] Primary room images display without awkward cropping.
- [ ] Missing room images show a polished fallback state.
- [ ] Capacity and starting price are accurate.
- [ ] Booking CTA links to `/book`.

### `/stay/[slug]`

- [ ] Page loads for each active room slug.
- [ ] Missing or inactive rooms do not expose incorrect content.
- [ ] Room name, description, capacity, and price are correct.
- [ ] Gallery images load, respect alt text, and keep sensible aspect ratios.
- [ ] Empty gallery state is guest-friendly.
- [ ] Book CTA works and clearly relates to the current room.

### `/surf/packages`

- [ ] Active packages are listed dynamically.
- [ ] Inactive packages are hidden.
- [ ] Package cards link to `/surf/packages/[slug]`.
- [ ] Prices, duration, level, and short descriptions are correct.
- [ ] Empty state is public-facing and does not mention admin setup.
- [ ] CTA to booking works.

### `/surf/packages/[slug]`

- [ ] Page loads for each active package slug.
- [ ] Missing or inactive packages do not expose incorrect content.
- [ ] Full description, inclusions, level, duration, price, and typical day copy display correctly.
- [ ] CTA links to `/book`.
- [ ] Internal links back to packages or related booking pages work.

### `/gallery`

- [ ] Active gallery images render in a responsive grid.
- [ ] Inactive images are hidden.
- [ ] Category filters, if visible, filter correctly.
- [ ] Lightbox opens, closes, and works on mobile.
- [ ] Images use useful alt text.
- [ ] Empty gallery state is polished and does not mention admin setup.

### `/about`

- [ ] Story, Tamraght, philosophy, hospitality, and values sections read as final public copy.
- [ ] Contact links use current settings where available.
- [ ] WhatsApp, email, Instagram, and maps links work.
- [ ] CMS gallery imagery appears where available.
- [ ] CTA links to stay, packages, and booking work.

### `/faq`

- [ ] FAQ reflects manual confirmation mode, not required deposit payment.
- [ ] Booking, rooms, surf levels, Tamraght, transfers, meals, cancellations, Wi-Fi, and packing answers are present.
- [ ] Contact/WhatsApp links work.
- [ ] Accordion or section navigation works on mobile and desktop.

### `/book`

- [ ] Room select loads active rooms from Supabase.
- [ ] Date inputs are selectable on mobile and desktop.
- [ ] Date minimums prevent obvious past-date mistakes.
- [ ] Availability check returns a clear available or unavailable message.
- [ ] Hold creation displays a clean confirmation state.
- [ ] Guest details form validates required fields.
- [ ] After submission, copy says "Reservation request received" or equivalent manual-confirmation wording.
- [ ] Pay Deposit button is hidden when `ENABLE_DEPOSITS=false`.
- [ ] No guest personal data is exposed in public API responses.

### French Pages

- [ ] `/fr` homepage works and keeps the same structure as English.
- [ ] `/fr/stay` and `/fr/stay/[slug]` display French public copy.
- [ ] `/fr/surf/packages` and `/fr/surf/packages/[slug]` display French public copy.
- [ ] `/fr/gallery`, `/fr/about`, `/fr/faq`, and `/fr/book` display French labels and messages.
- [ ] Language switcher links between equivalent English and French pages where available.
- [ ] French booking copy reflects manual confirmation mode when deposits are disabled.

## Booking Flow

### Availability Check

- [ ] `GET /api/availability` returns `400` for missing required params.
- [ ] Invalid date ranges return a validation error or unavailable response.
- [ ] Valid requests return only `available`, `reason`, and `message`.
- [ ] Active bookings block overlapping availability.
- [ ] Active blocked dates block overlapping availability.
- [ ] Active, unexpired holds block overlapping availability.
- [ ] Expired or released holds do not block availability.

### Hold Creation

- [ ] `POST /api/booking/holds` returns `400` for missing required params.
- [ ] Invalid date ranges return `400`.
- [ ] Available dates create a hold with only `holdId` and `expiresAt` returned.
- [ ] Overlapping holds/bookings are rejected by the database constraint.
- [ ] Releasing a hold succeeds and does not expose guest data.
- [ ] Duplicate submissions are prevented in the UI.

### Guest Request Submission

- [ ] Guest name, email, and phone/WhatsApp are required.
- [ ] Optional message saves correctly.
- [ ] A valid hold converts into a pending booking.
- [ ] Response returns only `bookingId` and `status`.
- [ ] Booking remains `pending` until admin action.
- [ ] Internal notification email sends through Resend.
- [ ] Guest confirmation email sends through Resend with pending-confirmation wording.

### Manual Confirmation Copy

- [ ] Public booking success state says reservation request received.
- [ ] Copy explains the Tifawave team will review and confirm.
- [ ] Copy does not promise automatic confirmation when deposits are disabled.
- [ ] Pay Deposit CTA is hidden when `ENABLE_DEPOSITS=false`.
- [ ] Existing Stripe checkout can still be re-enabled later with `ENABLE_DEPOSITS=true`.

### Admin Confirm/Cancel

- [ ] Pending bookings appear in admin by default.
- [ ] Admin can set booking status to `confirmed`.
- [ ] Admin can set booking status to `cancelled`.
- [ ] Status updates are reflected in filtered booking tabs.
- [ ] Cancelled bookings no longer block inventory if that is the intended status behavior.

### Blocked Dates

- [ ] Admin can create blocked date ranges per room.
- [ ] Admin can remove blocked date ranges.
- [ ] Blocked dates appear in admin with room, dates, and source metadata where present.
- [ ] Blocked dates prevent public availability.
- [ ] Removed blocked dates reopen availability unless another booking, hold, or import blocks the dates.

### iCal Export

- [ ] Per-room iCal feed endpoint returns valid `.ics` content.
- [ ] Confirmed/paid bookings appear in the feed as expected.
- [ ] Blocked dates appear in the feed as expected.
- [ ] Feed does not expose sensitive guest details.
- [ ] External iCal imports create blocked dates.
- [ ] Removed external events reopen imported blocked dates on the next sync.
- [ ] Duplicate external events do not create duplicate blocked dates.

## Admin

### Login/Logout

- [ ] `/admin/login` rejects incorrect passwords.
- [ ] Correct password creates an admin session.
- [ ] Protected admin pages redirect unauthenticated users.
- [ ] Logout clears the session.
- [ ] Admin pages are not indexed or linked from public navigation.

### Settings

- [ ] Business name saves and appears where expected.
- [ ] Contact email, support phone, WhatsApp, address, maps URL, and Instagram URL save correctly.
- [ ] Default currency and Stripe deposit display fields save without affecting manual mode.
- [ ] Booking notice text saves and appears where expected.
- [ ] Invalid URLs or empty required fields are handled cleanly.

### Rooms

- [ ] Admin can create a room.
- [ ] Admin can edit name, slug, description, capacity, and base price cents.
- [ ] Admin can activate and deactivate rooms.
- [ ] Updated rooms appear on `/stay` and `/book`.
- [ ] Deactivated rooms disappear from public room lists and booking select.
- [ ] Duplicate or invalid slugs are handled safely.

### Room Images and Upload

- [ ] Manual image URL add still works.
- [ ] Single upload works.
- [ ] Bulk upload works.
- [ ] Uploaded images are optimized and saved as public URLs.
- [ ] Alt text, sort order, primary image, and focal position save correctly.
- [ ] Removing an image updates public room pages.
- [ ] Oversized or non-image uploads are rejected with a clear message.
- [ ] Room image guidance is visible and useful.

### Packages

- [ ] Admin can create a surf package.
- [ ] Admin can edit name, slug, short description, full description, price cents, duration, surf level, and inclusions.
- [ ] Admin can activate and deactivate packages.
- [ ] Active packages appear on homepage preview where expected.
- [ ] Active packages appear on `/surf/packages`.
- [ ] Detail pages work for active package slugs.
- [ ] Deactivated packages disappear from public lists.

### Gallery Upload

- [ ] Manual image URL add still works.
- [ ] Single upload works.
- [ ] Bulk upload works.
- [ ] Caption, alt text, category/tag, sort order, and active status save correctly.
- [ ] Uploaded images appear on `/gallery`.
- [ ] Gallery images can be used by homepage/about visual sections when tagged appropriately.
- [ ] Inactive gallery images are hidden publicly.
- [ ] Gallery image guidance is visible and useful.

### Blocked Dates

- [ ] Admin can choose a room and date range.
- [ ] Invalid date ranges are rejected.
- [ ] Blocks can be created and removed.
- [ ] Imported iCal blocks are distinguishable from manual blocks.
- [ ] Removing a manual block does not remove imported source metadata incorrectly.

### Bookings Filters

- [ ] Pending tab is default.
- [ ] Confirmed tab shows only confirmed bookings.
- [ ] Cancelled tab shows only cancelled bookings.
- [ ] All tab shows all relevant bookings.
- [ ] Status actions remain available and functional in each filter.
- [ ] Long booking lists remain usable on mobile.

## Production

### Environment Variables

- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set server-side only.
- [ ] `NEXT_PUBLIC_SITE_URL` points to the production domain.
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set or intentionally blank.
- [ ] `ENABLE_DEPOSITS=false` for manual confirmation mode.
- [ ] `RESEND_API_KEY` is set.
- [ ] `BOOKING_EMAIL_FROM` uses a verified sending domain.
- [ ] `BOOKING_NOTIFICATION_EMAIL` points to the correct internal inbox.
- [ ] `ADMIN_PASSWORD` is set to a strong temporary password.
- [ ] `ADMIN_SESSION_SECRET` is a long random secret.
- [ ] Stripe env vars are present only if deposit checkout may be re-enabled.

### Supabase Migrations

- [ ] All migrations have been applied in order.
- [ ] Tables exist: `rooms`, `bookings`, `blocked_dates`, `booking_holds`, `settings`, packages, room images, and gallery images.
- [ ] RLS is enabled where expected.
- [ ] Public room reads expose only active rooms.
- [ ] Guest booking data is not publicly readable.
- [ ] Exclusion constraints prevent overlapping active bookings and holds.
- [ ] Seed rooms exist or real production rooms have been created.
- [ ] Supabase Storage bucket/policies support the image upload workflow.

### Resend Email

- [ ] Sending domain is verified.
- [ ] `BOOKING_EMAIL_FROM` matches the verified domain.
- [ ] Internal booking notification arrives.
- [ ] Guest pending-confirmation email arrives.
- [ ] Email content includes booking id, room, dates, guest info, and pending-confirmation wording.
- [ ] Email failures are logged safely and do not expose secrets.

### Sitemap and Robots

- [ ] `/sitemap.xml` loads on production.
- [ ] `/robots.txt` loads on production.
- [ ] Production domain in metadata and sitemap is correct.
- [ ] Public pages have sensible titles and descriptions.
- [ ] Admin and API routes are not promoted for indexing.

### GA4

- [ ] GA4 loads only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.
- [ ] Booking CTA clicks are tracked.
- [ ] Availability checks are tracked.
- [ ] Hold creation is tracked.
- [ ] Pending booking creation is tracked.
- [ ] Stripe checkout start and payment success return tracking remain dormant unless deposits are enabled.
- [ ] No personal guest data is sent to GA4 events.

### Mobile QA

- [ ] Test homepage, booking, stay, packages, gallery, about, FAQ, and French pages on a narrow mobile viewport.
- [ ] Sticky booking bar does not cover important controls.
- [ ] Tap targets are comfortable.
- [ ] Forms do not jump or zoom awkwardly.
- [ ] Lightbox/gallery controls work by touch.
- [ ] Admin pages remain usable on mobile for emergency edits.

### Safari and Chrome Testing

- [ ] Chrome desktop booking flow passes from availability to pending request.
- [ ] Safari desktop booking flow passes from availability to pending request.
- [ ] Chrome mobile responsive pass is clean.
- [ ] Safari iOS responsive pass is clean.
- [ ] Date inputs behave acceptably in Safari.
- [ ] Image uploads work in Chrome.
- [ ] Image uploads work in Safari.
- [ ] Admin login/session behavior works in both browsers.
