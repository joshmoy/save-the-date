# Save The Date

A Next.js web, NestJS API and worker monorepo being built against docs/Save_The_Date_PRD.docx and docs/Save_The_Date_TRD.docx. **The complete R3 MVP is not finished.** See docs/implementation-status.md and docs/requirements-traceability.md for the verified checkpoint and remaining release blockers.

Implemented: verified email/password identity and recovery; tenant workspaces, collaborator invitations, scoped events, ownership/recovery; two website themes with immutable publication and revocable shared access; structured journal drafts/publication; durable capture/provider email transport. Existing Adeola & Joshua pages, gallery and legacy passes remain on their original writer. They have not been migrated into the new guest/admission model.

Requires Node 22.23.x, pnpm 11.8.0 and PostgreSQL 16. Do not use a production database for local setup or tests.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
# Set DB_CONNECTION to the new database; DATABASE_URL is legacy-only.
pnpm db:migrate
pnpm build
```

Run each process in a separate terminal from the repository root:

```sh
pnpm dev:api
pnpm dev:worker
pnpm dev:web
```

Open http://localhost:3000/platform. Local verification/recovery/invitation mail is captured as JSON in EMAIL_CAPTURE_ROOT by the worker. Read its link to complete email verification. Capture is development/test only and never sends real email. The historical wedding remains at /; new sites use /w/{slug}.

After building, production process commands are `pnpm --filter @save-the-date/api start`, `pnpm --filter @save-the-date/worker start`, and `pnpm --filter @save-the-date/web start`, using the root .env or environment variables supplied by the host. The web start command uses the prepared standalone server. Production requires HTTPS, protected secret material, a durable storage configuration, a production-capable email adapter or explicit disabled state, and documented backup/retention policies. This checkpoint is not ready for a production pilot.

```sh
pnpm lint
pnpm typecheck
TEST_DB_CONNECTION=postgresql://YOUR_USER@127.0.0.1:YOUR_PORT/std_test \
  pnpm test
pnpm audit --prod
pnpm db:legacy-report
```

Tests require an explicitly local database ending `_test` and add synthetic fixtures. Stop the background worker before running the queue tests. Rebuild packages after contract/repository edits. `docker compose up --build` provides a portable local profile; do not use its development credentials publicly.

Operational details: docs/runbooks/local-setup.md, deployment.md and migrations-recovery.md. Decisions awaiting morning review: docs/decisions-for-review.md. Visual and test evidence: docs/verification/. The original README is retained as historical migration context under docs/runbooks/legacy-original-readme.md.
