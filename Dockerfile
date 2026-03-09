# Build stage
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile

COPY . .

# Placeholder env vars for build (validated at build time; override at runtime)
ENV DATABASE_URL="postgresql://localhost:5432/dummy"
ENV BETTER_AUTH_SECRET="build-placeholder"
ENV BETTER_AUTH_URL="https://localhost:3000"
ENV NEXT_PUBLIC_APP_URL="https://localhost:3000"

RUN pnpm exec prisma generate
RUN pnpm build

# Run stage
FROM node:22-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["pnpm", "start"]
