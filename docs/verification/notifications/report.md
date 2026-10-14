# Notification verification — 2026-10-12

Full regression: 98 passed, zero skipped. Six notification tests cover owner isolation, private-body/provider exclusions, pagination, concurrent idempotent retries, definite versus uncertain states, grant rotation, consumed identity links, revoked membership links and older unbound private-link rejection. Raven HTTP tests verify malformed unsigned JSON returns 401 before JSON parsing, signed malformed data remains rejected, and oversized bodies return 413. Final focused rerun: 10 passed, zero skipped, after fail-closed hardening. Build/typecheck passed in all nine packages; lint passed.

Browser journey: synthetic failed message edc85b48-d6a0-44b8-a39d-f2cfad9e3a59 was reviewed, queued once and processed only through a targeted capture adapter. Child fcfbf858-f310-4428-ab1a-1098dafc2bdd became accepted, never delivered. Real UI focus moved to the recipient review; 360px body had no overflow; desktop/queued and mobile/accepted captures retained. A secondary development origin was rejected; the configured localhost:3000 journey succeeded. No live email or new pass was issued.

Fresh Impeccable review requested one fix: wrap long subjects and recipient addresses throughout history/review. Applied to all historyItem text. Real external Raven delivery/callback and human inbox reception remain unauthorised external checks.

## Focused refresh review — 2026-10-14

Actual Chrome on the guarded navigation fixture verified the empty delivery history and provider-acceptance explanation. Refresh now announces progress/completion through a persistent polite status region; the section exposes its busy state. Older-history loading uses the same explicit announcement path. Retry-queued feedback remains distinct. Final mobile screenshot: refresh-mobile.png. Rebuilt Settings also shows scheduled-expiry renewal guidance instead of provisional-review instructions for a dated wedding.

Changed-file lint, web typecheck and production web build passed. No complete test suite or exports ran. Email was disabled in this fixture; no messages were queued/sent and no archive, identity, ownership or deletion controls were submitted. This checks local UI feedback, not actual assistive-technology or live-provider acceptance. Viewport reset and tab closed.
