# S01 section visibility — 2026-10-14

Found and fixed two rendered defects in the shared public/private-preview website component:

- An event existed but its section was disabled: the hero still linked to a missing #events target. The CTA now requires that section to be enabled.
- A registry URL without optional gifting prose disappeared. Gifting now renders for either value, omitting the empty paragraph.

Actual Chrome on the isolated local navigation database: published fixture contains an event, sections gifting/RSVP, empty gifting text and an example.test registry URL. The rendered DOM contains the correct registry link and no event CTA/navigation. At a configured360×800 viewport, document/body content widths both measured345px (scrollbar reserved); no horizontal overflow or unresolved fragment targets. Screenshot: section-visibility-mobile.png. Viewport reset and verification tab closed.

Focused web typecheck, changed-file lint and web production build passed. No export or complete test suite rerun. This proves these specific states, not the full browser/accessibility matrix. The fixture seed guards localhost/std_navigation_<uuid>_test and retains its checkpoint; application wedding data was not changed.
