# Notification verification — 2026-10-12

Full regression: 98 passed, zero skipped. Six notification tests cover owner isolation, private-body/provider exclusions, pagination, concurrent idempotent retries, definite versus uncertain states, grant rotation, consumed identity links, revoked membership links and older unbound private-link rejection. Raven HTTP tests verify malformed unsigned JSON returns 401 before JSON parsing, signed malformed data remains rejected, and oversized bodies return 413. Final focused rerun: 10 passed, zero skipped, after fail-closed hardening. Build/typecheck passed in all nine packages; lint passed.

Browser journey: synthetic failed message edc85b48-d6a0-44b8-a39d-f2cfad9e3a59 was reviewed, queued once and processed only through a targeted capture adapter. Child fcfbf858-f310-4428-ab1a-1098dafc2bdd became accepted, never delivered. Real UI focus moved to the recipient review; 360px body had no overflow; desktop/queued and mobile/accepted captures retained. A secondary development origin was rejected; the configured localhost:3000 journey succeeded. No live email or new pass was issued.

Fresh Impeccable review requested one fix: wrap long subjects and recipient addresses throughout history/review. Applied to all historyItem text. Real external Raven delivery/callback and human inbox reception remain unauthorised external checks.
