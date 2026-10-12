# Staff media verification — 12 October 2026

31 PostgreSQL/API/adapter tests passed with no skips. The suite used only the isolated local std_test database. It covers cross-tenant concealment, assigned-album roles, revoked worker permissions, quota races/expiry, duplicate upload completion, format spoofing, metadata removal, ordering/cover/movement invariants, moderation/publication boundaries and authenticated raw HTTP upload/download/range access. Actual HEIC conversion used the separately obtained fixture documented in the processing runbook. Real synthetic MP4 processing produced a playable derivative and poster.

Rendered desktop (1440px) and mobile (360px) staff library, published gallery and private preview captures are in this directory. Browser upload used an existing repository photograph in a synthetic wedding. Private-album public access returned 404; publishing exposed only the processed derivative. Review fixes connected the private gallery preview and actionable failed-upload copy. No real guest notification was sent.

This verifies the staff media vertical slice, not complete M01–M05 or R3. Guest grants, invited audience, retention/export, antivirus/production worker sandbox validation, two-storage verification and the final device/load/recovery gates remain unfinished. Original private files are never exposed through public routes.

Final production build: 8/8 packages passed. ESLint and web TypeScript checks passed.
