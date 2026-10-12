# Private media processing and publication

Use the existing private storage port for filesystem and S3-compatible adapters. API-authorised upload intents reserve original plus derivative headroom transactionally; processed byte counts reconcile it. HTTP transfers accept the exact reserved size, limit two concurrent uploads per API instance and rate-limit actors. The current bounded transfer buffers up to 250 MiB per file; provision API memory accordingly. Worker processing is independent of request handling.

Use Sharp for JPEG/PNG/WebP, an isolated bounded worker thread for HEIC/HEIF conversion, and configurable FFmpeg/FFprobe processes for MP4/MOV. Preserve private originals. User-facing derivatives strip metadata; subprocess inputs are generated local paths and network protocols are disabled. Pin packages and retain licence notices. Production hosts can configure maintained codec binaries and must sandbox worker CPU/memory/disk.

Processing, moderation and album publication are separate. Owner/co-owner upload is an explicit owner-approved contribution; planner/contributor upload remains pending. Only an owner can approve/reject or change publication/audience. Planners and media contributors see assigned albums only; owner/co-owner retain wedding-wide access. Removing a contributor expires unfinished uploads, releases reservations and queues cleanup while retaining already processed owner-held media.

Public derivative reads pass through a no-store gateway that rechecks the wedding audience, album publication and asset approval. Originals require staff permissions. Rejected/deleted media and private albums cannot be fetched publicly; references show a readable fallback. Deletion is immediately logical and physical removal is durable queued work. Downloaded copies cannot be recalled.

Guest grants, invited-guest audience and complete retention/export remain the subsequent R2/R3 slices, not capabilities claimed by this milestone. Album cover/order/captions and media movement have explicit tenant/version checks. Source and record state remain API-authoritative.
