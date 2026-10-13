# Implementation status

Updated 2026-10-13. MVP is incomplete; no external credential blocks the next engineering milestone.

## Verified and committed
R0 identity, tenancy, memberships, events, canonical website publication and recovery foundation. Raven Relay durable delivery adapter/callback. Harbour marketing landing page and workspace redesign. Staff private media processing, quotas, moderation and albums. Four invitation families with real immutable JPEG/PDF exports. Households, CSV, private guest credentials and transactional RSVP capacity.

## Latest verified milestone
R3 recovery: 69 PostgreSQL tables, 19 objects and 40 fonts restored from an authenticated encrypted replica, with terminal/individual erasure and post-backup admission replay. Committed 2c67207. Credential Base32 compatibility committed 457a90f; API/media contracts 88f4826; older invitation/planning/photo navigation 95f2aae.

Current verified feature: explicit asynchronous job IDs and protected state, immediate embedded-photo export permission/deletion checks, scoped expiry verification and local release load evidence. **124 full tests pass without skips; build, lint and all workspace type checks pass.** Actual twenty-concurrent HTTP admission p95 is 378.28 ms; eight real JPEG/PDF bundles p95 is 1,089.64 ms on the recorded local profile. Registry production audit reports zero known vulnerabilities. Existing secrets and wedding data remain preserved.

## Current work and next action
Async/status/security committed 0697d4c. Restored ownership review and older-schema expansion are implemented and verified with 119 full tests and a complete encrypted replica drill. Ownership recovery is committed as f0cef1d. Public album/media/journal cursor navigation committed666a7ef; staff draft navigation committed098519c; web response policy committed22b44e4, trusted attribution b166652, upload history786c92c and pass/eligible history committed05d9689 and wedding-wide guest/search/request pagination verified; commit guest pagination, refresh portable startup/recovery rehearsals, then finish remaining staff-list pagination, security/browser/accessibility release gates. No credential blocks that engineering work. No public deployment, real guest messages or paid AI use is authorised.

## Remaining mandatory scope
API documentation/pagination; production failure-domain recovery validation; R3 security/load/accessibility/browser/device and human pilot gates.

## External checks
Live Raven delivery/callback, optional AI provider smoke checks and production storage need configured credentials and explicit authorisation for real/paid traffic. Physical camera and two-phone QR checks need devices. These do not prevent continued local implementation.

Protocol checkpoint: schema-derived 120-path OpenAPI, redacted correlated HTTP logs/gateway headers, stable malformed-body errors and scoped media cursor pages. Wider pagination and browser acceptance remain open; see runbooks/api-contract.md and verification/api/report.md.

Load checkpoint: twenty real concurrent journalled HTTP admissions p95 378.28 ms; eight actual JPEG/PDF bundles p95 1,089.64 ms excluding queue wait. Registry production dependency audit reports zero known vulnerabilities. Mobile throttled LCP, container package audit and production-scale/device/browser checks remain open.
