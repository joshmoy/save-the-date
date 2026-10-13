# Storage portability verification

Filesystem and S3 are explicit adapters. Changing PostgreSQL engines requires another supported adapter/migrations/invariant suite. S3 compatibility is verified against a real local server, not inferred from an SDK or mocked transport; production provider smoke checks remain separately authorised.

The local-only service builds from [upstream patched source](https://github.com/minio/minio/releases/tag/RELEASE.2025-10-15T17-29-55Z). Upstream is archived, so this fixture is not a production recommendation. Source and AGPL licence remain available upstream; the repository contains its build recipe, not redistributed vendor source or binaries.

```sh
docker build -f infra/verification/Dockerfile.s3 -t save-the-date:s3-verification .
# Prepare a private env file containing MINIO_ROOT_USER and a random MINIO_ROOT_PASSWORD.
docker run -d --name std-s3-verification --cpus=2 --memory=1g \
  --env-file /path/to/private-test.env -p 127.0.0.1:59000:9000 \
  save-the-date:s3-verification server /data --address :9000 --certs-dir /data/certs
```

Set TEST_S3_ENDPOINT=http://127.0.0.1:59000, TEST_S3_ACCESS_KEY_ID and TEST_S3_SECRET_ACCESS_KEY in the shell or root `.env`, then `pnpm exec tsx scripts/verify-storage.ts`. The script requires localhost and creates/removes only its unique `std-verification-` bucket. It proves anonymous 403, bytes/checksums/content types, 70 MiB multipart streaming, 1007-key pagination, failed-source cleanup, verified copies/restore and repeated deletion. No guest data is involved.

Production buckets must deny public reads/listing, use least-privilege credentials and TLS, and have an independent recoverable copy/version policy. API downloads recheck current permissions. The deletion ledger needs a separate private bucket outside database/object rollback. Temporary spool storage must fit the largest streaming object; worker memory/disk/resource limits remain operational requirements.
