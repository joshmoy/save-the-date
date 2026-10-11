# ADR 001: incremental platform boundary

Status: accepted for R0, 12 October 2026.

Next.js remains the sole legacy writer. New `std_*` records are owned by the NestJS API; the web gateway forwards opaque cookies and commands. Workers lease durable database jobs and perform adapter effects. No PostgreSQL hosting vendor is required; pg and ordered SQL are the reference implementation. Another engine requires an adapter and full invariant suite.

Identity uses scrypt N=32768/r=8/p=1, seven-day opaque sessions, keyed credential hashes, 24-hour verification, 30-minute reset and seven-day invitations. Reset consumes all outstanding recovery tokens and revokes all sessions. Destructive workspace changes require recent reauthentication and explicit confirmation. Default site access is shared. R0 does not publish private drafts.

Capture email and filesystem storage are local adapters; capture cannot start in production. Maileroo acceptance is never called delivered; uncertain sends stop for review. Durable jobs are themselves the initial transactional outbox. No separate dispatcher is necessary for this transport.

Legacy content imports into a preserved snapshot and seed draft only with a verified owner mapping. Legacy tables and public routes remain untouched. Live user/pass migration and storage-provider verification are not claimed complete. Migration checksum changes fail and migrations hold an advisory lock.

Limitations to address before R3: key rotation, field-projected DTOs and pagination, verified provider contracts, protected job payloads, operator repair controls and per-domain persistence ports. Single-file R0 HTTP routing should become Nest domain modules as feature boundaries grow.
