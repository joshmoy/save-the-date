# R3 pilot acceptance

Local checkpoint: ad7648b;155 tests passed/no skips, build/lint/type checks and fresh Compose smoke passed. This runbook collects missing evidence; it does not waive or claim a release gate. Current gaps: ../verification/release-gates.md.

Use synthetic data on an isolated local/staging workspace. Keep email captured and AI disabled unless a human explicitly authorises the specific live check. Do not use real guests or production records for usability tasks.

## Owner copy review

Review marketing, registration/recovery, workspace invitations, website/privacy explanations, RSVP confirmation, admission uncertainty, guest-upload consent/moderation, AI approval, archives/retention and support. Record reviewed commit, pages, reviewer, date and corrections. Approval must come from the owner; a model review is separate.

## Independent couple tasks

Provide the application and ordinary onboarding, without facilitator rescue:

1. Create a workspace, add an event with an explicit timezone and publish a website. Confirm a later draft is not public.
2. Customise and export a card; change the website and explain why the downloaded card stays unchanged.
3. Add a household with a plus-one and event eligibility; submit its private RSVP and find the saved result.
4. Upload a memory; demonstrate that pending content is private and approval/publication are separate.
5. Create and approve a manual concept/brief with AI disabled; locate archive and support controls.

Record participant pseudonym, device/browser version, task success, elapsed time, assistance, errors and unresolved defects. Preserve failures. Independent completion target is80%; activation target is60% within seven days, with actual numerator/denominator and sample size. These pilot targets are not population claims.

## Devices, accessibility and event day

Use recent iOS Safari/Android Chrome for RSVP, photo upload and scanning, and desktop Chrome/Safari/Edge/Firefox for dashboard/editor. Record exact versions and tested cases. Check keyboard order/focus, descriptive labels, readable errors/statuses,200% text zoom, reduced motion, screen-reader navigation and contrast. Scoped automated checks do not establish full WCAG2.2AA.

Scan the exported QR samples from every invitation family on at least two physical phones; verify the expected stable wedding URL. For admission, use synthetic passes: success, already used, wrong event, revoked, denied camera permission/manual entry, loss of connectivity and retry after an uncertain response. Never admit offline.

Measure public LCP on an explicitly recorded mobile/network/cache/profile using supported tooling. Record raw runs, sample size and p75; target below2.5s. API timings are separate evidence.

## Planner handoff

Five human planners independently review a selected approved PDF/JSON revision and identify approved decisions, unresolved choices and source/provenance. Record minor/major edits and usefulness. At least three of five should judge it useful with only minor edits. Do not substitute model-generated opinions for planners.

## Authorised external checks

Before live email/AI checks record explicit authorisation, recipient/test workspace, limits and provider configuration. Follow raven-relay.md/notifications.md and creative-planning.md; use intended test recipients only. Record truthful delivery/provider failure states. Never paste secrets into evidence.

Production certificate/network controls, retained image/package versions, runtime findings, backup failure domains and measured RPO/RTO require the actual deployment environment. Follow deployment.md and migrations-recovery.md. Publishing/deployment remains separately authorised. Authenticated operator UI checks require an already authorised operator identity; do not grant privileges just to obtain a screenshot.

## Evidence record

For each case record:

- Requirement/gate, reviewed commit and environment.
- Human reviewer or operator pseudonym, date and device/tool version.
- Exact steps, expected result, observed result and pass/fail/blocked.
- Redacted screenshot/artifact/checksum references.
- Defect, correction and focused recheck, or the exact remaining blocker.

Keep personal contact details, private answers, tokens, browser endpoints and provider secrets out of committed records. Update requirements-traceability.md only from actual results. R3 stays unaccepted until its mandatory gates have evidence.
