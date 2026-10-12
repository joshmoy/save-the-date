# Migration and recovery

Platform migration automatically reads the root .env and uses DB_CONNECTION. Legacy scripts use DATABASE_URL and are separate; never run them as platform setup. The migration runner applies ordered SQL with SHA-256 checksums under a PostgreSQL advisory transaction lock. An edited applied migration fails; add an expand migration instead. No destructive migrations are included.

Before an authorised production migration, create an encrypted restore point and restore it into an isolated database. Use pg_dump/pg_restore from the supported PostgreSQL major version. Keep the data backup, object inventory/versions, font/template assets, configuration and keys in a failure-independent recoverable location. Target normal RPO 15 minutes/RTO 4 hours; event-day RPO 1 minute requires continuous recovery and an admission reconciliation runbook. R0 has not proved these service targets.

R0 rehearsal:

```sh
pg_dump --format=custom --file=/tmp/std-r0-backup.dump "$TEST_DB_CONNECTION"
createdb --host=127.0.0.1 --port=YOUR_PORT std_restore_test
pg_restore --dbname=postgresql://YOUR_USER@127.0.0.1:YOUR_PORT/std_restore_test /tmp/std-r0-backup.dump
```

Inspect tenant membership, events, opaque session states, migration checksums and deletion tombstones on the isolated restore. Never reopen scanning from an old snapshot without reconciling admissions committed after it. R2 adds pass-history assertions; R3 adds object/deletion replay checks. R0 restore evidence is separate from the mandatory complete R3 drill.

Legacy transition: run `pnpm db:legacy-report` for source-only counts/checksum/exceptions. For a reviewed local rehearsal only, supply LEGACY_APPLY=1 and LEGACY_OWNER_EMAIL identifying a verified platform account. This creates a draft seed and preserved snapshot; it refuses an existing seed. It does not alter old passes/users/settings, publish new content, contact providers or silently reinterpret old admission flags. Before live cutover, map staff/event identities explicitly and retain rollback to the legacy writer.

Workspace recovery: use the primary owner's password and workspace identifier at /platform within thirty days. Invitations revoked on deletion remain revoked. Privacy erasure and expired hard deletion are R3 work; do not advertise R0 soft deletion as completed erasure.
