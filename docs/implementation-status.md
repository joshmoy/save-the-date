# Implementation status

Updated 2026-10-12. MVP is incomplete; no external credential blocks the next engineering milestone.

## Verified and committed
R0 identity, tenancy, memberships, events, canonical website publication and recovery foundation. Raven Relay durable delivery adapter/callback. Harbour marketing landing page and workspace redesign. Staff private media processing, quotas, moderation and albums. Four invitation families with real immutable JPEG/PDF exports. Households, CSV, private guest credentials and transactional RSVP capacity.

## Latest verified milestone
Retention/archive/erasure is committed as f143f2d. Operator support, temporary audited access, renewal/recovery and pseudonymous metrics have eight PostgreSQL/API tests; retention has ten including recovered-backup credential replay. Full suite: 93 passing without skips. Actual support browser submission and responsive read-only operator component review passed. Privileged founder browser acceptance needs an authorised operator account; no grant was made after automatic review rejected expanding the existing browser account's privileges.

## Current work and next action
Operator slice committed 6d78101. Notification history/retry and stale credential delivery prevention have 98 full passing tests plus final focused hardening checks. Raw callback parsing is now byte-first. Next: credential key rotation, portable Linux/S3 and complete backup/restore/security/load/browser release gates.

## Remaining mandatory scope
Final notification feature commit; key rotation and API documentation/pagination; portable Linux worker/storage and expanded backup/restore rehearsals; R3 security/load/accessibility/browser/device and human pilot gates.

## External checks
Live Raven delivery/callback, optional AI provider smoke checks and production storage need configured credentials and explicit authorisation for real/paid traffic. Physical camera and two-phone QR checks need devices. These do not prevent continued local implementation.
