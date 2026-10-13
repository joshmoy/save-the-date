# Sandboxed rendering runtime

The worker normally launches INVITATION_BROWSER_PATH directly. Runtime needs a working Chromium sandbox, matching bundled template/font assets, system FFmpeg/ffprobe and sufficient private temporary disk. The reference worker image includes chromium-sandbox. Debian repositories can retire a precise package version; default development builds use the currently available package. For a production release select supported CHROMIUM_VERSION/FFMPEG_VERSION build arguments against a retained apt mirror/snapshot, run rendering verification, and pin the resulting image digest. Record executable versions with the release. Browser sandbox failures are real failed exports with retry guidance; disabling the sandbox is not the supported remedy.

Where the host cannot support sandbox namespaces, set RENDER_BROWSER_ENDPOINT to a private dedicated HTTP(S) browser endpoint or WS(S) endpoint on a sandbox-capable host. Each job creates and closes an isolated browser context; disconnecting does not kill the shared daemon. Requests from rendered documents remain restricted to embedded data/about:blank.

For a separate local renderer with a temporary empty profile:

```sh
# Root .env supplies INVITATION_BROWSER_PATH; never use a personal browser profile.
pnpm exec tsx scripts/render-browser.ts
# Optional RENDER_BROWSER_PORT defaults to 9223.
# Native worker: RENDER_BROWSER_ENDPOINT=http://127.0.0.1:9223
```

Keep CDP private and restrict it to workers: it controls the dedicated browser. Do not expose its port publicly or connect to a user's existing browser session. Container workers may need the host's private numeric bridge address because Chromium rejects non-localhost DNS Host headers. Resolve the actual bridge; do not assume an address across hosts. Production uses a sandbox-capable private renderer service/host with restricted networking and process supervision.

`docker build --target worker -t save-the-date:r3-worker .` builds a generic Linux runtime. `scripts/verify-linux-runtime.mjs` tests native processing and all four real JPEG/PDF exports and QR decoding. It expects /data/phone.heic and writes /data/verification. On this Docker Desktop host native processing passed but local sandbox namespaces were denied. Dedicated-browser rehearsal is a separate check, not proof of a Linux-local browser.

Production transport: a cross-host renderer must use a direct `wss://` CDP endpoint with a trusted certificate and matching hostname. HTTP(S) discovery and WS are allowed only on loopback; HTTPS discovery alone can return a plaintext socket. Terminate TLS/authentication on a private renderer ingress and keep its debugging endpoint inaccessible to guests. Local compose/dev still supports the private numeric Docker Desktop bridge. Provider/container credentials must never be placed in generated documents.
