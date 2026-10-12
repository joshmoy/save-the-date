# Invitation exports

Run migrations with `pnpm db:migrate`. Start the API and web with `pnpm dev:api` and `pnpm dev:web`. Start a capture-only local worker with a compatible browser:

```sh
EMAIL_ADAPTER=capture INVITATION_BROWSER_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" pnpm dev:worker
```

Linux hosts use `INVITATION_BROWSER_PATH=/usr/bin/chromium`. `INVITATION_FONT_DIRECTORY` optionally selects the bundled versioned font assets directory; by default it resolves from the adapter package. Keep packages/templates/assets and its font licences/checksums in the production artifact and backup. The worker Docker target includes Chromium and FFmpeg. It runs as the non-root node user and does not disable the browser sandbox; the host must support sandboxed browser subprocesses. Pin the browser package/image used for a production release and record its version. Container browser execution and full restore remain release gates to rehearse.

The editor saves constrained drafts, previews current event data and queues separate JPEG/PDF jobs. Each output reports queued/processing/completed/failed. Overflow names the field to shorten or resize. Retry uses the original immutable snapshot. A changed event, wedding revision or design marks an older export stale; generate a new snapshot after reviewing a current preview. Downloads require current owner/co-owner/planner access. Removing access or deleting the wedding prevents downloads. Photos require approved processed assets and assigned album access.

JPEG: 1500×2100 pixels. PDF: one 360×504 point page with a clickable canonical website URL. QR encodes that same URL, with a black/white quiet zone. These exports make no CMYK/bleed claims. Downloaded files cannot be recalled.

Render verification requires `TEST_INVITATION_BROWSER_PATH` pointing to a local compatible browser, an isolated local `_test` database in `TEST_DB_CONNECTION`, and `pnpm test`. Without the browser variable, the real render test is explicitly skipped; it is not equivalent to full verification. `TEST_INVITATION_OUTPUT_DIRECTORY` optionally preserves generated samples in an existing directory. Tests inspect actual JPEG geometry/QR decoding and PDF pages/hyperlinks, accents, photo/no-photo and compact variants. Two real-phone QR scans remain a physical-device check.
