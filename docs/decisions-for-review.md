# Decisions for morning review

All choices below are reversible unless explicitly noted. No production data or external sends are authorised.

1. Keep existing untracked specification files and current-app-behavior.md unchanged and include them as project documentation; extract PRD/TRD in document order for searchable traceability.
2. Use PostgreSQL 16 in an isolated temporary local cluster for rehearsal; never read a configured production database. Tests explicitly supply a synthetic connection.
3. Disable commit signing only in this repository, as requested. Keep the current branch; commits preserve the pre-change history.
4. Preserve legacy homepage date (1 August 2026), routes, pass credentials and external public media. New platform tables use a separate namespace; existing users are not silently treated as verified owners. A migration requires an explicit operator mapping and backup.
5. Use SQL with pg behind a persistence port rather than introduce an ORM. PostgreSQL is the sole supported engine. Composite keys constrain tenant references.
6. Use Node 22, pnpm and Turborepo; independent Next.js, NestJS and worker entry points. Adopt database-leased jobs; no Redis requirement.
7. Identity uses parameterised scrypt (memory-hard), opaque hashed sessions, one-use verification/reset/invite tokens and database rate limits. No token is returned by registration. Local email capture is explicitly development-only.
8. New wedding slugs: 3–64 lowercase ASCII letters/digits with single internal hyphens; reserve system route words. Default sites are shared-access. Canonical path is /w/{slug}.
9. Partner invitations require the signed-in verified addressed account; seven-day validity; planner cannot publish. Security scopes must name existing wedding events.
10. Retain legacy domains under their current sole Next.js writer until their API migration passes acceptance tests. Platform entities have only the API as authoritative writer; no shared dual-write transition.
