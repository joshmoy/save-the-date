# Website and journal verification — 12 October 2026

This is a connected R1 slice, **not complete R1 or R3**. Tests/publication.test.ts adds five real PostgreSQL/HTTP checks. Combined suite: 16/16 pass. Build and typecheck: 8/8 packages. Lint passes. Production dependency audit reports no known vulnerabilities at this checkpoint.

Verified: site/publication version conflicts, owner-only publication, planner drafts remaining private, immutable snapshot values, exclusion of private event facts and actor email, content-preserving theme switch, shared-code/session rotation, rich-text/link validation, attachment rejection, blog publication/unpublication, stable aliases, path non-reassignment, invited-only concealment, authorisation on deletion, publication contrast rejection and public HTTP no-store responses.

Browser: production web process, synthetic local wedding. Saved and published site; saved a journal post and verified its title absent from the public site; published and browsed it. Script-like text rendered escaped with zero script elements inside the article. Both themes rendered and screenshots inspected. Modern mobile viewport width/document width: 360/360. Historical imported calendar date verified as August 1, 2026 after fixing PostgreSQL DATE conversion. Full mobile/browser/screen-reader matrix and performance remain pending.

Evidence: r1-public-garden.jpg, r1-public-modern.jpg, r1-mobile-modern.jpg and r1-journal.jpg. Garden screenshot includes a development-tool badge from the earlier dev check; subsequent Modern/journal checks used a production build. Site palette is the inherited historical wedding palette, not a generated brand proposal.

Not yet implemented: processed hero/photo/video attachments, gallery and RSVP sections, invitation studio/export snapshots and stale warnings, invited guest sessions, approval-ready media, AI/planner brief, retention/support and complete recovery gates. No invitation export, real-phone QR or complete MVP claim.

Final packaging check: `pnpm --filter @save-the-date/web start` now runs the prepared standalone server without the next-start warning. Static/public assets load and the public site renders under this process. API restarted successfully with final Nest module routing. r1-preview.jpg is the standalone viewport capture.

Configuration follow-up: root `.env` now loads automatically with `DB_CONNECTION` separate from legacy `DATABASE_URL`. API and worker-directory lookup passed without PLATFORM_ENV_FILE; plain `pnpm dev:api` started on port 4000 and database-backed readiness passed on the temporary startup check. Build, lint, typecheck and all 16 integration tests passed with the new loader. Root `.env` is ignored; example files and run commands are consolidated.
