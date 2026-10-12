# Guest uploads and invited content

Owners create dedicated upload access under Media library: choose an event, album, expiry (up to 180 days) and per-session file/byte limits. Save the code/link when shown; plaintext is not retained. Revoke removes future session access and stops unfinished worker publication. Valid private RSVP guests can open a one-day upload session for albums where the owner enabled guest uploads. Public website/shared-access and admission credentials never provide upload or RSVP authority.

Uploads reserve wedding bytes transactionally (including derivative headroom) and consume an attempt allowance per session to bound abuse. Expired/rejected media releases wedding storage reservations; failed attempts still count against the upload session. Originals remain private. Guest safety processing requires a private clamd service, then format/size/duration validation. Processed guest uploads remain pending until owner/co-owner approval. Album publication/audience still controls access independently.

Configure in root .env:
- MEDIA_MALWARE_ADAPTER=clamd
- CLAMD_HOST=<private scanner host>
- CLAMD_PORT=3310

Disabled/unreachable scanning rejects guest processing privately; staff core uploads remain usable. Keep clamd on a private network, update signed databases, monitor freshness/health, and bound CPU/memory/concurrency. Use StreamMaxLength and MaxFileSize at least 250M (pilot configuration 260M), MaxScanSize 512M, MaxThreads 2 and MaxQueue 4. Never expose the unauthenticated scanner publicly. Official images and protocol: [ClamAV Docker](https://docs.clamav.net/manual/Installing/Docker.html), [INSTREAM](https://docs.clamav.net/manual/Usage/ClamdProtocol.html).

Local verification used the official AMD64 image under emulation, digest sha256:638d90201ee7ee6a82d249a2fc23b132e578673b5f1f2766852b127676ca1ef6, ClamAV 1.5.4/database 28151 (2026-10-12). The local std-verification-clamd container is bounded to 2 GB/two CPUs and binds only 127.0.0.1:53310. Its configuration is /tmp/std-clamd.conf; ignored .env points to that port. Restart with docker start std-verification-clamd; stop with docker stop std-verification-clamd. Production must select a supported architecture and pin/revalidate its image digest.

Invited posts/albums require a current, unrevoked household session. Eligible private events come only from the immutable active publication. Grant rotation removes invited projections and media gateway access. Shared website access remains distinct from identity.
