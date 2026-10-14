# 025 — Pinned invitation typography and renderer isolation

2026-10-14. Scope: I03/I04.

Invitation body typography now offers bundled Work Sans alongside Lora and Source Serif 4. An operating-system sans-serif cannot produce a portable immutable design: its metrics differ across hosts. Existing drafts retain their legacy value visibly, but require an explicit font choice, save and preview refresh before a fresh export. Completed downloads remain unchanged.

New snapshots use renderer version 2 and a versioned font manifest pinning the stylesheet and both WOFF/WOFF2 assets. Card typography explicitly isolates the observed workspace heading, paragraph and link styles. The preview and export continue to consume the same resolved design. Version 1 keeps its original stylesheet and rendering path for compatible queued snapshots; a legacy system-font snapshot fails with actionable guidance instead of silently changing its font.

Work Sans assets and their SIL Open Font License are vendored from the installed @fontsource/work-sans package. Font assets are recovery dependencies, not provider configuration.

Evidence: the latest disposable PostgreSQL suite passed 151 tests, zero skips; build and type checks passed all nine tasks; lint passed. Actual four-family JPEG/PDF checks include Work Sans, photographs, accented names, dimensions, embedded fonts, hyperlinks and decoded QR codes. A pixel checksum comparison proves the tested ambient typography rules do not change version-2 output. Integrity tests reject changed stylesheets, changed/unpinned font assets and legacy system fonts before browser access. The encrypted restore drill recovered 70 tables, 19 objects and 48 font/style/license assets. These checks do not establish physical-phone QR acceptance or a new Linux Work Sans matrix.

Verification policy: use focused checks after relevant changes. Reuse a dedicated render browser for further export checks where available; do not repeatedly launch the complete export matrix for unrelated edits.
