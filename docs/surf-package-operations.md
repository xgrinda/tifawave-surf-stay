# Surf package catalogue and publication

The existing Packages admin is the source for bilingual offers, room variants, whole-package pricing, seasons, levels, inclusions/exclusions and optional extras. Existing package photographs and activity controls remain available. No production changes are authorized by this document.

## Four proposed drafts

- Surf & Stay Week: 7 nights; proposed 5 coached surf days, accommodation, surf equipment and surf transport.
- Short Surf Escape: 3 nights; proposed 2 surf lessons, accommodation, equipment and transport.
- Surf & Yoga Retreat: 7 nights; proposed 5 surf lessons, 3 yoga sessions and accommodation.
- Surf Guiding Week: 7 nights; proposed 5 guided surf days and accommodation.

Breakfast with accommodation is the only confirmed package food inclusion. Proposed activities/providers/transport/equipment are stored as draft notes, not public promises. The four records start Draft, all prices are blank/personal quote, levels are intentionally unset, and no media or supplier affiliation is invented. Original starter packages stay hidden. The first three drafts are marked homepage-featured; Guiding is catalogue-only when published.

## Edit and publish

Open Packages → the relevant draft. Edit English/French titles, summaries, descriptions, confirmed inclusions and exclusions (matching translations), nights and appropriate levels. Keep unverified specifications in the two proposed-note fields while verifying. Those fields must be cleared before publication; move only verified services into bilingual confirmed copy.

Each room variant uses a real active room listing and a stable option code. A variant is a preference, never a booking allocation. Keep a code stable across edits. Remove obsolete variants rather than redefining them to mean another room. Add extras with bilingual names and a whole-stay price/basis or leave the price blank for a quote. Use real property photography in the retained media/photo controls. The bilingual main description and inclusions describe the public programme; auxiliary legacy activity notes remain in the admin.

Prices are integer minor units in the database and major units in the editor. Blank means a personal quote; zero is an explicitly entered zero-price offer. Choose a currency and whole-package basis: per person or per party. Rates are never inferred by multiplying room-night prices. Seasonal overrides use arrival date for the entire package: start inclusive, end exclusive. A blank seasonal override explicitly requires a quote; it does not fall back to the base price. Seasons cannot overlap for the same variant; an all-variant season conflicts with any intersecting variant season. Extras have their own per-person/per-party basis.

The Owner must verify coaching/guiding providers, lesson counts/durations/levels, equipment, surf transport, yoga arrangements, accommodation, extras, price/basis, actual seasonal dates, terms and both translations, then check the Owner-review box and choose Published. Content Editors can edit drafts; only the active MFA Owner may publish or edit/withdraw a published offer. Stale edits are rejected using the package version. Archived/Draft packages and unverified details never appear in the public selector, catalogue or details routes. At most three published featured packages appear on the homepage; Guiding remains in the full catalogue unless explicitly featured later.

## Request and manual decision

Published package pages carry the exact package ID and optional variant into Book → Surf package. Guests select dates, guests, real room variant, an offered surf level and extras. Choosing arrival sets departure to the package length. Every request stays Pending without an inventory hold or online payment. Both OTAs and separately managed reservations still require manual checking before Owner approval and valid actual allocation.

The database locks the selected catalogue row, validates duration/variant/level/extras, and saves a versioned immutable snapshot of the package, room preference, included/excluded services, arrival-season base, extras and indicative party total. Unknown prices keep the total as a personal quote. Client names/prices/amounts/status/inventory are not trusted. Snapshots appear on the reservation detail and both notification emails; later edits/withdrawal do not rewrite history. The Owner's final quote stays separate. Repeating the same submission key returns the same request and email jobs even if the catalogue has since changed.

After a manual date change, the saved package snapshot still describes the original enquiry. Review any revised programme/price with the guest and record the Owner's quote and note. No payment event can confirm a stay.

## Before any package publication

1. Confirm the exact providers, schedule/counts, qualifications/levels, equipment and transport scope; yoga/guiding must actually be arranged.
2. Confirm room variants, occupancy/pricing basis, currency, seasonal dates, extras and actual prices, or deliberately use a personal quote.
3. Confirm inclusions/exclusions, guest terms and accurate EN/FR descriptions; clear proposed notes and approve only verified content.
4. Add genuine approved photographs. Review both language pages and the preselected Pending request journey.

Production release still requires the existing encrypted backup/isolated restore, approved clean-start ordering, hosting/security approvals, production configuration and final cutover approval. This catalogue adds one non-destructive reviewed migration and an updated scheduled-email template; it does not authorize deployment or reset.
