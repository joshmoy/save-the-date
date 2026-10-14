# Implementation status

Updated 2026-10-14. MVP release acceptance remains incomplete. The goal is active; external approval does not prevent the remaining local engineering work.

## Latest verified state

142 full PostgreSQL/API/domain/adapter tests pass with zero skips. Build, lint and all nine workspace type checks pass. No public deployment, real guest messages or paid AI usage was authorised or performed. Original wedding data and unrelated changes are preserved.

Implemented connected flows include identity/workspaces/memberships/events, canonical website and blog publication, two website themes, four invitation families with actual immutable JPEG/PDF exports, households/private RSVPs/capacity, authoritative journalled admission, private media/guest uploads/moderation, manual and configurable AI concepts/boards/approved briefs, Raven Relay delivery states, owner archives/retention/deletion, and operator/support/metrics. Their individual evidence and remaining acceptance limits are in requirements-traceability.md and verification/.

Recent commits: encrypted read-only legacy operational snapshots (`e82d1b9`); restartable private legacy blog/album imports (`3e28953`); declared pilot load (`37b683d`); workspace keyboard bypass (`115202f`); legacy archive preservation (`a56167b`); malformed-reference handling (`b296ba0`); public/private guest keyboard journeys (`01567ab`). Derived website surfaces now preserve text contrast without changing chosen palette colours.

## Current verification evidence

- Declared local pilot: 100 published weddings, 500 events, 100,000 attendees;300 successful public reads across three 100-request bursts concurrent with 20 unique admissions. Admission server p95 397.10 ms; eight actual JPEG/PDF bundles p95 1.70 s at worker concurrency 1. Rate limits remain unchanged. See verification/performance/pilot-profile.json.
- Actual Chrome: 105-record collection navigation, desktop/360px layouts, keyboard focus/skip links/current-view labels, real household plus-one submission and distinct upload-session empty state. Two attendees confirmed for one event while the second stayed unanswered. The corrected website surface measured 4.5422:1 for normal text. These are scoped checks, not full WCAG conformance.
- Recovery: 69 tables, 19 objects and 40 fonts restored from authenticated encrypted replica, with erasure/admission replay and migrations 023→025. Failure-independent production RPO/RTO is not proved by the local drill.
- Portable runtime: real Linux ARM64 PNG/HEIC/video processing, all-template JPEG/PDF/QR output and capture-only compose journeys pass. Runtime findings improved from 18 critical/489 high to 1 critical/219 high; full findings, including libxml2 CVE-2026-6653, remain recorded. No complete production security claim follows.
- Legacy preparation: all ten original migrations rehearsed in a disposable database; encrypted users/pass/scan/settings snapshot retains admission/revocation facts, counts/checksums and redacted exceptions. Content imports are private/restartable; actual archives preserve validated dates/references and explicitly omit unknown credential metadata. No operational cutover or external asset processing is implied.

## Next concrete work

Explicit operational mapping and its encrypted-file CLI now pass read-only target/identity/lineage checks. Next implement/rehearse verified legacy writer fencing and historical transfer, then finish the primary-flow accessibility/browser audit. Complete actual mobile LCP measurement on a declared profile when supported browser controls are usable. A native Lighthouse attempt stopped before any audit/storage clearing when the native window became unavailable; API timing is not a substitute. Audit each mandatory requirement against current code/evidence before declaring completion.

## External release gates

Owner-reviewed copy, human usability/planner acceptance, physical camera/two-phone QR checks, authorised live provider smoke, production failure-independent recovery/failover and deployment review remain unverified. Do not deploy, send real mail or incur paid AI usage without explicit authorisation.

## Safe resume

Root `.env` loads automatically; platform `DB_CONNECTION` remains distinct from legacy `DATABASE_URL`. Run `pnpm db:migrate`, then `pnpm dev:web`, `pnpm dev:api` and `pnpm dev:worker` with capture/disabled optional providers for local work. Do not start a worker against real configured delivery/AI providers during unauthorised verification.

Full checks: `pnpm build`, `pnpm lint`, `pnpm typecheck`, and `TEST_HEIC_FIXTURE=/tmp/std-phone-verification.heic TEST_INVITATION_BROWSER_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" pnpm test:full`. The runner uses fresh disposable databases and preserves failed targets. `node scripts/verify-pilot-profile.mjs` runs the larger isolated load profile with the browser path configured.

Browser fixture checkpoint: `/tmp/std-navigation-checkpoint.json`; its private connection/grants stay outside the checkout. Start only this isolated target with `node --import tsx scripts/start-navigation-browser.ts /tmp/std-navigation-checkpoint.json`. Native root worker remains stopped; revalidate all process handles before resuming. See runbooks/local-setup.md, deployment.md, migrations-recovery.md and event-day-admission.md.
