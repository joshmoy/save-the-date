# Local release performance and dependency audit — 2026-10-13

Reference profile: Apple M4, ten logical CPUs, macOS arm64, Node 22.23.0, PostgreSQL 16.14; local filesystem objects and an independent fsynced admission journal. Other development/container services remained running. Synthetic data only; no real mail, paid AI or production writes.

`scripts/verify-release-performance.ts` made twenty concurrent real authenticated HTTP redemption requests to one event. All twenty admitted different confirmed passes, with exactly twenty admission rows. Server completion p95 was **378.28 ms**, including transaction locks and durable journal writes. Client loopback p95 was 402.11 ms; the server metric excludes camera/client network delay, as required by the PRD.

The same script processed eight real card bundles (four families, standard/accent wording) through authoritative queued export handlers, private filesystem storage and job acknowledgements. Both JPEG and PDF downloaded for every bundle. Complete bundle p95 was **1,089.64 ms**, excluding queue wait. Separate renderer invariants cover physical dimensions, fonts, clipping, QR and links. These eight local samples are a bounded baseline, not a production SLA.

`pnpm audit --prod --json` returned zero reported info/low/moderate/high/critical vulnerabilities across 443 production/optional dependency records. The saved registry response is evidence at this time, not proof against unknown vulnerabilities or an audit of Debian/container packages.

Mobile LCP under an agreed throttled profile, production storage/journal latency, full browser/accessibility matrix and physical camera/device checks remain unverified release gates. The browser connector cannot launch a separate Chrome session here. Core IAB journeys and local production rendering remain available.

Rerun:

```sh
TEST_INVITATION_BROWSER_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
node --import tsx scripts/verify-release-performance.ts
pnpm audit --prod --json
```

The script loads root `.env`, requires localhost `_test` database, and creates fresh synthetic records/private temporary output. `TEST_DB_CONNECTION` may override `DB_CONNECTION`. Reports contain no credentials; the ephemeral verification namespace is separate from existing wedding storage.
