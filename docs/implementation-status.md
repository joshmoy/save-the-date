# Implementation status

Updated 2026-10-13. MVP is incomplete; no external credential blocks the next engineering milestone.

## Verified and committed
R0 identity, tenancy, memberships, events, canonical website publication and recovery foundation. Raven Relay durable delivery adapter/callback. Harbour marketing landing page and workspace redesign. Staff private media processing, quotas, moderation and albums. Four invitation families with real immutable JPEG/PDF exports. Households, CSV, private guest credentials and transactional RSVP capacity.

## Latest verified milestone
Notification controls committed 9fbd1e0 and rolling credential keys committed 3feabc3. Portability now has actual filesystem/S3 conformance, native Linux PNG/HEIC/video, all-template Linux-worker/dedicated-browser JPEG/PDF/QR checks, and complete isolated web/API/worker/PostgreSQL/ClamAV startup. Capture verification, tenant publication, queued real files and private downloads passed. Full regression: 106 passing without skips; build/type/lint passed. Existing secrets and wedding data are preserved.

## Current work and next action
Encrypted PostgreSQL/object/font backup and recovery implementation verified: 69 tables, 19 objects, 40 fonts; erasure of accounts/workspaces/media/generated copies and post-backup single-use admission replay passed. Seven focused recovery tests and 113 full tests pass without skips; build/type/lint passed. Recovery committed 2c67207. Manual-code Base32 compliance verified with backward-compatible old hashes; 114 full tests pass, build/type/lint clean. OpenAPI/request correlation and media cursor navigation now implemented: 117 full tests pass, plus focused malformed-JSON checks and actual media first-page browser evidence. Next: older invitation/planning histories, remaining growing lists, explicit async job IDs, R3 security/load and browser/accessibility gates. No deployment or external messages/paid AI authorised.

## Remaining mandatory scope
API documentation/pagination; production failure-domain recovery validation; R3 security/load/accessibility/browser/device and human pilot gates.

## External checks
Live Raven delivery/callback, optional AI provider smoke checks and production storage need configured credentials and explicit authorisation for real/paid traffic. Physical camera and two-phone QR checks need devices. These do not prevent continued local implementation.

Protocol checkpoint: schema-derived 119-path OpenAPI, redacted correlated HTTP logs/gateway headers, stable malformed-body errors and scoped media cursor pages. Full wider pagination and async-response gate remains open; see runbooks/api-contract.md and verification/api/report.md.
