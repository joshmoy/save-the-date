# 024 — Align pilot answer and audit retention with TRD §14

Adopt the TRD's proposed ninety-day optional-answer and twelve-month audit schedules as pilot defaults, subject to necessity/legal review before paid launch. This supersedes the earlier implementation decision to delete operational audit records at ninety days. It does not recreate previously purged logs.

Optional meal, dietary, accessibility and note answers expire ninety UTC24-hour periods after the event ends, falling back to its start. Unknown dates remain unknown. The worker's existing minute sweep processes bounded batches, serializes wedding/event access, writes the independent erasure marker, clears answers, disables collection and invalidates older sensitive archives through the shared erasure path. Concurrent sweeps recheck under locks and record each expiry once. Missing recovery storage fails closed.

The guest response API ignores optional fields after the deadline even before the next sweep. Guest question projections close those fields; owners cannot re-enable expired questions without first correcting the event's schedule. Changing an event into a future date can permit new necessary collection, but does not resurrect deleted answers. Independent markers continue protecting old snapshots.

Operational audit events expire after twelve calendar months. Resolved support reports and provider callbacks retain their separate ninety-day schedules; transient expired grants and rate-limit windows keep their shorter schedules. Account/workspace erasure still scrubs identifying audit data promptly. These are bounded pilot policies, not a legal determination of necessity.

Minute maintenance tasks fail independently and emit redacted task/error codes. A failed retention sweep retries on the next minute; it does not starve queued invitation/media/pass jobs. Startup restoration reconciliation remains a prerequisite for opening the worker/API and still fails closed.
