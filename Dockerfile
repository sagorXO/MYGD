# ---------------------------------------------------------
# MY GERMAN DÖNER (MYGD) — Production images
#   target "runner": the web app (standalone Next.js server, non-root)
#   target "tools":  one-off jobs: prisma migrate deploy, npm run user:create, npm run db:seed
# ---------------------------------------------------------

FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Build needs no real database or secrets; these placeholders exist only during this RUN.
RUN DATABASE_URL=postgresql://build:build@localhost/build DIRECT_URL=postgresql://build:build@localhost/build \
    sh -c "npx prisma generate && npm run build"

FROM builder AS tools
ENV NODE_ENV=production
USER node
CMD ["npx", "prisma", "migrate", "deploy"]

FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV MEDIA_ROOT=/data/media

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
# Owned by the app user so a new named volume mounted here inherits the right owner.
RUN mkdir -p /data/media && chown -R nextjs:nodejs /data

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
