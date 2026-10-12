# Implementation status

**R3 MVP is not complete.** Verified checkpoint: R0 foundation and connected R1 website/journal publication slice. R1 as a whole is still incomplete.

Completed: independently runnable Next.js/NestJS/worker monorepo; verified identity/recovery; tenant workspaces/memberships/events; primary ownership and thirty-day soft recovery; durable email/capture transport; two responsive website themes, immutable publication, revocable shared access; structured journal drafting/publication/aliases. Legacy wedding/routes/data are preserved on their original sole writer.

Verification: build/typecheck 8/8 packages; lint; 16 PostgreSQL/API tests; synthetic browser onboarding/event/site/journal journeys; desktop and 360px rendered inspection; zero script elements in XSS sample article; production dependency audit found no known vulnerabilities. Legacy snapshot rehearsal preserved 4 posts/6 albums/4 video collections. R0 isolated restore matched all 13 table counts/checksums, including a deletion tombstone. R0 Linux container build and database-backed readiness passed; expanded R1 container/compose startup not yet rehearsed.

Current blockers are unfinished engineering, not just credentials: invitation studio/actual JPEG/PDF; private processed media/hero/blog attachments; households/CSV/RSVP/capacity; new admission lineage/scanner; quotas/moderation; AI/manual boards/planner briefs; retention/export/erasure/support/metrics; key rotation/OpenAPI/pagination; R3 security/mobile/performance/provider/full recovery gates. There are no new platform RSVP/pass/upload/AI features to use yet. Legacy pass/user operational cutover awaits R2 invariants.

Next concrete action: add the private owner-upload/process/authorised-read path (with quota, validation and derivative tests) to enable hero and blog attachments; then implement the four versioned invitation families with one shared preview/export resolver and queued JPEG/PDF renderer. Continue the existing plan into R2 and R3 without repeating R0.

Resume: read this file, requirements-traceability.md, decisions-for-review.md and verification reports. Run existing checks before extending schema. Local synthetic PostgreSQL is at localhost:55439/std_test; configuration is in ignored root .env. Stop the background worker before queue tests. Database restore target std_restore_test preserves the R0 drill; no production source was touched.

External checks: live Raven Relay/S3 capability checks need synthetic credentials; real phone/browser matrix and complete R3 restore require appropriate devices/runtimes. No real guest email, paid AI, public deployment or production write was performed. SMTP/provider acceptance is never called delivered. Fixed licensed invitation fonts and media codecs remain implementation decisions to resolve before those features ship.

Commit checkpoint: ad3d4ef monorepo; 7fac61c identity/tenant/events; 9fb8cdc connected dashboard; 30134d8 migration/container/restore runbooks; ca1b1d5 website/journal publication and calendar-date fix. Remaining work above is a continuation checkpoint, not an MVP completion report.

Configuration update: root `.env` loads automatically for API/worker/migration commands and web scripts. Use `pnpm dev:api` and `pnpm dev:worker` directly. `DB_CONNECTION` remains separate from legacy `DATABASE_URL`. This replaces the earlier PLATFORM_ENV_FILE setup.

Resumed baseline (12 October): build 8/8, lint and typecheck pass; all 16 existing PostgreSQL/API tests pass. Plain pnpm test requires TEST_DB_CONNECTION by design; tests ran against the existing isolated local _test database. Raven Relay adapter and raw signed callback routing implemented; 20 PostgreSQL/API tests now pass, including 4 Raven Relay adapter/callback tests; lint and typecheck pass. Next: Harbour application redesign and marketing/couple route separation, then private media slice. Complete R3 remains the active goal.
