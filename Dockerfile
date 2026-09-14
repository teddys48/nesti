# syntax=docker/dockerfile:1

# ==========================================
# Dependencies
# ==========================================
FROM oven/bun:alpine AS deps

WORKDIR /app

COPY package.json bun.lock ./
COPY packages ./packages
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN bun install --frozen-lockfile


# ==========================================
# Builder
# ==========================================
FROM oven/bun:alpine AS builder

WORKDIR /app

COPY --from=deps /app ./
COPY package.json bun.lock ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY apps/web ./apps/web

# Build frontend
RUN cd apps/web && bun run build

# ==========================================
# Runtime
# ==========================================
FROM oven/bun:alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=/data/notes.db
ENV WEB_DIST_PATH=apps/web/dist

RUN mkdir -p /data

# Copy workspace dependencies, code, and built frontend
COPY --from=builder /app /app

EXPOSE 3000

VOLUME ["/data"]

CMD ["bun", "apps/api/src/index.ts"]
