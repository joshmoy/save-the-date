# Operator support

Set `OPERATOR_USER_IDS` to explicitly authorised verified account UUIDs in `.env`; empty disables operator access. Set `SUPPORT_EMAIL` to a monitored address. `/support` stores reports; it does not send mail or guarantee response times. `/operator` requires an authorised session. Never grant operator permissions to a wedding collaborator merely because they own a workspace.

Review submitted reports, obtain a specific reason, then use versioned service controls. Public holds affect the published website; private RSVP and entry remain usable. Inspect only a specific processed file through the temporary audited grant. Renew only after confirming the retention arrangement; erasure cannot be reversed. Account recovery requires independent ownership verification and recent authentication. Recovery does not reinstate memberships or old guest credentials.

Use `pnpm db:migrate` before starting API/worker. Migrations 020–021 add operational controls, metrics and token creation timestamps. Restore with the current independent deletion ledger before exposing the API. Do not roll back that ledger with database backups.
