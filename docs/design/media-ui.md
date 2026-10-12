# Media UI extension

## Overview

This extension follows **Harbour**, documented in the root [DESIGN.md](../../DESIGN.md) and [.impeccable/design.json](../../.impeccable/design.json). Those files remain authoritative and unchanged by this record. The direction is **Operate**: a private staff media library with explicit workflow controls, followed by a wedding gallery that inherits the couple's existing template. This records the reviewed media UI scope, not complete MVP delivery; guest upload grants and invited guest sessions remain pending.

## Colors

The library reuses Harbour page, ink, muted, line and accent tokens from `apps/web/src/harbour.css`. White panels group work; misty media cards distinguish individual files. Accent blue marks actions and links. Existing success and error pairs carry confirmation and failure notices with readable text. No new palette or token vocabulary is introduced. The gallery and preview use the wedding's background, primary, secondary and accent values rather than replacing them with workspace blue.

## Typography

Operational copy and fields retain Harbour's system sans stack. Existing wedding template font choices remain intact. Self-hosted font assets support the original families; adding them does not establish a new type direction. File names wrap anywhere so long names remain visible. Status labels are text, not colour-only indicators.

## Layout

The library inherits the 1200px workspace container, 28px panels, two-column forms and 22px form gaps. Its media grid uses `repeat(auto-fill,minmax(240px,1fr))` with 24px gaps. Each media item has 16px padding and a 200px-tall image or video preview. At the existing 760px breakpoint, forms become one column, section actions stack, and panel padding reduces to 20px. Gallery figures use an auto-fit 240px minimum grid, 24px gaps and captions below the image. Images have a 4:3 gallery ratio; the shared viewer caps media height at 600px.

Desktop and mobile verification was supplied at 1440px and 360px. The narrow layout preserves labels, upload consent, status wording and controls without relying on a desktop table.

## Elevation & Depth

Existing borders, spacing and pale surfaces establish grouping. This extension adds no shadow scale. The private preview embeds the existing wedding surface within the workspace so staff can inspect its inherited appearance before publication.

## Shapes

Panels and media cards retain 12px corners; library thumbnails and fields use 8px corners. Controls retain their existing minimum heights and visible accent focus outline. Native disclosure markers keep editing affordances recognisable.

## Components

### Native forms and disclosures

Create-album and upload forms keep visible labels, native select/file inputs, required-field validation and a required permission checkbox. Native `details`/`summary` disclosures reveal album and media editing without a second dialog system. Chakra buttons and Lucide icons remain the established control vocabulary. Editing provides names, descriptions, ordering, cover selection, album moves, accessible descriptions and captions.

### Accessibility, captions and consent

Upload requires an accessible description separately from the optional caption. Images use the description as `alt`; videos use it as their accessible label and expose native playback controls. Gallery captions use `figcaption`. The permission checkbox states that the uploader has permission to share the media and understands review precedes publication. It does not replace moderation or audience controls.

### Processing, moderation and publication

These remain separate decisions. Transfer progress explicitly waits for confirmation; successful upload says the file is private and processing is queued. Processing status identifies queued, receiving, processing, ready and failed items. Approval makes ready media eligible; album publication and audience still control guest access. Hero and journal media selectors offer ready, approved assets and explain that the album must be published. Private draft preview uses authenticated workspace media URLs while retaining the guest template layout.

### Recovery and destructive actions

Library errors use an alert; confirmed actions and loading use status messages. Refresh gives an explicit recovery path. Processing failures explain the next action, including fresh supported exports, trimming a video, freeing storage or restarting an expired upload. Failed gallery media becomes an unavailable-media message while the surrounding story remains readable. Deletion presents the filename, warns about published references and requires a separate confirmation; its result distinguishes removed access from queued file deletion.

## Do's and Don'ts

- Keep processing, approval and publication visible as separate states.
- Preserve native keyboard behaviour, visible focus, semantic labels and existing reduced-motion handling.
- Use the existing wedding palette and typography in gallery and preview.
- Keep permission, accessible description and caption distinct.
- Do not equate a completed transfer with ready or published media.
- Do not describe guest grants or invited sessions as delivered by this UI milestone.

Verification evidence: [library desktop](../verification/media/library-desktop.jpg), [library mobile](../verification/media/library-mobile.jpg), [gallery desktop](../verification/media/gallery-desktop.jpg), [gallery mobile](../verification/media/gallery-mobile.jpg), [private preview desktop](../verification/media/private-preview-desktop.jpg), and [private preview mobile](../verification/media/private-preview-mobile.jpg). The finish review resolved two fixes and accepted shipment at fixes scope; the captures document that validated result rather than a new visual identity.
