# Raven Relay email

The platform worker supports Raven Relay through `EmailPort`. Legacy wedding email remains on its existing writer until operational migration is verified. Local development uses capture email and never contacts Raven Relay.

Configure the root `.env` for an authorised external check:

```dotenv
EMAIL_ADAPTER=ravenrelay
EMAIL_FROM=hello@your-exact-verified-domain.com
RAVENRELAY_API_URL=https://api-production-1c6a.up.railway.app
RAVENRELAY_API_KEY=your-project-scoped-key
RAVENRELAY_PROJECT_ID=your-project-id
RAVENRELAY_WEBHOOK_SECRET=your-endpoint-signing-secret
```

The project ID and webhook secret must belong to that key's project. Production requires an activated workspace, verified sending domain, live key, HTTPS public origin and the normal deployment policies. Development keys restrict recipient domains; they can still send real mail. Do not use provider/backend master encryption keys as webhook secrets.

Register `https://YOUR_PUBLIC_HOST/api/v1/provider-events/ravenrelay` as a direct reverse-proxy route to the API. Subscribe to sent, delivered, bounced, complained, rejected, failed, delayed and suppressed events. Do not send the callback through the browser session gateway. The API validates the original body HMAC, five-minute timestamp tolerance, event ID, project ID and event/status schema before durable inbox commit.

## Delivery truth and retry

Raven Relay's HTTP 202 queued response maps to `provider_queued`, not provider accepted or delivered. `email.sent` maps to accepted; `email.delivered` maps to delivered. Bounce/complaint outcomes remain authoritative despite late delivery events. Suppression is a failure to send. Delivery denotes receiving-server acceptance, not inbox placement or reading.

Each application message ID is the provider idempotency key. Network failure, malformed acknowledgement, 429 and server errors retry the identical payload with that key, up to the queue limit. Conflicts and validation/authentication errors fail without automatic resubmission. A provider `delivery_unknown` event stays unknown; do not create a new message to retry it without checking provider outcomes. Keep the sender and provider configuration stable while pending messages retry. Explicit provider migration requires reconciling pending and uncertain sends first.

Callbacks may precede acknowledgement: inbox records wait for the provider ID association and then reconcile. Duplicate events are ignored durably; older acceptance cannot downgrade delivery. Messages contain one recipient, so callback recipient matching applies to that exact message.

## Verification and recovery

`tests/email-provider.test.ts` covers synthetic adapter requests, stable keys, suppression, retry classification, HMAC tampering/expiry/project isolation, duplicate/out-of-order events, acknowledgement races and raw-body HTTP routing. No real sends are needed.

External verification remains outstanding: confirm the selected sender/domain/project, webhook routing over HTTPS, a controlled send to an authorised mailbox, delivery/bounce events and key rotation. This requires explicit send authorisation. Inspect metadata in Raven Relay's dashboard without automatically resending unknown deliveries. Include `std_provider_inbox` and `std_email_messages` in database backup/restore; preserving these prevents replay and loss of delivery history.

Contract source: [Raven Relay integration documentation](https://docs.ravenrelay.joshlab.site/markdown/integration-guide.md), checked 12 October 2026. API endpoint is configurable; the domain never depends on its hosting platform.
