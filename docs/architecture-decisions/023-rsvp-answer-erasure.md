# 023 — Optional RSVP answer deletion survives restore

Clearing live RSVP fields alone leaves sensitive answers in older archives and backups. An owner deletion now writes an independent event-scoped erasure marker before clearing meal, dietary, accessibility and note fields. The marker contains only wedding/event IDs and a precise cutoff timestamp. Missing recovery storage rejects the operation.

Within the serialized transaction, revoke all older sensitive archive records and cancel their export jobs. Queue one retryable file-cleanup job per revoked archive; the worker removes its private output/staging prefix. Ordinary archives remain available. Owners are told to create a fresh sensitive export. Already downloaded files remain outside platform control.

Restore replay clears only answers whose update timestamp precedes the marker, revokes restored older sensitive archives and requeues physical cleanup even if its old job had succeeded. Later answers remain intact. RSVP submissions record actual write time, rather than transaction-start time, so a submission waiting on an event lock is not mistaken for an older answer.

This deliberately revokes all older sensitive archives for that wedding, including ones containing answers from other events. It preserves their source media/records and ordinary exports; selective archive regeneration would add avoidable complexity to a privacy-critical operation. No guest names, answers or contacts appear in the marker or cleanup payload.

Deploy API and worker versions that understand the additive marker/job kind together. An older binary cannot safely process the new marker. Keep independent ledgers outside rollback snapshots and run resource reconciliation before restored API access.
