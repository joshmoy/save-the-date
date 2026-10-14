# Pilot retention policy verification — 2026-10-14

Authoritative source: TRD §14, proposed90-day optional-answer and12-month audit defaults. These remain subject to necessity/legal review before paid launch.

Real PostgreSQL tests in retention-policy.test.ts exercise start fallback, last-end anchoring, exact90-day boundary and unknown dates; independent-ledger refusal; two concurrent sweep callers with exactly one expiry per event; disabled expired collection; restoration of older answers and replay; and a tenant-scoped sweep retaining200-day audit events while removing400-day events without touching another tenant. The private RSVP journey verifies optional question projections close and submitted expired private fields are ignored while attendance can still confirm.

worker-maintenance.test.ts verifies failed sweeps stay redacted and return control for later tasks/queued work. Startup restore reconciliation remains fail-closed. The prior encrypted70-table/19-object/40-font drill already verifies the shared optional-answer erasure marker; this change adds scheduling and collection policy, without changing marker format or schema.

Actual Chrome360×800 review of the owner explanation: answer-retention-policy-mobile.jpg under browser-pagination, no horizontal overflow. No deletion was submitted through the browser. No production data or live providers were used.

Final checks:149 full tests pass without skips; build/lint/all nine workspace type checks pass. No production worker was started. The minute scheduler provides bounded background cleanup; monitor backlog rather than promising instantaneous physical erasure.
