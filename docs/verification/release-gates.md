# R3 acceptance gaps — 2026-10-14

This is a release checklist, not a completion declaration. The traceability table contains all42 mandatory PRD IDs. Implementations and local invariant tests exist across all groups; that does not prove every acceptance gate.

| Gate | Current evidence | Still required |
|---|---|---|
| Tenant/roles, RSVP capacity, single admission | PostgreSQL/API tests;100-way admission; journal replay; pilot load | Passed155-test final local regression; physical/event-day acceptance remains separate |
| Website/blog publication | Immutable snapshots, shared/invited boundaries, derived contrast; six focused post-path checks | Remaining desktop/browser keyboard/error-state matrix; owner copy review |
| Invitations | Four families, photo/no-photo, actual JPEG/PDF/QR; bundled fonts and pixel parity | Physical two-phone QR samples |
| Media | Real private ClamAV/HEIC/video, quotas, moderation and revocation; filesystem/S3 conformance | Required phone/browser upload journeys and remaining rendered error states |
| AI and handoff | Schema/failure/constraint/provenance/revision tests; manual approved PDF/JSON | Authorised live provider evaluation; three-of-five human planner assessment |
| Email | Raven adapter, protocol fixtures, idempotency and truthful capture states | Authorised real sender/delivery/webhook smoke; no real email permission given |
| Operator | Actual isolated API tests; synthetic read-only UI; actual support submission | Authenticated operator browser journey requires authorised operator account; prior privilege expansion rejected |
| Recovery/retention | Encrypted70-table restore,19 objects,48 font/style/license assets; independent erasure/admission replay | Production independent-failure-domain RPO/RTO rehearsal (migration028 expansion now verified separately) |
| Performance | Declared100-wedding/100k-attendee pilot; admission p95 below1s and export p95 below60s | Mobile public LCP p75 under declared profile; no successful browser audit yet |
| Accessibility/devices | Scoped keyboard/contrast/360px reviews and screenshots | Full WCAG2.2AA review; recent iOS Safari/Android Chrome and desktop Safari/Edge/Firefox journeys |
| Portable deployment/security | Separate web/API/worker compose and Linux native-processing/dedicated-renderer evidence; runtime findings recorded | Deployment/certificate/backup review; resolve or assess remaining runtime findings (fresh local build/smoke passed) |
| Human pilot | No invented participant evidence | Owner copy, independent usability, planner usefulness and recorded sample sizes |

Final local build/lint/type checks and155-test regression passed; fresh current-source portable build and connected smoke passed. Scoped Chrome reviews and current Linux rendering are recorded. No further export matrix/full-suite rerun is justified without relevant changes.

Remaining acceptance requires actual owner/participant/planner review, physical devices, supported browser/assistive-technology sessions, authorised providers/operator access and production infrastructure. Mobile LCP is unmeasured: the earlier native Lighthouse attempt became unavailable before running, and API timings are not substituted. No gate is waived by the green local checks. Do not deploy, send actual emails or incur paid AI usage without explicit authorisation.
