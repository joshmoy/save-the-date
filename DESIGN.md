---
name: Save The Date — Harbour
description: Clear, composed wedding planning with an editorial marketing voice.
colors:
  page: "#F4F7FA"
  surface: "#FFFFFF"
  soft: "#E6EEF5"
  ink: "#243449"
  muted: "#566779"
  line: "#D1DDE8"
  accent: "#2F567C"
  hover: "#244363"
  tint: "#E4EDF5"
  success-bg: "#E8F2ED"
  success-ink: "#32614B"
  warn-bg: "#FCF0DA"
  warn-ink: "#795219"
  error-bg: "#F9E8E7"
  error-ink: "#983E37"
typography:
  display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(46px, 5.8vw, 78px)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-.025em"
  headline:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(32px, 3.5vw, 46px)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-.025em"
  workspace-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(34px, 4.5vw, 58px)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-.025em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "16px"
    lineHeight: 1.7
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 600
rounded:
  control: "8px"
  surface: "12px"
  photograph: "16px"
spacing:
  small: "8px"
  action-gap: "12px"
  label-gap: "8px"
  form-gap: "20px"
  grid-gap: "22px"
  panel-padding: "28px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "13px 22px"
    height: "50px"
  button-primary-hover:
    backgroundColor: "{colors.hover}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.surface}"
    padding: "28px"
  navigation-selected:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.accent}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
---

# Design System: Save The Date — Harbour

## Overview

**Creative North Star: "Harbour"**

Harbour is clear and composed: deep blue actions, misty backgrounds and pale blue supporting surfaces. Authentic wedding photography and an editorial serif supply warmth; the workspace stays readable and efficient with system typography.

This is a record of the implemented marketing and workspace milestone, not a claim of complete MVP delivery. Couple websites and invitation designs keep their chosen template palettes.

**Key Characteristics:**
- Light, composed surfaces.
- Editorial marketing; operational workspace.
- Authentic photography and restrained action feedback.

The user approved Harbour and delegated implementation choices. This record follows the current code; no separate visual comp was approved. See [design guide](docs/design/design-guide.md), [surface brief](docs/design/marketing-and-workspace-brief.md) and [verification captures](docs/verification/harbour/). Source tokens live in `apps/web/src/harbour.css`; component details live in the marketing and platform CSS modules.

## Colors

### Primary
Deep harbour blue (`accent`) identifies actions, links, selected text, focus and carets. `hover` deepens primary actions on hover. `tint` supports selection without filling the screen with saturated blue.

### Neutral
Misty `page`, white `surface` and pale `soft` distinguish the canvas, content and supporting groups. `ink` carries primary information; `muted` carries readable secondary information. `line` supplies decorative borders and dividers.

### Semantic
The success, warning and error background/ink pairs are status roles, not decorative accents. Status wording remains necessary. The exact approved values are normative in the frontmatter.

**The Action Colour Rule.** Concentrate saturated blue on actions and selection; large content areas stay light.

## Typography

Marketing display uses Source Serif 4 with Georgia/serif fallback; the font is self-hosted under SIL Open Font License. Workspace and body copy use the system sans stack. Marketing headings balance their line breaks; long workspace titles can wrap anywhere to prevent overflow.

Display and headline roles follow the frontmatter. Marketing hero copy uses 18px/1.65 with a 35ch measure; story copy uses the body role with a 47ch measure. Workspace paragraph measure is at most 65ch with 1.6 line height. Workspace secondary headings use 23px and weight 600; labels use the frontmatter label role. At the mobile breakpoint, marketing display is 52px and headlines are 34px; workspace listing titles reduce to 34px.

**The Two Voices Rule.** Use serif display for marketing storytelling and system sans for operational work.

## Layout

Marketing sections share a 1400px maximum width with fluid horizontal padding (`clamp(24px, 5vw, 80px)`). The hero pairs copy and photography in a 1:1.08 grid; subsequent editorial sections use asymmetric two-column grids. The workspace content is capped at 1200px with 48px 32px 80px padding; forms and events use two columns, with grouped panels and 20–22px form gaps.

At 760px and below, marketing and workspace grids become one column. Marketing navigation retains the sign-in link; workspace title rows and section actions stack, tabs wrap and member/error rows wrap. Workspace content becomes 30px 20px 55px and panels use 20px padding. Marketing photography becomes 360px tall. Preserve full names and important details. Existing verification covers desktop, 390px and 360px views.

## Elevation & Depth

The documented surfaces use no box shadows. White and pale blue layers, one-pixel dividers and spacing establish depth. Photography supplies visual richness. Native Chakra overlays may use their own component defaults; do not infer a new Harbour shadow scale from them.

**The Quiet Surface Rule.** Establish hierarchy with tone, spacing and borders before adding elevation.

## Shapes

Controls and selected navigation have gently curved corners (8px); content panels use 12px and the marketing photo uses 16px. Workspace primary buttons currently use 12px as a local variant. These are the observed shapes, not a requirement that every component share one radius. Use muted-colour field borders for identification and line-colour surface borders for grouping.

## Components

### Buttons
Primary marketing actions use the frontmatter variant, a 16px icon gap and 15px semibold labels. Their mobile minimum height is 48px. Workspace buttons have a 44px minimum height; primary labels are 14px with the local 12px radius. Blue darkens on hover; presses scale to .98. Background and press transitions use 140ms ease. Disabled workspace buttons use .6 opacity and a not-allowed cursor. Preserve native Chakra controls and Lucide icons.

### Inputs / Fields
Opaque white fields use muted one-pixel borders, ink text, 15px system type and a 46px minimum height for text inputs/selects. Labels remain visible above controls with an 8px gap. Textareas resize vertically. Accent carets and checkbox marks connect field interaction to the action colour.

### Cards / Containers
White panels and event cards use line borders, surface corners and 28px internal padding. Wedding rows use 25px padding and a minimum 125px height; their border strengthens on hover. Supporting blocks and empty states use soft backgrounds. Preserve explicit loading, error, retry and publication state copy.

### Navigation
Workspace tabs use 10px 18px padding, 8px corners and a 44px minimum height. Active tabs combine accent text, semibold weight and tint background; hover uses soft. The tab row wraps on narrow screens. Marketing links gain underlines on hover; text links remain recognisable beyond colour.

### Focus and motion
Marketing focus uses a 3px accent outline with 5px offset; workspace uses 4px offset. Routine field border/background transitions are 150ms; action feedback is 140ms. Reduced motion removes transitions and press transforms. Marketing FAQ uses native details/summary with a 44px summary target, preserving keyboard and disclosure behaviour.

## Do's and Don'ts

### Do:
- Do use shared Harbour tokens for application and marketing surfaces.
- Do pair semantic status colours with explicit text and meaningful icons.
- Do retain visible keyboard focus and reduced-motion behaviour.
- Do keep couple website and invitation palettes independent.

### Don't:
- Don't introduce another control or icon system alongside Chakra and Lucide.
- Don't use the pale line token as the only identifying boundary of a field.
- Don't imply that a save, publication or delivery succeeded before confirmation.
- Don't fabricate testimonials, pricing or measured benefits.
