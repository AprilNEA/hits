DFROM oven/bun:alpine AS base

FROM base AS builder

RUN apk add --no-cache gcompat
WORKDIR /app

COPY bun.lockb package*json tsconfig.json src ./

RUN bun install && \
    bun run build && \
    bun install --production

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

COPY --from=builder --chown=hono:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=hono:nodejs /app/dist /app/dist
COPY --from=builder --chown=hono:nodejs /app/package.json /app/package.json

USER hono
EXPOSE 3000

CMD ["node", "/app/dist/server.js"]