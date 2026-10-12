# Notification operation

Configure the selected adapter in `.env` (complete variables in `.env.example` and external-verification runbook). Start API and worker independently. For local work use `EMAIL_ADAPTER=capture pnpm dev:worker`; never run a live adapter merely to verify the UI.

Owners use Email delivery in a workspace to refresh or load older attempts. Household/pass screens preview intended recipients before sending. Review a definite failed attempt before queuing a retry. A retry uses existing pass/grant context and a new provider attempt ID. Unknown means submission may have happened: do not send a new message to resolve uncertainty. Non-idempotent adapters need operator investigation; no automatic resend is allowed. Delivery reports require a configured signed callback. Capture and providers without callbacks remain accepted/unknown.

`DELIVERY_CONTEXT_MISSING` means an older queued private link has no current-resource reference. Issue a fresh current invitation or account verification/recovery link. Other stale-link errors require reviewing current grants, recipients, pass state, membership or retention dates. Existing saved website confirmations remain available regardless of email status.
