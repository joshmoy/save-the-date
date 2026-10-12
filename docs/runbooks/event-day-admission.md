# Event-day admission

Apply migrations first. Configure `ADMISSION_ENCRYPTION_KEYS` as a JSON map of key ID to base64-encoded 32-byte key; the first key seals new payloads and older keys remain available for decryption. Keep keys out of Git and include them in protected recovery configuration. Use independently running API and worker processes. Tickets use the same locally configured Chromium/fonts as invitation exports.

In Events, choose disabled, automatic after confirmation or owner-controlled pass policy. Scheduled events default to two hours before start through twelve hours after. A date to be confirmed requires an explicit admission window before enabling passes. Window/policy lock after the first admission. Capacity, cutoff and approval policy are authoritative immediately; website facts require publication.

Confirm each attendee before issue. Passes consume no additional capacity. Owner/co-owner can issue, revoke or reissue unused passes with reasons. Reissue invalidates the old code and keeps lineage. Ticket JPEG/PDF states are independent; failed generation can retry. Guest household sessions retrieve only their own current active tickets. Owners preview household recipients before queueing a pass-ready notice; recipients use their existing private RSVP access. Revoked/stale notices fail before delivery.

Security staff must accept an addressed workspace invitation and be assigned to the selected event. Open Entry scanner, check the persistent server status/event selection, then scan the labelled admission QR or type its ADM manual code. Camera requires HTTPS or a supported localhost context and explicit device permission. Website QRs/private RSVP codes are not passes.

Admit only after the server displays Admitted. Already admitted, revoked/expired, wrong event, outside window or invalid results mean do not admit. If the response is uncertain, do not admit yet; use Retry same scan to recover the original operation. A new scan returns already used after successful admission. Wait for Next guest before continuing.

If disconnected, restore connectivity. A minimal authorised printable list includes only names/operational identifiers/status. It is a separately coordinated human contingency and cannot guarantee single use across disconnected devices. Owner corrections retain the original admission and cannot provide re-entry. Intentional re-entry is Later.

Before event day verify camera/manual access, staff assignments, server/worker health, selected window, real-device QR readability, private ticket downloads and recent backup. Run `pnpm test` with isolated local TEST_DB_CONNECTION and TEST_INVITATION_BROWSER_PATH for the real file tests. Do not test against production passes or send real guest mail without authorisation.
