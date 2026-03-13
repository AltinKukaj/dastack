# Production-ready Universal Dockerfile for Next.js
# Supports pnpm, npm, and bun via auto-detection

# Stage 1: Base
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* bun.lockb* ./

RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f bun.lockb ]; then corepack enable bun && bun install --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Stage 3: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build time (Next.js validates these)
ENV DATABASE_URL="postgresql://localhost:5432/dummy"
ENV BETTER_AUTH_SECRET="build-placeholder"
ENV BETTER_AUTH_URL="https://localhost:3000"
ENV NEXT_PUBLIC_APP_URL="https://localhost:3000"
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client and build
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && \
    pnpm exec prisma generate && \
    pnpm run build; \
  elif [ -f package-lock.json ]; then \
    npx prisma generate && \
    npm run build; \
  elif [ -f yarn.lock ]; then \
    yarn prisma generate && \
    yarn build; \
  elif [ -f bun.lockb ]; then \
    corepack enable bun && \
    bun x prisma generate && \
    bun run build; \
  else \
    echo "Lockfile not found." && exit 1; \
  fi

# Stage 4: Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Security: Run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy essential files for standalone mode
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Optional: Copy prisma directory if needed for migrations at runtime
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

# server.js is created by next build when output: "standalone" is set
CMD ["node", "server.js"]
