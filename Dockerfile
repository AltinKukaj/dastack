# syntax=docker/dockerfile:1.6

############################
# 1) deps (bun install)
############################
FROM oven/bun:1.3.10 AS deps
WORKDIR /app

# Copy manifests and Prisma schema/config first (needed by postinstall prisma generate)
COPY package.json bun.lock* prisma.config.ts ./
COPY prisma/schema.prisma ./prisma/schema.prisma

# Install deps (prod+dev because we build in container)
RUN bun install --frozen-lockfile

############################
# 2) builder (prisma generate + next build)
############################
FROM oven/bun:1.3.10 AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1


COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma client generation (needed at runtime)
RUN bunx prisma generate

# Build Next (standalone output recommended)
RUN bun run build

############################
# 3) runner (small + stable)
############################
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Ensure Next.js binds to all network interfaces, not just localhost
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Prisma/Next often need SSL certs available
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

# Create non-root user and group
RUN groupadd -g 1001 nodejs \
  && useradd -m -u 1001 -g nodejs nextjs

# Pre-create the .next cache folder and set ownership explicitly
RUN mkdir .next \
  && chown nextjs:nodejs .next

# Copy standalone server output
# (Next standalone puts server.js + minimal node_modules inside .next/standalone)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Optional: keep prisma schema/migrations inside image (useful for migrate deploy)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000

# server.js is created by Next standalone build
CMD ["node", "server.js"]