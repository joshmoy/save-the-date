# Local release performance and dependency audit — 2026-10-13

Reference profile: Apple M4, ten logical CPUs, macOS arm64, Node 22.23.0, PostgreSQL 16.14; local filesystem objects and an independent fsynced admission journal. Other development/container services remained running. Synthetic data only; no real mail, paid AI or production writes.

`scripts/verify-release-performance.ts` made twenty concurrent real authenticated HTTP redemption requests to one event. All twenty admitted different confirmed passes, with exactly twenty admission rows. Server completion p95 was **378.28 ms**, including transaction locks and durable journal writes. Client loopback p95 was 402.11 ms; the server metric excludes camera/client network delay, as required by the PRD.

The same script processed eight real card bundles (four families, standard/accent wording) through authoritative queued export handlers, private filesystem storage and job acknowledgements. Both JPEG and PDF downloaded for every bundle. Complete bundle p95 was **1,089.64 ms**, excluding queue wait. Separate renderer invariants cover physical dimensions, fonts, clipping, QR and links. These eight local samples are a bounded baseline, not a production SLA.

`pnpm audit --prod --json` returned zero reported info/low/moderate/high/critical vulnerabilities across 443 production/optional dependency records. The saved registry response is evidence at this time, not proof against unknown vulnerabilities or an audit of Debian/container packages.

Mobile LCP under an agreed throttled profile, production storage/journal latency, full browser/accessibility matrix and physical camera/device checks remain unverified release gates. Chrome browser control is now available; separate physical-device and throttled mobile LCP checks remain unverified.

Rerun:

```sh
TEST_INVITATION_BROWSER_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
node --import tsx scripts/verify-release-performance.ts
pnpm audit --prod --json
```

The script loads root `.env`, requires localhost `_test` database, and creates fresh synthetic records/private temporary output. `TEST_DB_CONNECTION` may override `DB_CONNECTION`. Reports contain no credentials; the ephemeral verification namespace is separate from existing wedding storage.

## Declared local pilot profile —2026-10-14

`pilot-profile.json` records the actual PostgreSQL16.14/Node22.23.0/AppleM4 reference environment. A fresh disposable database held100 active, published synthetic weddings,500 events and100,000 attendee records (1,000 per wedding), with authoritative eligibility and unanswered RSVP rows. Domain commands created/published weddings and events; a restricted local disposable-database fixture bulk-populated synthetic attendees. It cannot target an ordinary application database.

Three one-second bursts each issued100 real public API requests across100 websites while20 actual admission requests ran concurrently. All300 reads succeeded; client loopback p9577.34ms. Admission server p95397.10ms/client488.94ms, with20 unique persisted admissions and independent fsynced journal records. Eight subsequent real JPEG/PDF bundles across the four families completed with p951,697.95ms, handled sequentially (worker concurrency1), excluding queue wait. Server admission is under the one-second target and exports under sixty seconds in this declared local environment. Public API latency is not webpage/mobile LCP. No sustained event load, production sizing or mobile network claim follows.

The first attempt modelled all320 requests from one IP and correctly hit the unchanged300/minute per-IP limiter. The successful rehearsal modelled100 synthetic public-client IPs through explicitly trusted loopback gateway127.0.0.1/32. It did not disable or increase rate limits. The failed disposable database `std_pilot_4ab395a3471543efbf281529ed7a5fe8_test` is retained with private logs in `/var/folders/v9/mgl3k18x3gx1b7vm3qgn9rxw0000gn/T/std-pilot-driver-MWMa13`. The successful database was removed; original data was untouched.

Rerun after `pnpm build`:

```sh
TEST_INVITATION_BROWSER_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
node scripts/verify-pilot-profile.mjs
```

Root `.env` loads automatically. The wrapper uses a local `_test` administrator connection (ignores the example placeholder), creates a fresh database, forces capture/disabled optional providers, retains reports, removes successful database targets and preserves failed targets for investigation. No real messages or paid services run.

Final regression:139 full tests pass with zero skips, including the guard proving bulk population refuses an ordinary `_test` database without writing attendees. Build, lint and all nine type checks pass.
