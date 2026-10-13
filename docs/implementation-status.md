# Implementation status

Updated 2026-10-13. MVP is incomplete; no external credential blocks the next engineering milestone.

## Verified and committed
R0 identity, tenancy, memberships, events, canonical website publication and recovery foundation. Raven Relay durable delivery adapter/callback. Harbour marketing landing page and workspace redesign. Staff private media processing, quotas, moderation and albums. Four invitation families with real immutable JPEG/PDF exports. Households, CSV, private guest credentials and transactional RSVP capacity.

## Latest verified milestone
Notification controls committed 9fbd1e0 and rolling credential keys committed 3feabc3. Portability now has actual filesystem/S3 conformance, native Linux PNG/HEIC/video, all-template Linux-worker/dedicated-browser JPEG/PDF/QR checks, and complete isolated web/API/worker/PostgreSQL/ClamAV startup. Capture verification, tenant publication, queued real files and private downloads passed. Full regression: 106 passing without skips; build/type/lint passed. Existing secrets and wedding data are preserved.

## Current work and next action
Operator slice committed 6d78101. Notification slice committed 9fbd1e0. Rolling credential hashing has six focused tests and 105 full tests passing; build/type/lint pass. Existing secrets remain unchanged. Rotation committed 3feabc3. Real filesystem/S3 conformance passed, including 70 MiB streaming, pagination and restore copies. Linux PNG/HEIC/video passed; Docker Desktop denies sandbox namespaces. Linux-worker/dedicated-browser rehearsal passed all seven checks, including all four JPEG/PDF families; real files were inspected. Complete isolated compose startup and API-owned publication/worker JPEG/PDF/private-download rehearsal passed. Portability regression passed (106 tests), ready for feature commit. Next: complete PostgreSQL/object/deletion/admission recovery, container startup and security/load/browser release gates.

## Remaining mandatory scope
API documentation/pagination; complete container startup and encrypted backup/restore rehearsals; R3 security/load/accessibility/browser/device and human pilot gates.

## External checks
Live Raven delivery/callback, optional AI provider smoke checks and production storage need configured credentials and explicit authorisation for real/paid traffic. Physical camera and two-phone QR checks need devices. These do not prevent continued local implementation.
