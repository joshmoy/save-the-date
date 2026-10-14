# Implementation status

Updated 2026-10-14. Goal blocked on external acceptance/access; R3 acceptance remains incomplete. Preserve the full 42-requirement scope.

## Current verified source

Connected implementations cover identity/workspaces/memberships/events; stable published websites/blog; two website themes/four card families; real queued immutable JPEG/PDF; guests/private RSVP/capacity; authoritative admission; private processed/moderated media; manual/configurable AI concepts/approved handoff; Raven Relay delivery states; archives/retention/erasure; operator/support/metrics. See requirements-traceability.md for scoped evidence.

Final local checks on a154a30: 155 tests pass, zero skips; build9/9, typecheck9/9 and lint pass. Test databases/files removed. Build must finish before typecheck because Next regenerates its types. See verification/final-local-checks.md. No real guest email, paid AI use, public deployment or original wedding data mutation occurred.

Recent corrections: recovery-safe optional-answer expiry/erasure; controlled legacy historical handover; published/draft blog path separation (migration028); hidden-section anchors and registry-only gifting; versioned bundled invitation fonts/renderer3 numeric-name quoting and line metrics; delivery refresh announcements and correct dated-service guidance. Each feature has a commit and decision record.

## Relevant evidence

- Actual Chrome desktop/mobile and keyboard journeys across core workflows; latest corrected invitation preview, delivery feedback and website sections captured. Scoped checks do not establish full WCAG conformance or other browser/device acceptance.
- 155-test regression includes tenant/role, concurrent capacity/scan, revocation/retry, publication, media, AI failure/schema and notification invariants.
- Declared 100-wedding/500-event/100k-attendee pilot: admission p95 397.10ms; eight card bundles p95 1.70s at concurrency 1. Mobile LCP remains unmeasured.
- Complete encrypted recovery: 70 tables,19 objects,48 font/style/license assets; independent erasure/admission replay and held legacy history. New focused pre-028 encrypted restore proves canonical article preservation and draft-path404 after expansion.
- Filesystem/S3 conformance and prior separate-process compose passed. Current renderer3 Linux worker/current-code mounts passed all four families, photo/no-photo, QR/geometry/embedded fonts; dedicated sandboxed browser reused. This is separate from a fresh image build.
- Runtime security review records 1 critical/219 high findings (including unresolved libxml2 finding), reduced from 18/489. No complete production security claim.

## Next concrete action

Fresh current-source portable images and connected capture-only Compose smoke now pass, including migration028, actual worker JPEG/PDF and protected downloads. Actual container marketing/couple pages pass the scoped mobile layout check. See verification/final-portable/report.md.

Remaining release work needs human/device/authorised external or unavailable browser-tool evidence: full browser/assistive-technology review, declared mobile-LCP profile, copy/usability/planner assessments, physical QR/camera checks, live providers, authenticated operator browser access and production recovery/deployment review. Follow verification/release-gates.md. Do not repeat successful exports/full regression absent a relevant source change or failure.

## External acceptance

Owner copy review, independent mobile usability, three-of-five planner assessment, physical two-phone QR/camera checks, authorised live provider smoke, authenticated operator browser access, production independent-failure-domain recovery and deployment review remain unverified. Previous automatic review rejected expanding the browser account's operator privileges; no grant was made. Production promotion, real mail and paid AI require explicit authorisation.

## Safe resume and commands

Root .env loads automatically. DB_CONNECTION is platform PostgreSQL; DATABASE_URL is legacy and never a fallback. Use a new local database, capture email and disabled optional AI services.

Setup: pnpm install --frozen-lockfile; copy/edit .env.example as .env; pnpm db:migrate; pnpm build. Start separate terminals: pnpm dev:api, pnpm dev:worker, pnpm dev:web. Open /platform; / is marketing, /w/[slug] is the current published couple site.

Focused checks: pnpm test --file=publication.test.ts (repeat --file; optional --name). Final commands and licensed fixture/tool prerequisites are in verification/final-local-checks.md and runbooks/local-setup.md.

Browser fixture: /tmp/std-navigation-checkpoint.json; private credentials remain outside Git. Owned synthetic server, verification Compose services and dedicated headless renderer9223 are now stopped; volumes/database/files preserved. The user's main application and personal Chrome profile were not stopped. Restart only when a relevant check requires it: node --import tsx scripts/start-navigation-browser.ts /tmp/std-navigation-checkpoint.json; pnpm exec tsx scripts/render-browser.ts for the separate empty-profile renderer. Its temporary Docker WebSocket endpoint must be regenerated after a restart. Do not start a root worker against live configured providers.

Blocked audit: the same external acceptance/access requirements remain after the final local verification turn, verification-service cleanup turn and subsequent checkpoint revalidation. No new local defect or safe independent required action was identified. Resume when human/device/provider/production evidence or the necessary authorised access is available; preserve the full objective and155-test checkpoint.
