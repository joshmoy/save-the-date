# Derived website surfaces preserve text contrast

Date: 2026-10-14. Status: implemented and verified.

The Garden theme previously applied a fixed eight-percent accent tint behind normal-size primary text. A valid primary colour such as `#767676` against white met 4.5:1 on the base background but failed on the tinted surface.

Use the pure `@save-the-date/templates/website` resolver for publication and preview. It keeps the owner’s palette unchanged and chooses the largest whole-percent tint from 8 down to 0 that preserves primary-text contrast of at least 4.5:1. Modern retains the base background. Resolve to an exact hexadecimal colour so policy calculations and CSS paint use the same value.

The API captures versioned resolved surfaces in the immutable publication snapshot. The renderer uses that snapshot value, with the same resolver as a compatibility fallback for earlier publications and draft previews. No database migration or owner-colour rewrite is needed.

Tests independently check contrast at the boundary, common light/dark surfaces, retained full tint, publication persistence and separation from later draft changes. Actual Chrome computed styles measured 4.5422:1 for 20px text on the boundary fixture; 360px rendering had no overflow. This addresses this surface defect, not full WCAG conformance.
