# Renderer3 Linux worker — 2026-10-14

Focused script scripts/verify-linux-fonts.mjs passed all four families with Work Sans bodies, accented/apostrophe names, photo/no-photo and single/compact layouts. Eight JPEG/PDF pairs: JPEG1500×2100 and QR decoded to the canonical URL; one-page PDF360×504pt; WorkSans embedded throughout and SourceSerif4 embedded for Modern Minimal. Modern Minimal/no-photo and Photo Story/photo JPEGs visually inspected with no clipping.

Environment: existing local Linux ARM64 Node22.23.3 worker image sha256:b206a8d6003c397fd40a51e5137f4a574c4a82819aac60575c1b78ca749f9a23. Current compiled adapters/templates and vendored fonts mounted read-only; no dependencies changed. Non-root, read-only container filesystem; bounded temporary filesystem. Actual output/report remain at /tmp/std-linux-fonts-0t969bs6/verification; report.json is retained here. This is a current-code adapter check, not a newly built production image.

Existing dedicated sandboxed browser reused. Docker hostname-alias WebSocket connection initially returned500; retry with the already verified numeric bridge succeeded. No sandbox flags weakened and no new browser launched. Browser endpoint configuration remains private outside Git. No unrelated media tests, full suite, email or AI calls ran. Physical two-phone QR acceptance remains unverified.
