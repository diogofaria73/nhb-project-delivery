# syntax=docker/dockerfile:1.7
# ──────────────────────────────────────────────────────────────────────
# Multi-stage Dockerfile for NHB Status Report
# Builds:  web (Vite)  +  api (NestJS)  →  single production image
# Web build is served by NestJS via @nestjs/serve-static (same-origin /api).
# ──────────────────────────────────────────────────────────────────────

# ── 1) Workspace deps (shared) ────────────────────────────────────────
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile

# ── 2) Build the Web (Vite → static dist) ─────────────────────────────
FROM node:20-alpine AS build-web
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/

WORKDIR /app/apps/web
RUN pnpm build

# ── 3) Build the API (NestJS → dist + Prisma client) ──────────────────
FROM node:20-alpine AS build-api
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

WORKDIR /app/apps/api
RUN npx prisma generate
RUN pnpm build
RUN npx tsc prisma/seed.ts --outDir dist/seed --esModuleInterop --skipLibCheck

# Preserve the pnpm symlink structure intact. `cp -rL` would dereference
# every symlink, but workspace symlinks (e.g. /app/apps/web) don't exist
# in this stage. `cp -a` keeps the symlinks; at runtime the API only
# follows links that resolve inside `.pnpm/`, so broken cross-workspace
# links are harmless.
RUN cp -a /app/node_modules /app/node_modules_resolved

# ── 4) Production image ───────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Tini for proper signal handling (graceful shutdown in Container Apps).
RUN apk add --no-cache tini

# API runtime
COPY --from=build-api /app/node_modules_resolved ./node_modules
# Project-level node_modules contains pnpm symlinks that point UP to the
# top-level `.pnpm/` virtual store. We need them so Node.js can resolve
# the API's own runtime deps (`@prisma/client`, `@nestjs/*`, etc.).
COPY --from=build-api /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build-api /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=build-api /app/apps/api/dist ./apps/api/dist
COPY --from=build-api /app/apps/api/prisma ./apps/api/prisma
COPY --from=build-api /app/apps/api/dist/seed ./apps/api/dist/seed
COPY apps/api/package.json ./apps/api/
COPY apps/api/entrypoint.sh ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src

# Web build (static assets served by NestJS)
COPY --from=build-web /app/apps/web/dist ./web-dist

ENV NODE_ENV=production
ENV WEB_BUILD_PATH=/app/web-dist

WORKDIR /app/apps/api

EXPOSE 3000

# Pre-create the upload directory so its named volume mount inherits the
# `nhb` ownership; otherwise Docker creates it as root and the non-root
# runtime user can't write uploaded files.
RUN mkdir -p /app/storage

# Non-root user.
RUN addgroup -S nhb && adduser -S nhb -G nhb \
    && chown -R nhb:nhb /app
USER nhb

ENTRYPOINT ["/sbin/tini", "--", "sh", "entrypoint.sh"]
