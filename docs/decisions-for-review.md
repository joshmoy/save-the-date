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

11. Resume the pre-existing uncommitted monorepo rather than reset it. The initial state of this turn included moved legacy files and foundation contracts/schema. The inherited baseline audit is retained with this distinction.
12. Use a separate local PostgreSQL 16.14 cluster on localhost port 55439, because 55432 was already occupied. `std_test` contains synthetic data only. Tests refuse non-local connections or a database name without `_test`.
13. pnpm 11 config is in pnpm-workspace.yaml; disable implicit dependency installs on every script run. Explicit installs use the lockfile. Allow known esbuild, Sharp and Nest lifecycle scripts. No automatic production deployment.
14. Keep the existing Lucide icon family and Chakra buttons. R0 dashboard uses forest green, pale neutral surfaces, system sans typography and modest motion. Taste guidance is applied to public/auth presentation; operational controls use clear labelled forms.
15. Local dates are resolved in the chosen event timezone; nonexistent DST times fail. Repeated DST times use the earlier occurrence and the form discloses this. Quarter-hour offsets cover currently supported IANA civil offsets; historical sub-minute schedules are not supported by this editor.
16. R0 media-contributor invitations fail clearly until albums and their assignment constraints exist in R2. Do not grant unrestricted access as a temporary substitute.
17. Preserve the known 1 August 2026 wedding date. Album names do not prove ceremony dates. Legacy report imports source posts/albums into an unpublished snapshot; pass/user cutover is deferred until operational invariants exist. No live credentials were accessed.
18. A targeted lint suppression documents async session bootstrap: the React lint analyser flags the callback even though setters execute after awaited HTTP responses. Other lint checks remain active.
19. Introduce a FoundationRepository operation port so HTTP application code has no query/engine dependency. Engine-specific operations stay in packages/persistence. Each later domain should narrow that port.
20. Add generic OCI targets and a local compose profile. Container execution remains unverified until a compatible Docker daemon is available. Native Node process startup is verified separately.
21. Legacy snapshot import is one transaction with a verified owner, counts/checksum and exception report; it refuses an existing slug. No partial import can survive an event/snapshot failure.
22. The originally selected Docker tag registry fetch timed out. A cached official Node 22.23.2 image completed the full Linux build; its exact manifest digest is now the default base. A disposable API container passed real database readiness against the synthetic cluster. It was stopped; no image was published.
23. Website publication snapshots only public events and public-safe fields. Private event facts are never made visible merely by possession of a shared website code; invited-event access belongs to RSVP grants in R2.
24. Website shared codes and opaque website sessions are separate from staff/RSVP/upload/admission credentials. Code rotation invalidates prior website sessions. Public pages use no-store and noindex until metadata privacy review.
25. Blog URL paths are permanently reserved within a wedding, including old paths. A slug rename retains aliases; draft renames do not change the published URL until owner publication. HTTPS-only links and structured text keep scripts out of rendering.
26. Site hero/post attachment operations reject clearly until private processed media is available; they are not represented as complete. Invited-only posts are concealed until R2 guest sessions are implemented. No weak public substitute is used.
27. Browser verification exposed PostgreSQL DATE conversion shifting 1 August 2026 to 31 July. The adapter now returns date-only strings; instants stay UTC. A regression test and browser evidence confirm the historical date is preserved.
28. Block website publication when either primary or body text has less than 4.5:1 contrast against the background. Palette drafts still save, so owners can revise them without changing the live site.
29. Register identity, wedding, invitation and public HTTP routes through Nest feature modules rather than a catch-all middleware. Standard NodeNext TypeScript is retained by applying Nest decorators explicitly.
30. Prepare standalone public/static assets as part of the web build and use the standalone server for the start command. This works without a CDN or a platform-specific hosting runtime. Docker uses the same build step.
31. Use noindex metadata during this privacy-reviewed checkpoint. Public SEO can be enabled through controlled publication metadata later; shared-access content must never enter search metadata.
32. System fonts are used for the responsive website slice. Fixed licensed font assets and reproducibility are still required for invitation exports; no font/export completion claim is made.
33. Keep legacy README as historical migration context and replace the root README with current monorepo commands and an explicit incomplete-MVP status. Legacy operational instructions are not presented as platform setup.
34. Long couple names wrap rather than truncate on small screens. Taste guidance is applied contextually; preserving names and accessible reading takes priority over a marketing-only two-line headline rule.
35. Test files execute sequentially because the initial PostgreSQL job transport is shared; explicit concurrency invariants still launch parallel operations inside each test. Test fixtures remain isolated by UUID-prefixed names.
36. Keep the verified local API/web and synthetic PostgreSQL available for review; leave the worker stopped so the documented queue test commands remain deterministic. Start the capture-only worker when testing new registration/invitation mail. No production services are running or altered by this work.

