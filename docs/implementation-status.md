# Implementation status

Updated 2026-10-12. MVP is incomplete; no external credential blocks the next engineering milestone.

## Verified and committed
R0 identity, tenancy, memberships, events, canonical website publication and recovery foundation. Raven Relay durable delivery adapter/callback. Harbour marketing landing page and workspace redesign. Staff private media processing, quotas, moderation and albums. Four invitation families with real immutable JPEG/PDF exports. Households, CSV, private guest credentials and transactional RSVP capacity.

## Latest verified milestone
Admission lineage, optional automatic/owner issuance, revoke/reissue/expiry, encrypted credentials, private JPEG/PDF, owner corrections and online scanner. All 57 tests pass without skips; build/typecheck pass for nine packages and lint passes. Browser evidence includes a real dropped-after-commit scan response and safe same-operation retry. See verification/admission/report.md.

## Current work and next action
Implement dedicated guest upload grants and RSVP-authorised uploads, then invited-only website/blog/media projections. Guest uploads must remain private until processing and owner moderation; upload credentials cannot grant RSVP or admission.

## Remaining mandatory scope
AI/manual concepts and mood boards, approval/application and planner briefs; archive/export/retention/erasure/support/metrics; key rotation, API documentation/pagination; complete notification flows; portable Linux worker/storage and expanded backup/restore rehearsals; R3 security/load/accessibility/browser/device gates.

## External checks
Live Raven delivery/callback, optional AI provider smoke checks and production storage need configured credentials and explicit authorisation for real/paid traffic. Physical camera and two-phone QR checks need devices. These do not prevent continued local implementation.
