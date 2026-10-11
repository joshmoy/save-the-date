# ADR 002: publication and audience boundaries

Accepted, 12 October 2026, R1 connected slice.

Website edits use a versioned site draft; owner publication writes an immutable snapshot and active pointer in one transaction. Snapshot values include wedding calendar date/palette and public event facts. Private event facts and capacity/admission policy fields are excluded. Operational event updates remain authoritative in the API and do not mutate old public snapshots.

Two themes, Garden and Modern, share content and section ordering. Fonts are browser-provided sans or classic serif for this slice; licensed fixed font assets are a dependency of invitation rendering. Primary/body text colours must reach 4.5:1 against the background before website publication. Hero assets and blog attachments reject until the media safety path exists; this is explicitly unfinished scope.

Blog revisions publish separately from the website. Planner edits never overwrite the active published post. Old paths remain reserved and resolve to the current published slug. Unpublishing/deletion removes API/public access; responses use no-store. HTTPS links and escaped structured text prevent arbitrary script markup.

Website access codes are 32 random bytes. Their hashes and rotating generation live separately from staff credentials and future RSVP/upload/admission grants. An access exchange creates a seven-day opaque website session. Rotation invalidates issued sessions immediately. Invited-only posts are concealed until an authorised R2 guest session is available; shared site possession never substitutes for identity.

PostgreSQL DATE parsing returns ISO calendar strings to avoid process timezone shifts. UTC timestamps remain Date/ISO instants with IANA display zones.

HTTP routes are registered in Nest feature modules for identity, weddings, invitations and public views. Application code consumes operation ports; pg is confined to the persistence adapter. Continue narrowing the foundation application service as guest/media/design domains are added. OpenAPI generation and paginated projections remain engineering release work.