37. Superseding decisions 4/10 about explicitly selected env files: at the user's request, all development processes now load the root `.env` automatically. `DB_CONNECTION` is the new platform database; `DATABASE_URL` remains legacy-only. Existing host environment values take precedence. No fallback between the database names is permitted. The root `.env` is ignored by Git and the setup examples are consolidated in `.env.example`.
38. Resolve API/worker `.env` relative to the config module's repository location, so pnpm's workspace working directories do not affect lookup. Web scripts preload that same file with dotenv. Next propagates Node startup arguments to its child workers, and the env-file option cannot be used in those workers' NODE_OPTIONS; the supported import preloader avoids that build failure. Omit NODE_ENV from the shared development file so Next can select development/build modes and production hosts can supply NODE_ENV explicitly. Build cache hashes include the root env file.

39. At the user’s request, pause MVP implementation for a separate five-palette application colour comparison. Keep content, system typography and layout identical so colour is judged fairly. Evergreen is a starting recommendation; no palette is approved or applied. Reuse the existing local photograph and Lucide icons, keep the comparison independent of API writes, and use restrained press feedback with reduced-motion support.

40. The user selected Harbour on 12 October 2026. Record its exact application palette in docs/design/design-guide.md, with semantic usage and recomputed contrast evidence. Keep couple-specific website/invitation palettes independent. This request documents the selection; applying shared app tokens remains a separate implementation step. The comparison’s original Evergreen recommendation is historical.

41. Resume the full PRD Must scope through R3; redesign within the user-approved Harbour palette. Taste applies to marketing composition; Apple/Emil/Impeccable apply to operational app usability. Preserve the original couple’s historical date and content on a distinct wedding route. No fabricated customer evidence or pricing will appear on marketing.
42. Use Raven Relay REST behind EmailPort, configured explicitly. Its queued acknowledgement gets a separate provider_queued state. Signed callbacks use original bytes, project matching and durable deduplication; submission retries retain the same key/body. Keep capture local and preserve legacy Maileroo until verified operational cutover. No real emails are authorised by provider selection alone.

43. Use self-hosted Source Serif 4 (SIL OFL via pinned Fontsource package) for marketing display typography and system sans for operational controls. Apply shared Harbour tokens to the app; preserve couple palette controls. Root marketing replaces the old root couple entry as explicitly requested; the original content and historical date move intact to /couples/adeola-and-joshua. Old legacy hostname-only links now reach marketing with a direct couple link; do not claim those root links still identify the couple.

## Private media continuation decisions

Use private filesystem/S3 storage through the existing port, with quota reservations covering originals and derivative headroom. Use bounded Sharp/HEIC/FFmpeg processing; production codec binaries remain configurable. Restrict planners and contributors to explicitly assigned albums. Preserve legacy font families with local licensed font packages. These reversible choices connect staff media now; guest grants and retention remain separate mandatory slices. The goal tracker reports blocked without a reason; this is not an implementation dependency, and work continues.

## Invitation continuation decisions

Use Royal elegance, Garden romance, Modern minimal and Photo story as the four MVP families. Use one React renderer at 480×672 logical size for both preview and browser export; embed licensed local fonts and approved photo bytes in snapshots, block browser network access, and preserve a written canonical website URL when QR is disabled. Give JPEG/PDF independent states and retry the original snapshot. Include durable actor/tenant-scoped operation keys for timeout retries. Retain Chromium's sandbox rather than disabling it to simplify deployment; production hosts must provide its runtime capabilities. Photo compact layouts use a smaller image region and a side-by-side footer to fit three events. Real-phone scans and Linux container execution remain verification gates, not presumed passes.

## Guest and RSVP continuation decisions

Use explicit household membership and owner-allocated attendee slots; groups do not grant access. Default private household grants to 180 days and guest sessions to seven days, with 16-character manual codes and fragment links. Limit pilot plus-one allocation to five per named guest; guests cannot increase it. Keep sensitive optional answers owner/co-owner-only while planners manage ordinary guest/status records. Default questions off. Publish private event facts into a separate projection and show those snapshots on RSVP; live capacity/deadline policy remains authoritative. Same-import household labels group new rows; existing households require explicit IDs. Suppress duplicate invitation sends per active grant/recipient and record queued delivery truthfully.

