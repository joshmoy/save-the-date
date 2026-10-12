# Implementation status

Updated 2026-10-12. MVP is incomplete; no external credential blocks the next engineering milestone.

## Verified and committed
R0 identity, tenancy, memberships, events, canonical website publication and recovery foundation. Raven Relay durable delivery adapter/callback. Harbour marketing landing page and workspace redesign. Staff private media processing, quotas, moderation and albums. Four invitation families with real immutable JPEG/PDF exports. Households, CSV, private guest credentials and transactional RSVP capacity.

## Latest verified milestone
Creative planning is committed as 8033a2f. Retention/archive/erasure now has nine tests and 84 full tests passing without skips; all nine package builds/typechecks and lint pass. Browser API/worker prepared a real private TAR; both included originals matched checksums. UI reviewed at 360/1440 CSS pixels. Durable ledger replay, immediate credential revocation, account request/erasure, late callback rejection and retired-slug protection are verified on isolated fixtures.

## Current work and next action
Commit retention with its evidence, then implement O01 operator permissions, audited support access/renewal, O03 pseudonymous metrics and remaining notification controls. Continue directly into key rotation, raw webhook parsing, portable Linux/S3 and complete backup/restore/security/load/browser release gates.

## Remaining mandatory scope
operator support/metrics and audited renewal; key rotation, API documentation/pagination; complete notification flows; portable Linux worker/storage and expanded backup/restore rehearsals; R3 security/load/accessibility/browser/device gates.

## External checks
Live Raven delivery/callback, optional AI provider smoke checks and production storage need configured credentials and explicit authorisation for real/paid traffic. Physical camera and two-phone QR checks need devices. These do not prevent continued local implementation.
