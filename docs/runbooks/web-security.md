# Web response protections

All built web pages and the API gateway send no-referrer, nosniff, frame denial, and a CSP denying framing, base-URL replacement, object embeds and foreign form submission. Permissions policy permits same-origin scanner camera use and disables unused microphone/geolocation/payment/USB capabilities. Next version disclosure is disabled.

This is a restrictive document policy, not a nonce-based script CSP: Next hydration and the existing Chakra style runtime are not falsely claimed to have a strict script policy. React structured text rendering and schema-validated links remain the content boundary. Legacy supported video embeds remain usable.

TLS termination, HSTS, request limits and trusted client IP handling belong to the documented private-gateway deployment. Verify these on the actual reverse proxy before release; never trust arbitrary browser forwarding headers. For real client rate-limit attribution configure WEB_CLIENT_IP_HEADER and API_TRUSTED_PROXY_CIDRS as described below. The safe default attributes only the socket peer.

Run `PORT=3003 pnpm --filter @save-the-date/web start` after `pnpm build`, then `node --import tsx scripts/verify-web-headers.ts`. The check reads four local routes and saves exact policy headers to verification/security/web-headers.json. It is not a penetration test or browser/device acceptance substitute.

## Trusted client attribution

Keep both settings unset for direct/local development. With an actual ingress, set `WEB_CLIENT_IP_HEADER=x-verified-client-ip` on web and `API_TRUSTED_PROXY_CIDRS` to the exact web gateway IP/CIDR on API. The ingress must overwrite that header using the connection peer address, never append an incoming browser value. Restrict web to that ingress and API to its web gateway on a dedicated network. The gateway validates a single IPv4/IPv6 value, forwards only that value, and ignores ordinary browser X-Forwarded-For. Missing/multiple/malformed trusted values fail closed with503. API ignores forwarding unless its immediate peer is explicitly trusted. Never use trust-all or a broad shared-container subnet.

Example nginx ingress (adapt to your network): `proxy_set_header X-Verified-Client-IP $remote_addr;` and `proxy_pass http://private-web:3000;`. Add the actual fixed private-web address to API_TRUSTED_PROXY_CIDRS. Further upstream proxies need their own explicit overwrite/trust policy; do not copy an arbitrary outer header. Configuration rejects invalid addresses and zero-prefix networks. This follows [Express behind proxies](https://expressjs.com/en/guide/behind-proxies/).

Actual local API tests exercise default spoof denial and two separately attributed clients through an explicitly trusted disposable loopback gateway. The deployment ingress/network isolation and TLS still require the target environment check. No current runtime trust setting was enabled.
