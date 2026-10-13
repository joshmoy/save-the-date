# Portable worker and storage

Filesystem and S3 implement the same private StoragePort. Real conformance against a source-built local S3 server verifies streaming/multipart writes, paginated inventory, checksums, restored copies and deletion; SDK support alone is not sufficient evidence. Production provider acceptance remains a distinct gate.

Sandboxed browser execution is an explicit runtime capability. A worker may launch a local executable or connect to a dedicated private browser service. Each export uses an isolated context; worker disconnects preserve the daemon. No user's browser profile is used. Embedded data-only render fetch policy remains unchanged. Docker Desktop denied namespace creation; a Linux-worker/private-native-browser path passed real rendering. No sandbox disabling or privileged container mode is required by this supported alternative.

Generic images pin the Node base and lockfile. Development builds use available Debian browser/tools; production releases require retained apt snapshots/mirrors, selected package arguments, full renderer verification and an immutable image digest. Root secrets, local data and backups are excluded from the build context. API/worker share private storage and an independent deletion-ledger volume. A private ClamAV service is part of the full local profile.
