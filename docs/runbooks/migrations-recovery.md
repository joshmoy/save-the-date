# Migrations, backup and recovery

Root `.env` loads automatically. Platform uses `DB_CONNECTION`; legacy scripts use `DATABASE_URL`. Apply platform migrations with `pnpm db:migrate`. Ordered SQL checksums are immutable and run under an advisory transaction lock; add new migrations rather than editing applied files. Migration 023 adds publication/admission recovery holds; 024 adds enforced restored ownership review.

## Configure recovery

Set `BACKUP_ROOT` and `BACKUP_REPLICA_ROOT` to distinct private filesystem volumes; production must put the replica in a separate failure domain. Set `BACKUP_ENCRYPTION_KEYS` to `{"active":"key-id","keys":{"key-id":"BASE64_32_RANDOM_BYTES"}}`. Generate a key with `openssl rand -base64 32` and retain retired keys while corresponding bundles exist. These keys are separate from admission encryption and token hashing. Optional `PG_DUMP_PATH`/`PG_RESTORE_PATH` select PostgreSQL 16 tools (defaults `pg_dump`/`pg_restore`). Never commit secrets or backup plaintext.

`DELETION_LEDGER_ROOT` or `DELETION_LEDGER_S3_BUCKET` must be independent private durable recovery storage. It now holds workspace/account/resource erasure markers and admission intent/commit records. Preserve its current state across database restores; do not replace it with an older snapshot. Filesystem writes fsync files/directories. Verify production storage durability and replication, including S3 version-deletion policies. Run encrypted-volume/secret/config/template/font/image recovery separately; the bundle contains fonts, not production configuration/secrets.

Quiesce API/worker writers during a full snapshot; source changes cause backup failure. Run:

```sh
node --import tsx scripts/platform-backup.ts create
node --import tsx scripts/platform-backup.ts expire
```

The first command returns an opaque backup ID only after ciphertext checksum matches on both copies. The second deletes both copies past thirty days. Schedule normal recoverable points at most fifteen minutes apart; event-day recovery requires continuous database recovery/replication and durable replicated admission state. Full quiesced dumps alone do not provide that service guarantee. Monitor backup failure, age, replication lag and expiry.

## Restore into isolation

Fence/stop the original API and workers. Preserve current independent ledgers and protect the target from all ingress until replay finishes. Create an empty PostgreSQL 16 database and empty private object directory. Set `RESTORE_DB_CONNECTION` and `RESTORE_STORAGE_ROOT` to these distinct targets, then:

```sh
node --import tsx scripts/platform-backup.ts restore BACKUP_ID
```

This reference CLI restores filesystem object storage. S3 production recovery needs the same checked streaming copies and an isolated target bucket, covered by the storage conformance rehearsal; do not expose a provider-console restore without invariant verification. PostgreSQL tables and every restored object must match the authenticated manifest before recovery mutations. Current checksum-checked expand migrations run after snapshot verification and before access quarantine. Authentication reset, erasure replay, generated-copy removal and admission reconciliation run before a successful restore report. Partial/failed targets remain isolated; recreate empty targets for a retry.

All prior passwords, sessions and access grants are quarantined; unused passes are revoked. Previously acknowledged admissions remain used. Old email/AI attempts stay uncertain and are not automatically resubmitted. Owners use fresh password recovery, review pending media and explicitly republish the website/blog/albums. Owner republish clears only the recovery hold, not operator support holds. Issue fresh unused passes after review. Restored primary/publication/member-control capabilities are held. An explicitly allowlisted, recently authenticated operator must independently verify the current accepted owner, record evidence and reconcile ownership in `/operator`. The target must have a verified existing owner/co-owner membership in that wedding; restore missing identity/membership lineage from an authoritative newer source first. An unrelated verified account cannot be appointed through this recovery action. The old primary must not regain privileges from the snapshot. The publication review hold remains after ownership reconciliation. Review collaborators against current removal markers/case records before exposing the target.

Open admission recovery holds pause all scanning for that wedding. Reconcile the independent ledger and event team. In `/operator`, an explicitly allowlisted, recently authenticated operator may resolve only an uncertain attempt with recorded evidence and confirmation that the guest was never admitted. Committed admissions cannot be cleared. Missing/mismatched lineage requires restoring the authoritative records. Never use an offline list to authorise electronic admission or reopen two competing writers.

Run a complete isolated drill monthly during the pilot and before authorised production migrations:

```sh
TEST_DB_CONNECTION="$DB_CONNECTION" TEST_INVITATION_BROWSER_PATH="/path/to/chrome" \
PG_DUMP_PATH="/path/to/postgresql16/pg_dump" PG_RESTORE_PATH="/path/to/postgresql16/pg_restore" \
node --import tsx scripts/verify-recovery.ts
```

The connection must be localhost and a `_test` database with permission to create two disposable test databases. The script creates fresh source/restore databases, capture-only synthetic records and private temporary directories. It never writes existing wedding data or contacts guests. Preserve its JSON report; remove only the named disposable databases and directory after review. `docs/verification/recovery/report.md` records the local rehearsal and limits. Target RPO fifteen minutes/RTO four hours and event-day RPO one minute remain unadvertised until proved at production scale/failure domains.

