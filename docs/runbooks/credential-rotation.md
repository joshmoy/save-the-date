# Rolling credential rotation

`TOKEN_HASH_KEYS` accepts the existing single secret or a JSON ring with an explicit active ID and up to five secrets, each at least 32 characters. Use cryptographically random secrets in mounted secrets or the server `.env`; never NEXT_PUBLIC variables. Example shape (values are explanatory placeholders):

```json
{"active":"previous","keys":{"previous":"existing secret preserved exactly","next":"new independent random secret"}}
```

1. Add the next key while leaving the previous key active. Deploy this complete ring to every API and worker process. Confirm all readers have both keys before changing the active ID.
2. Change `active` to `next` and roll every process. New grants and sessions use next; readers look up both. No stored plaintext is required and existing hash bytes remain compatible.
3. Retain previous while any valid long-lived credentials or retry outcomes depend on it. Identity sessions last seven days, member invitations seven days, verification 24 hours and reset 30 minutes. Guest/upload grants can last 180 days. Shared-site grants can remain valid indefinitely: explicitly rotate/re-share them before retiring their key. Reissue unused admission credentials only through normal policy; never reissue used passes. Keep keys required by retained encrypted backups under the recovery policy.
4. Remove previous only after expiry, replacement and recovery inventory review. Removing it immediately makes its remaining credentials unresolvable. Test the complete transition with `tests/key-rotation.test.ts` before a real rollout.

A key compromise requires incident-led revocation rather than a routine rolling transition. Hash-key rotation does not rotate admission encryption keys or Raven webhook secrets. Admission uses its separate versioned AES-GCM ring; keep retired decryption keys while unused encrypted passes or recoverable backups need them. Coordinate webhook secret changes with Raven's supported callback configuration; do not assume multiple signing secrets are supported.

The application never automatically modifies secrets. Restart processes after changing server configuration. Briefly resetting IP-based rate-limit hash buckets is an operational consequence; tenant/action limits retain their stable identifiers.
