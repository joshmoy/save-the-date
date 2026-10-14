# Current-source local checks — 2026-10-14

Commit under verification: a154a30 (documentation checkpoint follows).

- Build: nine tasks successful, zero cached,23.127s.
- Lint: eslint completed successfully.
- Type checks: nine tasks successful. The first invocation overlapped the Next build and saw deleted generated .next/types files; the sequential rerun after build passed. Run build before typecheck.
- Complete suite:155 tests passed, zero failures/skips,45.14s. Fresh disposable database/private files removed after success. Capture email and disabled AI adapters; actual local PostgreSQL, HEIC, media safety and bounded render checks. Existing dedicated renderer reused except the explicit owned-browser lifecycle test.
- Focused supporting evidence: pre-028 encrypted restore (post-path-expansion.md), renderer3 Linux fonts (renderer3-linux/report.md), current mobile preview and delivery/section feedback screenshots.

Commands from repository root:

```sh
pnpm build
pnpm lint
pnpm typecheck
TEST_HEIC_FIXTURE=/tmp/std-phone-verification.heic \
TEST_INVITATION_BROWSER_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
TEST_RENDER_BROWSER_ENDPOINT=http://127.0.0.1:9223 \
PG_DUMP_PATH=/opt/homebrew/opt/postgresql@16/bin/pg_dump \
PG_RESTORE_PATH=/opt/homebrew/opt/postgresql@16/bin/pg_restore \
pnpm test:full
```

Use equivalent licensed fixture, sandboxed dedicated renderer and PostgreSQL tool paths on other hosts. Root .env supplies the isolated local test administrator connection. Existing wedding databases were not test targets.

Fresh current-source web/API/worker images and connected localhost Compose smoke now pass; see final-portable/report.md. No public deployment, actual guest email or paid AI use occurred. R3 remains unaccepted: see release-gates.md for physical-device, human, authorised-provider, production and remaining browser/performance evidence.

Cleanup: owned verification Compose services, synthetic browser-fixture server and temporary headless renderer stopped after successful checks. Volumes, fixture databases and evidence retained; main app and personal Chrome unchanged. No background export verification loop remains running.
