# Local setup

Requires Node 22.23.x, pnpm 11.8.0 and PostgreSQL 16. Use a new local database; never point tests or rehearsal at existing wedding data.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
# Edit DB_CONNECTION for your local cluster and choose a random TOKEN_HASH_KEYS value.
pnpm db:migrate
pnpm build
```

Start three independent terminals from the repository root:

```sh
pnpm dev:api
pnpm dev:worker
pnpm dev:web
```

Visit http://localhost:3000/platform. Register, then inspect the capture-only verification email JSON under EMAIL_CAPTURE_ROOT (default /tmp/std-mail). The worker must be running to produce this local file. Open its verification link and sign in. Real emails are never sent with capture selected. Unavailable API responses show retry guidance. Registration/recovery never disclose whether an email exists.

The marketing website is at /. The preserved original couple website is at /couples/adeola-and-joshua; platform wedding websites use /w/their-slug. All processes load the root .env. DB_CONNECTION selects the platform database; DATABASE_URL selects the legacy wedding database. Existing apps/web/.env.local remains supported for legacy overrides. Do not put production database credentials in .env during development.

```sh
pnpm lint
pnpm typecheck
TEST_DB_CONNECTION=postgresql://YOUR_USER@127.0.0.1:YOUR_PORT/std_test \
  pnpm test
pnpm db:legacy-report
```

Tests require a localhost database whose name ends in `_test`; test data is synthetic and uses UUID-prefixed names. The integration suite adds fixtures rather than deleting unrelated rows. Run tests without the background worker, which would compete for test jobs. Rebuild workspace packages after editing contracts/adapters/persistence before starting dist-based services or running tests.

Synthetic browser fixture, only in local `_test` databases:

```sh
pnpm exec tsx scripts/local-fixture.ts
```

Fixture email is browser-fixture@example.test; password is synthetic browser password. It is development test data, never production setup.

Web uses WEB_PORT (default 3000); API uses API_PORT (default 4000, legacy PORT supported). The root .env is loaded automatically; no PLATFORM_ENV_FILE is needed. An inherited deployment PORT overrides the web default. Guest media scanner setup: [guest uploads](guest-uploads.md).

Portable profile (capture-only, separate volumes) defaults to http://localhost:3002. Use `docker compose up --build -d`, after arranging a sandbox-capable renderer as documented in render-browser.md. For a bounded disposable rehearsal: `STD_RENDER_BROWSER_ENDPOINT=http://YOUR_PRIVATE_NUMERIC_BRIDGE:9223 docker compose -p std-r3-verification up --build -d`, then `pnpm exec tsx scripts/verify-compose.ts`. The script checks the worker is capture/development before creating UUID-labelled synthetic records. Do not use it against a public or production origin.

## Verification from .env

`pnpm test` loads the root .env, builds the tested API/worker dependency graph and creates a fresh disposable PostgreSQL database. DB_CONNECTION (or an explicit TEST_DB_CONNECTION) must identify a local administrator endpoint ending in_test with CREATEDB permission. The shipped USER/PASSWORD/PORT test URL example is treated as unset; no legacy DATABASE_URL fallback occurs. Existing application rows and files are not the test target. Capture email, disabled AI and isolated filesystem/ledger directories are forced for the suite. Successful runs remove only their generated database/files; failures retain those named resources for inspection.

For `pnpm test:full`, also set TEST_HEIC_FIXTURE to a licensed local HEIC fixture and TEST_INVITATION_BROWSER_PATH to a supported sandboxed local Chromium executable (INVITATION_BROWSER_PATH is its fallback). Full mode refuses absent files; regular mode reports optional rendering/HEIC skips. Example macOS browser path: /Applications/Google Chrome.app/Contents/MacOS/Google Chrome. Keep fixture licensing boundaries; do not commit the HEIC original or derivatives. Full local124-test profile passed without skips on2026-10-13. Browser/mobile/provider/device acceptance remains separately recorded in verification reports.

The event editor supports optional end date/time in the event timezone; an end before its start is rejected. Existing end times can be changed or cleared when rescheduling. Event cards and published schedule sections show the range, including an end date when it crosses a local calendar day. Save updates the draft; publish a website revision to update guests.

### Focused verification and browser reuse

Run only checks relevant to the change during implementation. Export verification is needed for template, typography, rendering or export changes; reserve the complete suite for final release verification.

The invitation, admission-ticket, planner-brief and recovery verifiers accept optional `TEST_RENDER_BROWSER_ENDPOINT=http://127.0.0.1:9223` to reuse an already-running private dedicated sandboxed renderer (see render-browser.md). Set it only to a renderer you own, with an empty dedicated profile; never point it at a personal browsing session. Each artifact uses an isolated context and disconnects after cleanup. The explicit browser-lifecycle test still starts and closes one browser to verify ownership and cleanup. Without this option, individual artifacts launch their own browser. Production configuration remains the separate documented render-browser adapter setting.

Focused database/API verification uses the same isolated database and private scratch paths:

```sh
pnpm test --file=publication.test.ts
pnpm test --file=guests.test.ts --name=capacity
pnpm test --file=notifications.test.ts --file=email-provider.test.ts
```

Repeat `--file` for related files; `tests/` is optional. Unknown flags/files and invalid name patterns fail before database creation. `--full` deliberately rejects selectors. A name filter can skip unrelated cases, so its result proves only the selected behaviour, not the full file or release.

The targeted post-path recovery test also requires version-compatible pg_dump/pg_restore executables on PATH or PG_DUMP_PATH/PG_RESTORE_PATH. It creates and removes its own guarded local source/restore databases and uses no renderer.
