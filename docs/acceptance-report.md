# Tifawave — final staging acceptance and handover

**3 November 2026 · Original website upgrade · Milestones A–D**

**Staging acceptance passed. Production release remains subject to the gates below and the Owner's explicit approval.** The working site is the original repository, extended in place; no Astro/Cloudflare replacement was used.

## Working Preview and Owner review

- [Protected website Preview](https://tifawave-surf-stay-2etd6ormn-xgrinda4-6082s-projects.vercel.app/)
- [Owner workspace](https://tifawave-surf-stay-2etd6ormn-xgrinda4-6082s-projects.vercel.app/admin)
- Owner: **admin@tifawave.com**, using the staging password you created and your authenticator. Sign in to the owning Vercel account first if Deployment Protection asks. Production credentials are separate.
- This Preview contains an isolated staging database. Its empty reservation lists are intentional after QA cleanup. There are no fabricated bookings or performance metrics.
- For controlled staging booking/enquiry reviews, use **admin@tifawave.com** as the guest email: it is the sole permitted staging email recipient. Other addresses are not silently rewritten to that inbox. Do not connect staging calendar feeds to real Booking.com/Airbnb accounts.
- Disposable role-test accounts were removed. Your real staging Owner and verified authenticator were preserved.

Suggested review: check the English/French room pages on a phone; submit a controlled request; open Operations desk and the request; verify both OTA calendars manually; allocate a real staging room/bed and confirm; check the calendar and email health. The daily guide explains each module. Staging confirmation does not create an OTA reservation.

## Source, architecture and deployment evidence

| Item | Verified state |
| --- | --- |
| Original source | `xgrinda/tifawave-surf-stay`; development branch `dev/hostel-admin` |
| Application | Next.js 16 App Router, React 19, TypeScript, Tailwind, server actions and API routes; existing Supabase integrations retained and hardened |
| Data and authentication | Supabase PostgreSQL, RLS and database commands; invite-only Auth, staff roles, MFA for Owner access; Storage for property media |
| Email | Resend; transactional outbox, Supabase Edge Function and one-minute Supabase Cron |
| Hosting | Existing Vercel project `prj_4AoskGVvLSDRWOCwBqpIM80d5A0v`; protected Preview, indexing disabled |
| Staging project | `tifawave-staging`, ref `cjtrnnpqwkorxwqhtjeq`; independent from production |
| Preview application commit | `f4f0fe4ca346ee2a7a408d29db69fb75ab9c4016` |
| Ready Preview deployment | `dpl_FS3CrcbpsgeAXfkcozpvsfTLenUo`; subsequent handover changes affect documentation/tests only |
| Application CI | [Run 41565573748 — success](https://github.com/xgrinda/tifawave-surf-stay/actions/runs/41565573748) |
| Production branch unchanged | `main`: `e1c67e5eeb1da44660cb8187ca532cc9bb8a68e1` |
| Live domain unchanged | `tifawave.com` still points to original deployment `dpl_6AjdzLwKGgFy8jTwsntf319VitRY` |
| Production database | `tuzefzcosvvhzffbxhpm`; original sixteen migration versions, through `202605260002`. Read-only metadata/public catalogue checks only |

No production reservations, data, credentials, environment variables, domain, main-branch code, migrations or billing were changed. No production deployment occurred. The existing live website therefore still has its previous implementation/catalogue until an approved release.

## Completed functionality

| Area | Delivered behavior and verification |
| --- | --- |
| Manual booking — A | Public requests, staff entries and group conversions start pending. Active MFA Owner, both explicit manual OTA checks and sufficient conflict-free real units are required for approval. Concurrent confirmation, stale updates, direct table writes and unauthorized API calls were exercised. No payment or Stripe event can confirm a request. Historical payment fields remain for preservation only. |
| Email reliability — A | Stable job/provider idempotency keys, frozen message bodies, expiring leases, retry backoff, capped attempts and a safety stop for uncertain/old delivery outcomes. Scheduled dispatch works independently of a guest HTTP request. Owner can inspect failures without bypassing duplicate protection. |
| Operations workspace — B | Operations desk is the default; search, filters, pagination, personal notifications and a dedicated linked day/week/month room-and-bed calendar use recorded data. Phone layout includes menu controls and horizontally scrollable operational tables. |
| Reservations and guests — C | Pending requests, manual source/reference entry, decision notes, approved allocations, date/room changes, cancellation, quotes, stay progress, guest history and operational audit records. Quote changes never imply payment or approval. |
| Inventory — C | Nine physical rooms, twelve independent allocation units, total capacity 23; blocks, activation guards, room readiness and seasonal pricing with overlap checks. The family suite stays indivisible; each dorm bed is separate. |
| Housekeeping and follow-ups — C | Assigned tasks, due dates, status and room readiness, with Housekeeping restricted from guest contacts and reservation decisions. |
| Groups, partners and sponsors — C | Separate enquiry workflows, organizers, dates, stages, notes and follow-ups. Group conversion creates a linked pending request; a group cannot be marked won without valid Owner-confirmed inventory. A website enquiry does not claim an established partnership. |
| Catalogue and media — C/D | Editable rooms, packages, package activities/photos and property media. Role/type/size controls; image optimization to WebP and metadata removal; signed video upload. Twenty existing room photos and four gallery photos reused from the original property's public media. |
| Publishing — D | English/French content, private drafts, explicit publication, revision history, conflict detection and restore-to-draft. Working content forms and public rendering were tested. Unpublished content stays private. |
| Public website — D | English/French room catalogue and detail pages, Request-to-Book, groups/retreats, partners, collaboration, contact, gallery, information and policy pages. Approved EUR prices and breakfast inclusion; clear pending-request wording; no checkout. |
| Homepage video — D | Static authentic-image fallback, pause/play control, mobile manual start and reduced-motion behavior. Mobile controls were directly verified. You verified desktop initial “Pause video” and click-to-“Play video” after the browser controller stopped responding. The clearly labelled neutral QA clip was removed afterward; a real cinematic clip is still needed for publication. |
| Reviews and SEO — D | Genuine-review management with unpublished defaults; empty sections hidden. Optional authorized Google review sync remains unconfigured. Metadata, sitemap, robots, social image and unpublished-package exclusion checked. Preview stays protected/noindex. |
| Reports and management — D | Occupancy separates private rooms from dorm beds; quotes separate currencies and are not labelled paid revenue. Owner-only audited CSV export; settings/version guards and retention review without automatic guest deletion. |
| Staff and access — D | Owner, Reception, Housekeeping and Content Editor enforced in app/API/database layers. Invitation/recovery setup, HttpOnly sessions, disabling/signing out staff, audit actors and last verified Owner safeguards exercised. |

## Approved inventory and rates

Breakfast is included. These are nightly guide rates; a request remains pending until manual approval.

| Type | Physical rooms | Price and allocation basis |
| --- | ---: | --- |
| Standard double | 2 | €35 per whole room, up to two guests |
| Balcony double | 2 | €45 per whole room, up to two guests |
| Twin | 2 | €35 per whole room, up to two guests |
| Triple | 1 | €45 per whole room, up to three guests |
| Family suite | 1 | €55 per whole suite; one double and two singles, four guests |
| Dormitory | 1 | Four individual units, €15 per person/bed |

Total: **9 physical rooms, 12 allocation units, 23 guests**. Logical application room labels must be matched to actual doors/beds before release. The three historical starter surf packages remain unpublished, as requested.

## Acceptance results

All listed completed tests passed after fixes. Counts below describe separate suites, not a claim of exhaustive security or accessibility certification.

| Verification | Result |
| --- | --- |
| Automated unit/security/email/workspace cases | **24 passed** |
| Real PostgreSQL database cases | **57 passed**; fresh-install and upgrade migration paths checked |
| Local HTTP cases | **9 passed**; includes protected endpoints and public-intake pause |
| Final hosted core scenarios | **11 passed**, using real staff JWTs and protected Preview HTTP |
| Final hosted module scenarios | **10 passed**, including actual notification server-action forms and invite/recovery setup |
| Final public Preview smoke checks | **46 passed**; English/French pages, twelve room-detail paths, six inactive-package 404s, sitemap, robots and social image, plus content/auth assertions |
| Hosted media scenarios | **3 passed**; invalid role/type/size refusal, byte-identical video upload, actual Content Editor image form optimization/persistence |
| Lint and TypeScript | **Passed**, including the added notification test |
| Production build | **Passed** locally and on Vercel; final deployment Ready |
| Edge Function Deno check and CI | **Passed**, locked dependencies and PostgreSQL 17 CI |
| Production dependency security audit | **0 vulnerabilities** |
| Local restore and approved catalogue patch drills | **Passed** in disposable loopback databases; data, constraints, RLS, effective table grants and booking/allocation preservation checked |

**Booking and inventory evidence.** Five simultaneous same-room races each yielded exactly one winner. Overlapping confirmation failed atomically. A 23-person group required all twelve real units; invalid or insufficient inventory was rejected. Occupied dorm beds conflicted independently while other beds remained usable. A family suite could not be split. AAL1 Owner sessions, Reception, Editor, disabled staff, editable JWT metadata, payment-history writes and privileged direct calls could not bypass the approval command.

**Real browser journey.** A French mobile request produced a pending record without allocations. The Owner form rejected missing manual OTA checks, saved a €70 manual quote and then accepted a valid Twin 1 allocation. The stay appeared on the calendar; receipt, Owner alert and confirmation were accepted by the mail provider. The test reservation was removed afterward.

**Scheduled email evidence.** A separate enquiry was created without immediate HTTP dispatch. Cron delivered it in one attempt; Resend showed **Delivered**, message `01a19f1d-ebbd-7e14-b788-1f358e134aee`. Actual staging Owner Auth recovery also showed **Delivered**, message `01a19df6-20cc-7a5f-91fe-bc812503a9a0`. Retry/lease/failure/duplicate scenarios are covered by the automated database and email suites. Latest post-cleanup Cron runs completed with zero failures and zero queued messages.

**Permission evidence.** Real Owner, Reception, Housekeeping and Content Editor sessions were exercised, including unauthorized HTTP requests and raw Supabase APIs. Tests covered guest PII isolation, operational commands, catalogue edits, private CMS, reports/export, staff management, settings and per-user notification reads. Repeating notification actions created one read per actual user; forging another user's identity failed. Public signup remains disabled.

**Database isolation/security evidence.** Public application tables have RLS enabled; private scheduler config/run tables deny ordinary client access. Actual grants, policies, commands and revocation behavior were tested. A read-only production room request with a staging public key returned 401. Staging's independent project/configuration and project-ref guards prevent the acceptance harness from targeting production; no production mutation tests were run.

**Fixes verified.** Explicit application conflict responses now return actionable 409 errors instead of being repeatedly retried as serialization failures by the hosted API. Failed updates retain their previous data. Phone admin tables preserve readable column widths within horizontal scrolling. These fixes passed local and hosted regression checks.

## Cleanup and review limits

Final staging inspection found: one staff/Auth identity (your Owner), one verified Owner factor, zero bookings, zero guest profiles, zero enquiries, zero QA content documents and zero outbox jobs. All nine rooms are mapped; twelve units provide capacity 23. Six room listings are active; zero of the three starter packages are published. Twenty-four original property media objects remain. The temporary video, uploaded QA assets, QA accounts and test reservations/enquiries were removed. Exactly one active scheduler job remains enabled.

Temporary local server-key/test-credential/access files were removed after verification. No credentials are included in these deliverables or committed source.

Validation limits:

- Actual staff invitation/recovery token setup, session bootstrap, password change and old-password rejection were tested using disposable identities. SMTP recovery delivery to the controlled Owner inbox was verified. A fresh invitation email to a second staff inbox was not sent because staging permits only the existing Owner inbox; check that first authorized onboarding delivery during release preparation.
- Desktop video behavior was Owner-verified; mobile playback controls were tool-verified. The QA clip is not property content and is no longer published or stored.
- Public smoke timings are individual checks, not a formal performance benchmark. No Lighthouse score, exhaustive WCAG certification or penetration-test certification is claimed.
- The successful restore drill used representative disposable data. It is not a real production backup or a measured production recovery commitment.

## Findings and remaining release requirements

No unresolved critical functional/security failure was found in the tested staging flows. **This does not remove the following production gates.**

| Severity / type | Remaining item |
| --- | --- |
| **Release blocker** | Existing Vercel team is **Hobby**. Vercel restricts that plan to personal/non-commercial use. Approve a business-eligible plan before the hostel release. No upgrade or charge was made. [Official plan guidance](https://vercel.com/docs/plans/hobby) |
| **Release gate** | Approve the exact release commit/window, a fresh encrypted real database/migration-history backup, separate Storage file backup, and isolated restoration rehearsal. Staging is Free; do not assume managed daily backups. |
| **Release gate** | Reconcile real future legacy bookings, physical labels, maintenance blocks and OTA calendar consumers before direct allocation. No legacy confirmed stay has been silently mapped to inventory. |
| **Release gate** | Apply the twelve reviewed new migrations and separately guarded catalogue patch only after approval. Provision production Owner/MFA, invite-only Auth/SMTP, exact redirects, production secrets/notification inbox, Edge Function and one disabled-then-verified Cron. Never copy staging credentials or Auth users. |
| **Release gate** | Use the tested intake-pause switch for cutover, verify the real configuration before resuming intake and obtain final deployment/domain approval. Retain a compatible manual-booking recovery plan; the old Stripe-era application is not a safe rollback. |
| **Owner content** | Supply genuine package prices/inclusions, cinematic property video, guest/retention policies, verified amenities/contact details and authorized review sources where publication is desired. Until then, starter packages stay inactive and authentic photo fallback/custom enquiries work. |
| **Low — development tooling** | Full npm audit reports sixteen moderate package notices from one minimatch advisory in lint tooling, **not runtime dependencies**. Track a compatible upstream fix. npm's proposed obsolete major ESLint/config downgrade was not applied. [Advisory GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) |
| **Optional configuration** | Authorized Google review integration and paid Supabase leaked-password protection remain disabled/unpurchased. Existing twelve-character password policy, invite-only access and Owner MFA are in place. Choose an explicit backup schedule/retention policy. |

The release runbook contains migration order, backup scope, production setup, cutover checks and incident recovery. The guarded catalogue SQL is a review artifact; it has only been executed in disposable local release drills. **No further milestone or production work is authorized by this handover.**
