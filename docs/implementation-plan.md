# Implementation plan

PRD 1.0 and TRD 1.0 (12 October 2026) govern implementation. Extracted text is retained beside the source documents. Later requirements E02–E05 are excluded; E01 is optional.

| Stage | Requirements | Connected milestone and release evidence | Dependencies |
|---|---|---|---|
| R0 | W01–W04; foundations for all groups | Audit and baseline; pnpm/Turbo web/API/worker; PostgreSQL migrations; verified identity, opaque sessions and recovery; scoped memberships/events; safe legacy migration rehearsal | Isolated PostgreSQL, dependencies |
| R1 | S01–S03, B01–B03, I01–I06 | Two site themes and immutable publication; structured blog; four versioned card families; shared preview/export resolver; actual JPEG/PDF worker outputs, geometry/link/QR/overflow verification | R0, private storage, jobs, licensed fonts, pinned browser |
| R2 | G01–G03, R01–R04, P01–P04, M01–M04 | Household access, CSV, transactional RSVP/approval; hashed/encrypted passes and idempotent admission; quota reservation, processing and owner moderation | R1, concurrency integration suite, image/video tooling |
| R3 | A01–A05, M05, N01–N02, O01–O03 | Bounded concepts/manual board, revision approval/application, PDF/JSON brief; notification delivery truth; archive/deletion/tombstones; support, metrics and restore drill | R2, adapter contracts, backup/storage rehearsal |

Each feature receives a commit after relevant checks. Required final gates: build/lint/type checks; real PostgreSQL tenant/capacity/admission tests; browser/mobile/a11y journeys; all-template render inspection; two storage adapters; isolated restore including tombstones; production adapter smoke checks explicitly identified where credentials are unavailable. A passing compilation alone is not a release gate.

Execute sequentially without changing live data, deploying, emailing guests or using paid AI. Resume from implementation-status.md and actual evidence in requirements-traceability.md.

## Current execution sequence (2026-10-14)

Connected R0–R3 feature implementations exist; release acceptance is not complete. Resume from current source and `implementation-status.md`, rather than replaying the historical implementation sequence.

1. Finish controlled legacy transition evidence: frozen source, explicit mappings, quarantined history, audited release, pre-switch rollback and current-schema encrypted restore. Local source/target rehearsal is implemented; production promotion remains separately authorised.
2. Finish the primary browser/accessibility matrix across marketing, authentication, workspace, website/blog, invitation editor, guests/RSVP, admission, media/uploads, creative and lifecycle/support. Exercise keyboard, responsive layouts, errors/retries and publication boundaries. Resolve actual defects before expanding verification.
3. Measure mobile public-page LCP on a declared profile using available supported browser controls; API timing alone does not satisfy this gate.
4. Reconcile every mandatory traceability row with current implementation and evidence, removing stale foundation-only statements and identifying missing acceptance evidence precisely. Retain physical-device, human usability/planner, owner-copy and authorised live-provider checks as unverified until performed.
5. Run final build/lint/type/full tests, portable build/smoke and applicable recovery checks after material changes. Recheck environment examples/start commands/deployment/backup instructions. Report residual production runtime findings and deployment-dependent limits truthfully.

The latest local baseline is 151 full tests without skips, all nine workspace build/type tasks and lint passing. Current recovery verifies 70 tables, 19 objects and 48 font/style/license assets, with independent erasure/admission replay and handover hold preservation. Actual 100-wedding pilot load and Linux rendering/media evidence are recorded under `verification/`. Detailed evidence and remaining limits belong in traceability/status, not duplicate historical plans.

Current acceptance checklist: verification/release-gates.md. The42-row requirement table has been reconciled with scoped source evidence; remaining browser/performance/portability/recovery gates must still be completed or explicitly blocked.