Legacy transition: `pnpm db:legacy-report` is read-only. Only a reviewed local `LEGACY_APPLY=1 LEGACY_OWNER_EMAIL=...` rehearsal creates a draft platform seed. It preserves legacy passes/settings/data and does not publish or contact providers. Map staff/event authority explicitly before a live cutover.

### Legacy operational snapshot

`pnpm db:legacy-snapshot` requires explicit `LEGACY_SNAPSHOT_CONNECTION`, absolute private `LEGACY_SNAPSHOT_ROOT` and the existing `BACKUP_ENCRYPTION_KEYS` key ring. No source connection is inferred from either application database variable. Remote PostgreSQL requires `sslmode=verify-full`; configure its trusted CA. The adapter uses a repeatable-read, read-only transaction with statement timeouts. It snapshots users, passes, scans, ticket settings and applied legacy migrations. Tokens, password hashes and personal data are written only inside an authenticated encrypted backup; the separate report contains counts, checksums, record IDs and exception codes. Store it outside the checkout and retain its encryption keys independently.

The tested rehearsal applies all ten original SQL migrations to a fresh disposable database, captures four pass states, decrypts the exact snapshot and proves source rows/checksums remain unchanged. `used_at` always preserves historical admission, including subsequently invalidated passes. Multiple successful scans or successful scans without the used flag need reconciliation. Legacy `ticket_limit` is an issued-pass limit, not RSVP capacity. Existing legacy users need verified identity mapping; do not copy their roles into platform memberships. No legacy token is activated by this tool, and no notification is sent.

This is backup/reconciliation preparation, not an authorised operational cutover. `LEGACY_APPLY=1 LEGACY_OWNER_EMAIL=verified@example.test pnpm db:legacy-report` now creates real tenant-owned blog drafts and private albums as well as the historical wedding seed, only against a local `_test` target. All posts retain their source wording and permanent slug; source dates and external media references remain in the checksummed source snapshot. No external image/video is represented as a processed asset. The same owner/source/path retry returns the existing wedding and fills missing source-derived records without overwriting edits, restoring deleted records or publishing anything. A different owner/source at that path fails. Before cutover, review an explicit original-wedding/event/attendee/staff mapping, resolve exceptions, import and process authorised assets, freeze old writers, reconcile final counts and rehearse controlled credential reissue with notifications captured locally. Live writes and real notifications still require authorisation. Preserve the original routes and backup until the reviewed transition is verified.

### Explicit operational mapping rehearsal

`pnpm db:legacy-plan ENCRYPTED_SNAPSHOT MAPPING_JSON OUTPUT_JSON` decrypts the authenticated snapshot into a private temporary directory, validates its shape, checks explicit mappings against a repeatable-read read-only target transaction and removes plaintext on exit. Configure `LEGACY_TARGET_CONNECTION` to a local `_test` database and `LEGACY_PLAN_SESSION_FILE` to a mode0600 file containing a current primary-owner session token. The owner must be verified, recently authenticated and outside a restored ownership hold. `BACKUP_ENCRYPTION_KEYS` uses the same private snapshot key ring. Output files are mode0600 and created without overwriting prior reports.

Mapping format:

```json
{
  "version": 1,
  "sourceChecksum": "SHA256_FROM_SNAPSHOT_REPORT",
  "weddingId": "TARGET_WEDDING_UUID",
  "users": [{"sourceUserId": "LEGACY_USER_UUID", "targetUserId": "VERIFIED_PLATFORM_USER_UUID"}],
  "passes": [{
    "sourcePassId": "LEGACY_PASS_UUID",
    "attendeeId": "TARGET_ATTENDEE_UUID",
    "eventId": "TARGET_EVENT_UUID",
    "admittedByUserId": "VERIFIED_MATCHED_SCANNER_UUID_OR_NULL",
    "identityEvidence": "Record how this attendee identity and event allocation were reviewed."
  }]
}
```

Source and verified target account emails must match; mismatches require review, not inferred identity or copied privileges. Each target attendee must already have eligibility for the mapped event in the same wedding. Duplicate target attendee/event pairs and existing target passes are exceptions. Used passes retain admission even if subsequently invalidated and are never proposed for reissue. Unused credentials remain quarantined pending owner review of RSVP/eligibility. Scan attempts are mapped as historical evidence, not a new admission authority. Legacy issued-ticket limits are never converted to RSVP capacity.

Exit0 means mappings reconcile locally; exit2 means the report contains exceptions. Neither authorises cutover: `cutoverReady` is always false. Remaining gates are a verified legacy write freeze, final source reconciliation, authenticated backup/rollback rehearsal, reviewed identities and authorised controlled reissue/notification. This tool does not import active credentials or write business records. Do not run dual legacy/platform admission writers. `tests/legacy-plan.test.ts` verifies the full encrypted-file CLI and real target checks, including cross-wedding rejection and unchanged target state.
