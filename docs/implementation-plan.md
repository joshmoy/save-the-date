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

Resumed goal (12 October): complete all Must requirements through R3, with a Harbour redesign and separate marketing homepage. Sequence: Raven Relay connected email/callback adapter; approved Harbour app tokens and marketing/couple route separation; private processed media to complete site/blog; four-family invitations and real exports; guest/RSVP/admission; guest moderation/visibility; AI/manual boards/briefs; retention/operator/metrics and full release gates. Preserve the existing verified foundation. Later E02–E05 remain excluded.

Continuation checkpoint: staff media committed c300830. Invitation families/editor/real exports and immutable retry/stale behavior implemented and verified locally; physical-phone and Linux sandbox gates remain. Move directly to household/CSV/grant/RSVP capacity, then passes/scanner and guest uploads. Do not repeat earlier milestones.

Household/RSVP checkpoint: connected CRUD/CSV/access requests/private guest sessions/complete responses, capacity and manual approval verified with PostgreSQL/browser evidence. Next: admission lineage/worker tickets/scanner and 100-way redemption/revocation races, followed by guest media grants and invited projections. Complete R2/R3 gates remain open.

Checkpoint 2026-10-12: P01–P04 admission and M03 guest access/invited projections verified with real files, scanner and browser evidence. Next dependent R3 slice: A01–A05 concepts/boards/approval/planner brief; retention/export/support and release gates remain pending.
