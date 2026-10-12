# Raven Relay email adapter

The user selected Raven Relay on 12 October 2026. Add it behind the existing email port and retain capture for offline development/tests. Preserve the useful legacy adapter during the transition; no legacy data or sending path is switched silently.

Use documented REST requests rather than an additional SDK. Stable message IDs supply provider submission idempotency. Separate provider queue acceptance from delivery-provider acceptance. Verify raw-body signed events and commit a durable, deduplicated inbox; reconcile events racing the submission acknowledgement. Hard bounce/complaint statuses survive late delivery. One application message has one recipient.

Production credentials and controlled mailbox checks are external verification, not a reason to leave the adapter disconnected. No real mail is sent during implementation. See the Raven Relay runbook for configuration, failure states and recovery.
