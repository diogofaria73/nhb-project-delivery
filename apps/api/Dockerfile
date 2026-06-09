# ── Stage 1: Install dependencies ────────────────────────
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ───────────────────────────────────────
FROM node:20-alpine AS build

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

WORKDIR /app/apps/api

RUN npx prisma generate
RUN pnpm build
RUN npx tsc prisma/seed.ts --outDir dist/seed --esModuleInterop --skipLibCheck

# Resolve pnpm symlinks into real files for production copy
RUN cp -rL /app/node_modules /app/node_modules_resolved

# ── Stage 3: Production image ────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=build /app/node_modules_resolved ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/dist/seed ./apps/api/dist/seed
COPY apps/api/package.json ./apps/api/
COPY apps/api/entrypoint.sh ./apps/api/

ENV NODE_ENV=production

WORKDIR /app/apps/api

EXPOSE 3000

ENTRYPOINT ["sh", "entrypoint.sh"]
