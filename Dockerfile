# Generic runtime packaging. No hosting-platform runtime APIs.
ARG NODE_IMAGE=node:22-bookworm-slim@sha256:83f487e0a63425e5b4d146fb5e5be574bcbe1b7b843d3ebafdd95eaf7767a7e5
FROM ${NODE_IMAGE} AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build \
 && cp -r apps/web/public apps/web/.next/standalone/apps/web/public \
 && cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable && mkdir -p /data/storage /data/mail && chown -R node:node /data
COPY --from=build --chown=node:node /app /app
USER node
EXPOSE 3000 4000
# Override for web or worker. API and worker share package artifacts, not a process.
CMD ["node", "apps/api/dist/main.js"]
FROM runtime AS web
CMD ["node", "apps/web/.next/standalone/apps/web/server.js"]
FROM runtime AS api
CMD ["node", "apps/api/dist/main.js"]
FROM runtime AS worker
CMD ["node", "apps/worker/dist/main.js"]
