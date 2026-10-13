# Generic runtime packaging. No hosting-platform runtime APIs.
ARG NODE_IMAGE=node:22-bookworm-slim@sha256:83f487e0a63425e5b4d146fb5e5be574bcbe1b7b843d3ebafdd95eaf7767a7e5
FROM ${NODE_IMAGE} AS build
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=1 TURBO_TELEMETRY_DISABLED=1 NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/adapters/package.json packages/adapters/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/persistence/package.json packages/persistence/package.json
COPY packages/templates/package.json packages/templates/package.json
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable && mkdir -p /data/storage /data/mail /data/deletion-ledger && chown -R node:node /data
COPY --from=build --chown=node:node /app /app
USER node
EXPOSE 3000 4000
# Override for web or worker. API and worker share package artifacts, not a process.
CMD ["node", "apps/api/dist/main.js"]
FROM runtime AS web
CMD ["node", "apps/web/.next/standalone/apps/web/server.js"]
FROM runtime AS api
CMD ["node", "apps/api/dist/main.js"]
FROM ${NODE_IMAGE} AS worker
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable && mkdir -p /data/storage /data/mail /data/deletion-ledger && chown -R node:node /data
ARG CHROMIUM_VERSION
ARG FFMPEG_VERSION
RUN apt-get update && apt-get install -y --no-install-recommends chromium${CHROMIUM_VERSION:+=$CHROMIUM_VERSION} chromium-sandbox${CHROMIUM_VERSION:+=$CHROMIUM_VERSION} ffmpeg${FFMPEG_VERSION:+=$FFMPEG_VERSION} ca-certificates fonts-liberation && rm -rf /var/lib/apt/lists/*
ENV INVITATION_BROWSER_PATH=/usr/bin/chromium MEDIA_FFMPEG_PATH=/usr/bin/ffmpeg MEDIA_FFPROBE_PATH=/usr/bin/ffprobe
COPY --from=build --chown=node:node /app /app
USER node
CMD ["node", "apps/worker/dist/main.js"]
