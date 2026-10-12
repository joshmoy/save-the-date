# Save The Date design guide

Harbour is the user-selected application colour scheme, approved on 12 October 2026. This guide records the design direction; applying these tokens to the application is a separate implementation step.

## Direction and scope

Clear and composed: deep blue actions, misty white backgrounds and pale blue supporting surfaces. Keep the interface calm during long planning sessions. Photography and thoughtful copy supply warmth.

Use Harbour for the planning application, workspace navigation, editors and administrative tools. Couples’ published websites and invitation designs retain their own chosen template colours. Never replace those designs with the application palette.

## Colour tokens

These values exactly match the approved Harbour option in the colour study.

| Token | HEX | Use |
| --- | --- | --- |
| `page` | `#F4F7FA` | Main application background |
| `surface` | `#FFFFFF` | Cards, dialogs, form fields and primary content surfaces |
| `soft` | `#E6EEF5` | Supporting panels and quiet grouped content |
| `ink` | `#243449` | Headings, body text and essential icons |
| `muted` | `#566779` | Secondary text, descriptions and metadata |
| `line` | `#D1DDE8` | Decorative dividers and subtle surface boundaries |
| `accent` | `#2F567C` | Primary actions, links, selected navigation text and focus rings |
| `hover` | `#244363` | Hover and pressed primary action background |
| `tint` | `#E4EDF5` | Selected navigation background and subtle accent areas |
| `successBg` | `#E8F2ED` | Success and published status background |
| `successInk` | `#32614B` | Success and published status text/icons |
| `warnBg` | `#FCF0DA` | Warning, draft and review status background |
| `warnInk` | `#795219` | Warning, draft and review status text/icons |
| `errorBg` | `#F9E8E7` | Error and failed-operation background |
| `errorInk` | `#983E37` | Error text, icons and invalid-field cues |

Primary buttons use white (`#FFFFFF`) labels on `accent` or `hover`. Secondary actions use `ink` or `accent` on `surface`. Use `accent` on `tint` for selected navigation. Concentrate saturated blue on actions and selection; large content areas stay light.

Use semantic colour pairs together. Accompany every status with explicit wording and, where helpful, an icon. A draft badge describes publication state; warnings about required action also explain the issue and the next step. Do not communicate status through colour alone.

## Accessibility and interaction

| Text / background | Measured contrast |
| --- | --- |
| `ink` / `page` | 11.75:1 |
| `muted` / `page` | 5.41:1 |
| `muted` / `soft` | 4.96:1 |
| White / `accent` | 7.66:1 |
| `accent` / `tint` | 6.46:1 |
| `successInk` / `successBg` | 6.23:1 |
| `warnInk` / `warnBg` | 6.14:1 |
| `errorInk` / `errorBg` | 5.76:1 |

Ratios were recomputed from the exact HEX tokens using WCAG relative luminance. These pairs exceed the 4.5:1 normal-text threshold; this is not a certification of the entire application.

Keep text opaque. Recheck contrast for new backgrounds, overlays, opacity and disabled states. The pale `line` token is decorative: use a stronger boundary such as `muted` where a control outline is required for identification. Use a visible 3px `accent` focus outline with separation from the component. Keep links recognisable beyond colour, and preserve keyboard focus through state changes.

Provide immediate, subtle press feedback; keep routine transitions around 140–200ms. Respect reduced-motion preferences. Loading, validation, failure, retry and conflict states must explain what happened without implying an operation succeeded before confirmation.

## Typography and composition

Use readable system typography (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif) for application chrome. Establish hierarchy with size, weight and spacing. Preserve full names and important details through wrapping on mobile. Keep layouts consistent and use depth sparingly for floating controls and dialogs.

The comparison held typography, layout, content and photography constant. Harbour approves the palette; it does not approve every illustrative dashboard component as a finished product design.

## Reference and rollout

See [the colour study](color-study.md) and `apps/web/public/color-schemes.html` for the original previews. The selected palette must become shared semantic tokens when implemented, rather than scattered hard-coded colours. Verify real application screens, responsive layouts, focus states and semantic statuses after rollout. Dark mode requires a separately designed and verified palette.