## Admission implementation decisions — 2026-10-12
- One attendee/event lineage retains a used admission permanently; corrections are audited and cannot reset entry. Reissue rotates credentials without reserving another seat.
- AES-GCM key ring binds payloads to wedding/pass IDs; active payloads are erased on use, revoke or expiry.
- Scanner retries retain the same operation UUID after an uncertain response and require explicit next-guest action. Offline rosters assist people but cannot authorise admission.
- Raven pass notices link to private guest access; undocumented attachment support is not invented. Delivery is blocked if pass version or requester authority changes.
- UUID inputs are normalised to lowercase so equivalent representations preserve tenant-bound encryption and idempotency.

## Guest uploads and invited audience — 2026-10-12
- Dedicated event/album upload grants expire within 180 days and issue one-day sessions; private RSVP access can issue upload sessions only for owner-enabled guest albums. No fake user accounts are created.
- Failed attempts count against per-session allowances to constrain abuse; rejected/expired media releases wedding storage quota. Owner approval and album publication remain separate.
- Guest media requires configurable private ClamAV scanning. Disabled/unavailable scanning fails closed, while other core workflows remain usable. Local official scanner checks were performed under AMD64 emulation because the stable image lacks ARM64 support.
- Valid household sessions grant invited journal/album access and only eligible published private events. Shared and upload credentials do not impersonate household identity.
- Separate API_PORT and WEB_PORT names prevent shared .env settings from making the standalone web process bind the API port; inherited deployment PORT remains supported.

## Creative planning — 2026-10-12
Owner approval binds concept/context revisions. Private source media makes brief export owner-only. UTC daily allowances reserve atomically; uncertain provider submissions retain credits with no automatic resubmission. Operator-configured estimates/model labels must match the reviewed quote. Missing optional AI credentials disable AI gracefully. Known colour/decor constraints have guards; arbitrary feasibility and cultural choices still require human review. Shared curated heading inheritance preserves explicit card overrides. Brief files retain original snapshots and substitute portable licensed serif fonts for system fonts. No paid provider verification has been performed.

## Retention and erasure — 2026-10-12
Use the PRD's proposed pilot policy, subject to confirmation before paid launch. Dated events anchor expiry; a known primary date provides an end-of-day fallback in the wedding timezone. Otherwise show creation-based provisional expiry and ninety-day reviews without automatic renewal. Support-led renewal is the remaining operator slice. Stream POSIX TAR with private resumable original copies; exclude unprocessed/unsafe originals and record omissions. Sensitive guest inclusion/download needs owner permission and recent authentication. Budget extra staging/temp disk beyond the live-media quota.

Keep deletion ledger storage outside rollback snapshots; use a separate S3 bucket in production. Startup quarantines deleted records before serving routes. Immediate deletion revokes scoped credentials; recovery restores data without restoring old credentials. Final erasure preserves only minimal deletion markers/hashed retired paths and removes identifying plaintext slugs. Account deletion requires ownership resolution and removes collaborator memberships. Keep encrypted rolling backups at most thirty days and operational audit details ninety days. Captured emails are erasable locally; provider/recipient copies cannot be promised erased, and unsupported provider effects are recorded. Complete real backup/restore and second-storage runtime checks next.

## Operator verification permissions
Automatic approval review rejected a persistent operator allowlist grant to the existing synthetic browser account, because the exact privileged grant was not specifically authorised. No grant was made. Verify backend role permissions through disposable test fixtures and visual layout through a development-only read-only synthetic route. That route returns 404 outside development and performs no service requests/actions. This does not replace a live authorised founder acceptance journey; it avoids changing existing account permissions while allowing the remaining engineering work to continue.

Notification retries use a fresh child attempt only after a definite failure and owner recipient review; uncertain outcomes never get a new attempt. Old queued private links without a resource reference fail closed. Previously submitted email cannot be recalled; access credentials are always validated at use. Harbour history remains a readable list with inline recipient review, not a delivery dashboard claiming attendance.

Credential hashing keeps existing HMAC bytes and adds an explicit-active, maximum-five-key ring. Rotation is a two-phase operator action, not an automatic change to `.env`. Long-lived shared-site grants require explicit replacement/re-sharing before their key is removed; retained backup and admission decryption keys remain separate recovery dependencies.
