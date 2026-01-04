# Use the official Node.js LTS image as the base image (glibc for native deps)
FROM node:20.19-bookworm-slim AS base

# Install dependencies only when needed
FROM base AS deps

# Minimal tools; bookworm already includes glibc for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
  && rm -rf /var/lib/apt/lists/*
# Set the working directory
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; \
    fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Use local path for generate; runtime overrides DATABASE_URL via env
ENV DATABASE_URL=file:./prisma/dev.db

# Generate Prisma client
RUN npx prisma generate

RUN \
    if [ -f yarn.lock ]; then yarn run build; \
    elif [ -f package-lock.json ]; then npm run build; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
    else echo "Lockfile not found." && exit 1; \
    fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
# Comment the following line in case you do not want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Set up /data directory with the right permissions and ship Prisma CLI/adapter for migrations
RUN npm install prisma@7.2.0 @prisma/adapter-libsql --no-save

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/lib/data ./src/lib/data
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000

# Start as root, fix /data permissions, copy bundled dev DB if missing, then run app as nextjs user
CMD chown -R nextjs:nodejs /data && \
    if [ ! -f /data/dev.db ]; then cp /app/prisma/dev.db /data/dev.db; chown nextjs:nodejs /data/dev.db; fi && \
    exec su -s /bin/sh nextjs -c "\
      export DATABASE_URL=${DATABASE_URL:-file:/data/dev.db} && \
      npm run seed && \
      node server.js"
