# Pre-028 blog path restore — 2026-10-14

One focused PostgreSQL integration test passed, zero skips, in1.26s of test execution. tests/post-path-recovery.test.ts creates separate UUID-named local source/restore databases, publishes a synthetic article, saves a renamed draft, then removes only the newly introduced column/migration record to model the previous schema.

The actual backup service exports a PostgreSQL custom dump, encrypts it and verifies the replica. The actual restore service decrypts, checks table fingerprints and restores to the empty target. Applying current migrations then preserves the canonical approved article/title while rejecting the unapproved draft URL with404. Both path reservations remain, with only the published slug approved.

Source, target, runner database and private scratch files were removed after success. Failure paths retain only their isolated targets for diagnosis. PostgreSQL16 dump/restore tools were used. No browser, invitation export, real email, paid AI or application data mutation occurred. This verifies migration028 expansion; it does not replace the complete recovery/erasure/admission drill or production RPO/RTO evidence.

Command:
```sh
PG_DUMP_PATH=/opt/homebrew/opt/postgresql@16/bin/pg_dump PG_RESTORE_PATH=/opt/homebrew/opt/postgresql@16/bin/pg_restore pnpm test --file=post-path-recovery.test.ts
```
Use equivalent version-compatible PostgreSQL tool paths on other hosts.
