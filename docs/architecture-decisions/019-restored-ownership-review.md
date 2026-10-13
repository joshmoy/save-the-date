# ADR 019 — Reconcile ownership before restoring privileges

Accepted 2026-10-13 for W03/O02 recovery and authorisation. A database snapshot may precede a primary-owner transfer. Resetting passwords alone does not prevent the former primary owner regaining primary privileges from that snapshot.

Supported restore now applies current checksum-checked expand migrations after verifying the original snapshot fingerprints, then holds primary, publication and membership-control capabilities for every restored wedding. Ordinary new workspaces are unaffected. Basic authorised review/editing and admission remain independent of the review hold; deleted memberships are still replayed before exposure.

An explicitly allowlisted verified operator with recent authentication must independently review current ownership, record evidence, and choose an existing verified accepted owner/co-owner in that wedding. Arbitrary verified accounts cannot receive ownership through this endpoint. Missing user/membership lineage must be restored from an authoritative source first; it cannot be invented from a request body. Exactly one primary membership and wedding pointer are updated transactionally and audited. Publication remains held until the couple reviews and republishes content.

This makes the runbook's human ownership checkpoint an enforced boundary without promising that ordinary post-snapshot data loss is eliminated. Production PITR/replication and reviewed lineage recovery remain necessary for the declared recovery tier. Local drills use a distinct disposable operator identity; no existing browser user receives operator privileges.

Workspace reads now include the caller's current role, preventing a stale client from treating a transferred owner's response as an unspecified role. The UI explains the hold and hides privileged owner controls while leaving authorised review available.
