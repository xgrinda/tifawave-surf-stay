# Tifawave daily operations

Use the protected development Preview for review. It contains an isolated staging database. Sign in at `/admin/login` with `admin@tifawave.com`, your existing staging password and your authenticator. Production accounts and configuration are provisioned separately during an approved release.

## Each morning

1. Open **Operations desk**. Review arrivals, departures, pending requests, upcoming stays and email health. Counts come from recorded reservations; they do not claim live Booking.com or Airbnb availability.
2. Check **Room & bed calendar**. Day, week and month controls, date navigation and linked stays use the same allocation ledger. Arrival occupies a unit; departure releases it for same-day turnover. Scroll horizontally on small screens.
3. Check **Housekeeping** and **Tasks & follow-ups**. Record actual readiness, maintenance and assigned work. Initial readiness is “unknown” until staff inspect it.
4. Read **Notifications**, handle new enquiries and check follow-up dates. Search the workspace or use each list’s filters and pagination.

## Review a reservation

1. Open a pending request. Read dates, guest count, room preference, contact details and guest message. Pending requests do not hold rooms.
2. Personally check Booking.com and Airbnb for the same dates. Review existing direct allocations and maintenance blocks.
3. Select the actual room or individual dorm beds. A family suite is one indivisible four-person unit. A four-person dorm stay needs four available bed units. Groups need sufficient real units for their whole party.
4. Record any agreed total under **Quote & stay progress**, using a currency such as EUR. It is an Owner-entered estimate, not a payment or automatically calculated invoice.
5. Tick both manual OTA checks, add an internal decision note and confirm. The database rechecks permissions, versions, active inventory, capacity and conflicts atomically. A failed change leaves the original reservation intact.
6. Confirm that the saved status and calendar assignments are correct. Check email status. “Sent” means accepted by the provider; the provider’s Delivered event verifies delivery.

Only the active MFA-verified Owner can confirm or decline. Reception prepares requests and operational notes. No payment, Stripe event or guest form can approve a stay.

For OTA reservations, telephone requests and walk-ins, use **Add reservation request**, choose the real source/reference and enter the actual details. These entries also start pending and require Owner allocation/approval. Do not fabricate missing email addresses; use the original communication channel.

For a date/room change, open the existing reservation, choose the new dates/units and repeat the manual checks. Failed reassignment preserves the old allocation. Use **Cancel** for a previously accepted stay; use **Decline** for a request you cannot accept. Keep the reason internal. Check-in/out progress records operations separately from reservation approval.

## Property and prices

**Rooms & inventory** manages the nine physical rooms and twelve bookable units. Confirm the logical labels against actual doors/beds before production use. Two doubles are standard, two have balconies, two rooms are twins, one is triple, one is the family suite and one is the four-bed dorm. Deactivation cannot invalidate an existing future allocation.

Room-listing management is linked from inventory. Approved base rates are €15 per individual dorm bed/person/night; €35 per standard double or twin room/night; €45 per balcony double or triple room/night; €55 per family suite/night. Breakfast is included. Enter normal currency amounts in forms, such as `35.00`, rather than cents.

**Seasonal pricing** records date ranges per unit and currency and refuses overlaps. Rates support quoting; changing a rate never silently changes a saved reservation quote. Review the final amount with the guest before approval.

**Inventory blocks** records genuine maintenance/unavailability against actual units. Release a block when it no longer applies. Never connect staging calendar export URLs to real OTA accounts. Existing legacy stays and old calendar consumers require explicit reconciliation at release.

## Guests, groups and relationships

**Guests** links profiles to reservation history while preserving historical booking contact snapshots. Keep internal notes factual and necessary. Housekeeping and Content Editors cannot read guest contacts.

**Groups & retreats** stores organizers, dates, size, custom offers, stages and follow-ups. Save the enquiry before creating its linked pending reservation. The Owner then allocates and approves that reservation separately. A group cannot be marked won without sufficient confirmed inventory. Cancelling/changing the linked stay can reopen the enquiry for review.

**Partners & sponsors** tracks real agencies, surf schools, brands and creators. Website submissions appear as new enquiries. A received enquiry does not establish a partnership or reserve rooms. Use notes, stages, follow-up dates and linked tasks to manage the next conversation.

## Website, packages and media

**Website content** has separate English/French page, room, package and email documents. Save a draft, use its private preview, then publish verified content. Later draft edits leave the published version intact. Restoring a revision restores a draft; publication remains an explicit action. Email additions cannot remove the fixed manual-approval wording.

**Surf packages** manages actual offers, activities and photographs. The three historical starter offers remain inactive. Do not publish them until their prices and inclusions have been replaced with genuine Owner-approved offers. Inactive offers are absent from public pages and package booking choices.

**Media library** accepts real property images and MP4/WebM video up to 20 MB. Images are resized, optimized to WebP and stripped of metadata. Video uploads store an asset without publishing it. Copy its URL into the home document together with a static image fallback; use a short compressed clip without audio. The public player supports pause, reduced motion and a manual mobile start. Use descriptive alt text and obtain permission for identifiable guests.

**Reviews** accepts only genuine reviews with their real source, rating, date and text. New manual reviews start unpublished. Official Google review sync remains optional until the required authorized account configuration exists. Empty review sections stay hidden.

## Staff, reports and settings

| Role           | Main access                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Owner with MFA | All modules, reservation decisions, exports, staff, settings and controlled email retries                                              |
| Reception      | Operational reservations, guests, enquiries, calendar, blocks, room readiness and tasks; no confirmation/decline or management exports |
| Housekeeping   | Room readiness and permitted assigned/unassigned room cleaning/maintenance tasks; no guest contact records                             |
| Content Editor | Website, catalogue and media; no guest operations, staff access or management settings                                                 |

Invite staff through **Staff access**. Invitations and recovery use the configured Auth SMTP sender. If an invitation was sent but assigning access failed, use **Assign an invited identity** rather than sending another invitation. Owner promotion requires an enrolled verified factor; the last verified Owner cannot be removed. Disabling staff and signing out revoke existing sensitive access. Keep passwords, QR secrets and authenticator codes out of chat.

**Reports & exports** separates private-room nights from individual-bed nights and separates currencies. Expected quoted totals are not paid revenue. CSV exports require the Owner and are audited. **Settings** controls business details, breakfast, booking rules and retention review. Retention review counts records; it does not automatically delete guest history. Choose actual retention and guest policies before release.

## When something fails

- A conflict or stale-record message: reload, review current data and try again only after checking the other change. Do not bypass inventory guards.
- Failed email: inspect delivery health and the provider log. Automatic retries use backoff and stable duplicate-prevention keys. A job requiring provider review stops rather than risking a duplicate; ordinary retry controls cannot override that safety stop.
- Lost authenticator: use the authorized Supabase account-administration recovery process. Password recovery alone does not bypass existing Owner MFA. Do not share recovery secrets.
- Incident/cutover: follow the release runbook. `TIFAWAVE_PUBLIC_INTAKE_DISABLED=true` with a new deployment pauses both public submission APIs while preserving pages and existing records. Staff should stop operational writes during the incident. Do not promote the historical Stripe-era application as a rollback.
