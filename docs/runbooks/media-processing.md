# Private media operations

Run the API, web and worker separately after `pnpm db:migrate` and `pnpm build`. Local development:

```sh
pnpm dev:api
pnpm dev:web
EMAIL_ADAPTER=capture pnpm dev:worker
```

The override guarantees local review work cannot send real email. Stop the worker before database queue tests. All processes use the root `.env`; `DB_CONNECTION` is independent of the legacy database.

## Storage and limits

Filesystem: `STORAGE_ADAPTER=filesystem`, absolute durable `STORAGE_ROOT`, and a logical `STORAGE_NAMESPACE`. API/worker must share the same filesystem volume. S3: select `STORAGE_ADAPTER=s3` and set `S3_BUCKET`, `S3_ENDPOINT` when applicable, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`. Keep the bucket private; the API grants all downloads. Do not substitute public vendor URLs for logical object keys.

`MEDIA_STORAGE_BYTES` defaults to 10 GiB per newly initialised wedding allowance. Existing allowance records are authoritative. Pilot per-file limits: photographs 25 MiB; videos 250 MiB and five minutes. Originals and all derivatives count. Intents expire after thirty minutes, with periodic worker cleanup. Two uploads run per API instance, twenty requests per actor per hour. Current transfers buffer bounded bytes; provision at least 2 GiB API memory when allowing the maximum concurrent videos, then load-test the actual profile. No client-side quota value grants capacity.

## Worker runtime

Sharp, HEIC converter and packaged codec versions are locked. The worker supports JPEG, PNG, WebP, HEIC/HEIF and MP4/MOV; unsupported or corrupt input produces a visible failure. HEIC conversion has a thirty-second isolated-thread limit. Video probing has fifteen seconds; conversion has three minutes. Image decoding is limited to forty million pixels. Worker concurrency is one job per process with heartbeat leases. Use CPU/memory limits, adequate scratch disk and durable storage; large jobs are never placed in request functions.

Set `MEDIA_FFMPEG_PATH` and `MEDIA_FFPROBE_PATH` to maintained executable paths on a production host. Verify codecs, license notices and native-binary security separately from npm advisories. Packaged macOS verification used FFmpeg 6.0 and FFprobe 4.4; do not treat that local fixture as a production binary security approval. HEIC worker code ships in adapters/dist with its dependencies.

## Failed processing and deletion

Inspect private status/error metadata through the media library; never expose originals or keys in logs. Invalid media releases quota and deletes quarantine/partial derivatives. The UI recommends re-exporting/re-uploading a supported copy. Expired intents and revoked-member unfinished uploads queue durable cleanup. A revoked worker lease cannot commit results; each lease writes separate temporary derivative keys. Repair exhausted cleanup jobs only after checking the asset's authoritative state.

Owner deletion removes gateway access immediately and queues original/derivative removal. Published references require an explicit warning. Album unpublish and moderation rejection remove public reads immediately; already downloaded copies are outside revocation. Restore must include database rows, object keys/checksums and deletion tombstones, with the R3 full recovery drill still outstanding.

## Verification

`tests/media.test.ts` covers quotas, concurrent completion, cross-tenant/private reads, publication gating, planner/contributor permissions, originals and derivative metadata, HTTP/range reads, real MP4 processing, cover/order/movement and deletion. Set `TEST_HEIC_FIXTURE` to a lawful local HEIC fixture for the additional real-phone-format test; without it that single fixture test is explicitly skipped.

A maintainer-published HEIC sample was tested locally, not redistributed: source `catdad-experiments/heic-convert/scripts/images.js`, Google Drive sample `1J_761fe_HWSijAthq7h_D2Zsf1_es1cT`, SHA-256 `c02a2d70040fa05840231c29f183ce51d045bea027839e3d2ca4a6e968371541`. It converted to 1440×960 WebP. Browser evidence is in `docs/verification/media/`. Two-storage and full physical-device/backup checks remain R3 gates.
