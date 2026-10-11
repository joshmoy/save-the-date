# Baseline audit — 12 October 2026

Commit: 4a197d4. Only pre-existing untracked change: docs/ containing three specifications and current-app-behavior.md. No AGENTS.md found at repository or ancestor paths. No test script or test files exist.

Dependencies were absent: first build/lint returned exit 127. After npm ci, lint passes; baseline type/build results are recorded below when complete. Install audit reports 16 vulnerabilities (including one critical); dependency findings must be resolved or assessed before release.

Source audit confirms:
- Next.js app routes, Chakra components; no API or worker process. Weddings/posts/events/collection definitions hardcoded; historical homepage date 1 August 2026.
- app_users has two global roles. Signed 12-hour payload cookies trust role/email until expiry; no persisted sessions, recovery, verification, rate limiting or mutation Origin/CSRF validation.
- Pass creation locks singleton ticket_settings; capacity counts passes rather than confirmed RSVPs. Tokens have eight random characters with modulo bias; plaintext database storage. No event/tenant, expiry, reissue lineage or request idempotency.
- redeem_hall_pass conditionally updates atomically, but scan logging follows in a separate query; logging failure can hide a committed admission. No same-operation timeout retry.
- Gallery caches and provider folders are global. Cloudinary browser upload signature allows legacy collections. R2 videos are permanent public URLs and external dashboard uploads; no private processing, quota, grants or moderation.
- PDF pass/email generation synchronous inside Next routes. Maileroo acceptance called sent; no durable outbox or delivered evidence.
- Database/migration SSL disables certificate verification. Migration filenames only, no lock/checksum. Migration and create-user scripts can point at a remote DB; do not run them with implicit environment during this work.
- No guests, RSVP, invitation studio, AI, retention/export or restore drill.

Existing integration behaviour is established from source; live provider credentials and production data have not been tested. Public legacy media is already public, not suitable for new private uploads.

Verified baseline after installing dependencies: `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass. Build generates 24 routes; warns that an unrelated parent lockfile influences workspace-root inference. No automated behavioural tests exist. Build does not prove live database/provider behaviour.

Resumed execution note: this turn began after the specification/audit commit 5b8f331 with an uncommitted monorepo move, package configuration and initial contracts/schema. Those changes were preserved and completed rather than reset. Runtime-generated root Turborepo and apps/web Next.js AGENTS.md files appeared during builds/dev startup; both were read and retained. Current migrated checks and evidence are in verification/r0-report.md and r1-publication-report.md. Production dependencies now pass `pnpm audit --prod`; the older install audit above remains historical baseline evidence.
