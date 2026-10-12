# Admission authority and credential custody

Keep one attendee/event pass lineage, independent of capacity reservations. Issue only to confirmed eligible attendees; automatic issuance uses transactional commands. Rotating an unused pass replaces its hashes and encrypted credential payload, preserves lineage/history and creates new private ticket files. Used passes cannot become unused; owner corrections preserve the admission and record previous/corrected state and a reason.

Use AES-256-GCM with versioned key IDs and tenant/pass associated data. QR/manual credentials are separate from RSVP/upload credentials and absent from ordinary API projections/jobs/logs. Erase encrypted payloads on use, revoke or expiry. Ticket files are privately stored and authorised on every download. Pre-use attendee/event detail changes regenerate current tickets without reserving another seat; old downloaded copies cannot be recalled.

Serialise redemption/revocation with event locks and conditional pass transition. Keep a durable scan operation, request hash and outcome so retries after a lost response return the original result. Persist exactly one admission per lineage. The browser stops until the staff member acknowledges a result; an uncertain response requires retry of the same operation and never means admitted. There is no offline admission authority.

Generate a secure local key only in ignored .env; production must supply and back up its own key ring. Preserve old keys while active payloads depend on them. The local fault harness used for browser verification is outside the repository, guarded to the isolated _test database and drops only one synthetic response after commit. It is not a production feature.
