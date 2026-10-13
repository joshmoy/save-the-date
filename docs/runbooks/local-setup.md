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
