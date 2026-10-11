# Local setup

Requires Node 22.23.x, pnpm 11.8.0 and PostgreSQL 16. Use a new local database; never point tests or rehearsal at existing wedding data.

```sh
pnpm install --frozen-lockfile
cp .env.platform.example .env.platform
# Edit DB_CONNECTION for your local cluster and choose a random TOKEN_HASH_KEYS value.
PLATFORM_ENV_FILE="$PWD/.env.platform" pnpm db:migrate
pnpm build
```

Start three independent terminals from the repository root:

```sh
PLATFORM_ENV_FILE="$PWD/.env.platform" pnpm dev:api
PLATFORM_ENV_FILE="$PWD/.env.platform" pnpm dev:worker
pnpm dev:web
```

Visit http://localhost:3000/platform. Register, then inspect the capture-only verification email JSON under EMAIL_CAPTURE_ROOT (default /tmp/std-mail). The worker must be running to produce this local file. Open its verification link and sign in. Real emails are never sent with capture selected. Unavailable API responses show retry guidance. Registration/recovery never disclose whether an email exists.

The original wedding remains at /. Legacy configuration belongs in apps/web/.env.local after the move. Do not put production database credentials in .env.platform during development.

```sh
pnpm lint
pnpm typecheck
TEST_DB_CONNECTION=postgresql://YOUR_USER@127.0.0.1:YOUR_PORT/std_test \
  PLATFORM_ENV_FILE="$PWD/.env.platform" pnpm test
pnpm db:legacy-report
```

Tests require a localhost database whose name ends in `_test`; test data is synthetic and uses UUID-prefixed names. The integration suite adds fixtures rather than deleting unrelated rows. Run tests without the background worker, which would compete for test jobs. Rebuild workspace packages after editing contracts/adapters/persistence before starting dist-based services or running tests.

Synthetic browser fixture, only in local `_test` databases:

```sh
PLATFORM_ENV_FILE="$PWD/.env.platform" pnpm exec tsx scripts/local-fixture.ts
```

Fixture email is browser-fixture@example.test; password is synthetic browser password. It is development test data, never production setup.
