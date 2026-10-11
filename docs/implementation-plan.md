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

Verified checkpoints (12 October): R0 foundation plus connected site/journal publication slice. Local database restore and Linux API container smoke passed. See verification/r0-report.md and r1-publication-report.md. Next dependency is private processed owner media (hero and post attachments) and the versioned four-family invitation renderer; R1 remains incomplete until actual exports and their quality evidence pass. R2/R3 work is still pending, not blocked solely by credentials.
