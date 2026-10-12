# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Couples create and manage a wedding workspace with a partner and permitted collaborators. Guests view information, RSVP, retrieve optional passes and share memories. Planners edit drafts; assigned security staff admit attendees online. Operators support the service with audited access.

## Product Purpose

One living website per wedding and a separate invitation studio powered by shared wedding data. The full mandatory MVP scope is the PRD's R0–R3 requirements. Current completion evidence lives in docs/requirements-traceability.md; product goals are not claims that unfinished features work.

## Operating Context

Planning, ceremonies, wedding period and memories share one canonical wedding path. Website publication is explicit. Downloaded invitations are immutable snapshots. Core guest operations remain usable without optional AI. Existing wedding data and historical dates must be preserved.

## Capabilities and Constraints

Next.js web, authoritative NestJS API, independent worker, PostgreSQL reference adapter and explicit infrastructure ports. No paid AI, real guest email, public deployment or production mutation without authorisation. Later requirements E02–E05 are excluded. PRD and TRD in docs are authoritative.

## Brand Commitments

Save The Date. The user selected Harbour for application and marketing colours, documented in docs/design/design-guide.md. Couple website and invitation palettes remain separate. The root route becomes product marketing; the original couple homepage is retained on its own wedding route.

## Evidence on Hand

Existing Adeola and Joshua wedding content, photographs, updates and media. Local synthetic test weddings and verification captures. No customer testimonials, measured commercial benefits or pricing evidence may be fabricated.

## Product Principles

- Protect guest privacy and tenant isolation by default.
- Require explicit approval for publication and applied creative concepts.
- Make saved state and delivery truth understandable.
- Preserve historical content and stable wedding links.

## Accessibility & Inclusion

PRD targets WCAG 2.2 AA for public pages and core guest flows, keyboard operation, visible focus, reduced motion and text/icon scanner outcomes. English first, Unicode names and IANA timezones.
