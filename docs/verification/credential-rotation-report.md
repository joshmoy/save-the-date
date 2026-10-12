# Credential rotation verification — 2026-10-12

Six focused tests and 105 full tests pass with zero skips; all nine builds/typechecks and lint pass. Evidence covers active digest choice, legacy digest compatibility, malformed/weak rings, retired-key identity sessions/recovery/member links, shared-site/session rotation, household and upload grants/sessions, mail deduplication across keys, single-use admission/cached timeout outcomes and real API acceptance before versus after retired-key removal. An additional focused assertion exercises first admission using a retained-key manual credential.

Only synthetic isolated PostgreSQL fixtures and locally generated keys were used. Existing `.env` secrets and wedding records were preserved. Production rotation and secret deployment remain operator actions documented in runbooks/credential-rotation.md; no live configuration changed.
