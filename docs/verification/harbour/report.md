# Harbour redesign milestone

12 October 2026. Marketing root is distinct from the original couple homepage at `/couples/adeola-and-joshua`. Original date/copy are preserved; updates/media home navigation now points to the couple route. Platform wedding routes remain `/w/[slug]`. Changing the root route is explicitly requested; an old legacy link containing only the hostname will now show marketing, with a direct couple link. Future hostname moves still require redirects.

Shared Harbour tokens style the marketing and operational workspace. Source Serif 4 (self-hosted via Fontsource, SIL OFL) supplies marketing display type; the workspace uses system sans. No theme change is applied to couple websites.

Web production build, lint and web typecheck passed. Browser verified marketing-to-account navigation, persisted synthetic workspace/events, 360px document width matching viewport, local image loading, font family and preserved original couple content. Existing local browser session was authenticated; CTA handling also correctly selected registration when the API was unavailable, with a truthful service error. No real mail sent.

First screenshot round covered 1440px and 390px. Fresh Impeccable reviewer requested two fixes: remove the workspace eyebrow and remove an unimplemented policy-screen claim. Both fixed in one batch, rebuilt and recaptured at 1440px, 390px and 360px. Reviewer scored both resolved; ship disposition covers those fixes at this milestone's scope. Source/screenshots inspected; detector engine unavailable. Full screen-reader/device matrix remains an R3 gate.

Evidence: marketing-desktop/mobile/360.jpg and workspace-desktop/mobile/360.jpg. PRODUCT.md, DESIGN.md and .impeccable/design.json record current context and actual tokens. This report does not claim the MVP is complete.
