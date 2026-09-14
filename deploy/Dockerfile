# Multi-stage Dockerfile for Notes Web Application
FROM oven/bun:alpine AS builder

WORKDIR /app

# Copy root workspace configurations
COPY package.json bun.lock ./
COPY packages ./packages
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install workspace dependencies
RUN bun install --frozen-lockfile || bun install

# Copy application source files
COPY apps/api ./apps/api
COPY apps/web ./apps/web

# Build frontend static bundle and compile backend
RUN bun --cwd apps/web run build

# --- Production Image ---
FROM oven/bun:alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=/data/notes.db

# Create persistent storage volume directory
RUN mkdir -p /data

# Copy built server and web dist files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/apps/web/dist ./apps/web/dist

EXPOSE 3000

VOLUME ["/data"]

CMD ["bun", "apps/api/src/index.ts"]
