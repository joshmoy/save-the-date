# Web response protections

All built web pages and the API gateway send no-referrer, nosniff, frame denial, and a CSP denying framing, base-URL replacement, object embeds and foreign form submission. Permissions policy permits same-origin scanner camera use and disables unused microphone/geolocation/payment/USB capabilities. Next version disclosure is disabled.

This is a restrictive document policy, not a nonce-based script CSP: Next hydration and the existing Chakra style runtime are not falsely claimed to have a strict script policy. React structured text rendering and schema-validated links remain the content boundary. Legacy supported video embeds remain usable.

TLS termination, HSTS, request limits and trusted client IP handling belong to the documented private-gateway deployment. Verify these on the actual reverse proxy before release; never trust arbitrary browser forwarding headers. Current gateway rate-limit attribution is shared at its peer until explicit trusted-client handling is configured; this remains an engineering release item.

Run `PORT=3003 pnpm --filter @save-the-date/web start` after `pnpm build`, then `node --import tsx scripts/verify-web-headers.ts`. The check reads four local routes and saves exact policy headers to verification/security/web-headers.json. It is not a penetration test or browser/device acceptance substitute.
