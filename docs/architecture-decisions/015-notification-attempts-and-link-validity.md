# Email attempts and current access

Each application message has a durable ID used for provider idempotency. Definite failed messages may have one explicit child attempt after the owner reviews its recipient. Repeating the action key returns that child; a fresh action cannot duplicate it. Retrying a failed child remains possible. Accepted, unknown, bounced, delayed and complained attempts cannot be explicitly resent. Provider uncertainty retries retain the same ID, only for adapters advertising idempotency; no new pass is issued.

Owner-only paginated history excludes body, credentials and provider IDs. Account, membership, guest grant, pass and retention notices bind to their current resource. Workers recheck validity and permissions immediately before submission; retries check too. Older sensitive queued messages lacking a resource reference fail closed and require a fresh notification. Already-submitted emails cannot be recalled. Revocation racing an external send remains subject to that boundary; credentials are checked authoritatively when used.

Raven callbacks consume bounded raw bytes before JSON parsing or signature acceptance. Durable delivery reports remain authoritative and terminal bounce/complaint outcomes cannot be overwritten by a submission error. Capture-only testing never claims real delivery.
