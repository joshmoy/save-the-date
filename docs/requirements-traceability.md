# Requirements traceability

Every mandatory PRD identifier is listed individually. Foundation evidence does not claim the complete requirement across later dependent slices. No mocked production capability is complete.

| ID | Requirement | Release | Status | Implementation | Evidence |
|---|---|---|---|---|---|
| W01 | Accounts and workspace creation | R0 | Implemented foundation | contracts/domain/persistence; apps/api; apps/web/app/platform | 16 PostgreSQL/API tests; browser and R0 restore reports |
| S01 | Themes and content sections | R1 | Partial; two themes and sections; processed hero/media pending | contracts + persistence/publication + web publishing/site | Theme-preservation and contrast tests; desktop/360px screenshots |
| B01 | Editable posts | R1 | Partial; rich text done; photo/video attachments pending | post contracts + publication adapter + journal editor | XSS/link tests; rendered escaped article |
| I01 | Versioned template catalogue | R1 | Pending | — | — |
| G01 | Guest records and households | R2 | Pending | — | — |
| R01 | Event responses | R2 | Pending | — | — |
| P01 | Optional pass policy | R2 | Pending | — | — |
| M01 | Albums and media | R2 | Pending | — | — |
| A01 | Wedding context and consent | R3 | Pending | — | — |
| N01 | Email | R3 | Partial email transport only | packages/adapters; persistence/jobs; worker | Capture/idempotency/uncertainty tests; remaining notifications pending |
| O01 | Support and moderation | R3 | Pending | — | — |
| W02 | Events and memberships | R0 | Implemented foundation | contracts/domain/persistence; apps/api; apps/web/app/platform | 16 PostgreSQL/API tests; browser and R0 restore reports |
| W03 | Stable URL and lifecycle | R0 | Partial; canonical published path works; expiry/redirect operations pending | API publication + /w/[slug] | Stable slug/lifecycle tests; rendered canonical site |
| W04 | Membership and destructive actions | R0 | Implemented foundation | contracts/domain/persistence; apps/api; apps/web/app/platform | 16 PostgreSQL/API tests; browser and R0 restore reports |
| S02 | Draft and published versions | R1 | Partial; immutable revisions implemented; invitation stale warnings pending | site_drafts/publications + publishing UI | Version conflicts and planner/public isolation tests |
| S03 | Privacy and visibility | R1 | Partial; shared/public access done; guest-specific audience pending | shared grants/sessions + public projection | Rotation and private event/post concealment tests |
| B02 | Publication and browsing | R1 | Implemented core publication; invited audience depends on R2 | posts + permanent paths + public journal routes | Planner/owner publication; aliases; unpublish/delete tests |
| B03 | Media failure and optional story view | R1 | Pending media fallback verification | Text-only article route | Readable article verified; attachment failures not yet implemented |
| I02 | Granular customisation | R1 | Pending | — | — |
| I03 | Preview validation | R1 | Pending | — | — |
| I04 | JPEG and PDF export | R1 | Pending | — | — |
| I05 | URL QR and invitation semantics | R1 | Pending | — | — |
| I06 | Editing and future batches | R1 | Pending | — | — |
| G02 | Import and export | R2 | Pending | — | — |
| G03 | Invitation access | R2 | Pending | — | — |
| R02 | Plus ones and changes | R2 | Pending | — | — |
| R03 | Capacity and approval | R2 | Pending | — | — |
| R04 | Confirmation and dashboard | R2 | Pending | — | — |
| P02 | Revocation and reissue | R2 | Pending | — | — |
| P03 | Online redemption | R2 | Pending | — | — |
| P04 | Connectivity and staff experience | R2 | Pending | — | — |
| M02 | Quotas and processing | R2 | Pending | — | — |
| M03 | Guest upload grants | R2 | Pending | — | — |
| M04 | Moderation and visibility | R2 | Pending | — | — |
| M05 | Memories archive and deletion | R3 | Pending | — | — |
| A02 | Concepts and planning help | R3 | Pending | — | — |
| A03 | Mood boards | R3 | Pending | — | — |
| A04 | Approval and theme application | R3 | Pending | — | — |
| A05 | Planner handoff | R3 | Pending | — | — |
| N02 | Delivery states | R3 | Partial email transport only | packages/adapters; persistence/jobs; worker | Capture/idempotency/uncertainty tests; remaining notifications pending |
| O02 | Account data and recovery | R3 | Partial; workspace recovery foundation; exports/erasure pending | foundation repository + recovery UI | Ownership/reauth/deletion/restore tests |
| O03 | Measurement | R3 | Pending | — | — |

Cross-cutting R3 gates pending: full mobile/browser/a11y matrix, load/security/dependency review, two-storage demonstration, all-template export/QR inspection, complete media/pass/deletion restore and provider smoke checks. Native builds and R0 database restore passed; R0 Linux API container build/readiness passed. Expanded R1 web/worker compose rehearsal remains pending.
