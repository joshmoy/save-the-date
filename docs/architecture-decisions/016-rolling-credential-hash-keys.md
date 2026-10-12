# Credential hash key transition

Preserve legacy HMAC-SHA256 hash bytes. A validated explicit-active ring drives one active write hash and bounded candidate hashes for reads. Domain ports accept candidate digests, not SDKs or provider configuration. PostgreSQL uses indexed tenant-scoped `ANY` lookups for opaque identity, website, guest, upload and admission credentials. Revocation, expiry, role and eligibility checks still apply.

Scan operation outcomes accept a retained-key request digest during timeout retries. Household/pass email deduplication checks every retained-key recipient digest, preventing rotation from authorising a duplicate send. No database migration or stored plaintext is needed. Two-phase deployment installs readers first, then flips writers. Old keys remain a recovery dependency until credentials expire or are replaced; silently retiring long-lived shared grants is forbidden.
