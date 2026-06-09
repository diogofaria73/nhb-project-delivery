#!/usr/bin/env bash
#
# Railway Setup Script — NHB Status Report
#
# Creates and configures the full Railway project:
#   - PostgreSQL database
#   - API service (NestJS)
#   - Web service (React + nginx)
#
# Prerequisites:
#   - Railway CLI installed: npm i -g @railway/cli
#   - Logged in: railway login
#   - GitHub repo connected to Railway account
#
# Usage:
#   chmod +x scripts/railway-setup.sh
#   ./scripts/railway-setup.sh

set -euo pipefail

# ── Config ───────────────────────────────────────────────
GITHUB_REPO="diogofaria73/nhb-status-report"
JWT_SECRET="zgbeDafwmkSzQmifvrHgnH4RTCFONYrOgJ9FOU6SV18="

# ── Colors ───────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }

# ── Pre-checks ───────────────────────────────────────────
if ! command -v railway &> /dev/null; then
  echo "Railway CLI not found. Install it with: npm i -g @railway/cli"
  exit 1
fi

info "Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
  echo "Not logged in. Run: railway login"
  exit 1
fi
ok "Authenticated"

# ── Step 1: Create project ──────────────────────────────
echo ""
info "Step 1/7 — Creating Railway project..."
railway init --name nhb-status-report
ok "Project created"

# ── Step 2: Add PostgreSQL ──────────────────────────────
echo ""
info "Step 2/7 — Adding PostgreSQL database..."
railway add --database postgres
ok "PostgreSQL added"

# ── Step 3: Add API service ─────────────────────────────
echo ""
info "Step 3/7 — Adding API service from GitHub..."
railway add --repo "$GITHUB_REPO" --variables "RAILWAY_DOCKERFILE_PATH=apps/api/Dockerfile"
ok "API service added"

# ── Step 4: Configure API variables ─────────────────────
echo ""
info "Step 4/7 — Setting API environment variables..."
railway variables set \
  JWT_SECRET="$JWT_SECRET" \
  NODE_ENV=production \
  PORT=3000 \
  --service api

warn "CORS_ORIGIN will need to be set after the Web service generates its domain."
warn "Run: railway variables set CORS_ORIGIN=https://YOUR-WEB-DOMAIN.up.railway.app --service api"
ok "API variables configured"

# ── Step 5: Add Web service ─────────────────────────────
echo ""
info "Step 5/7 — Adding Web service from GitHub..."
railway add --repo "$GITHUB_REPO" --variables "RAILWAY_DOCKERFILE_PATH=apps/web/Dockerfile"
ok "Web service added"

# ── Step 6: Configure Web variables ─────────────────────
echo ""
info "Step 6/7 — Setting Web environment variables..."
railway variables set \
  API_URL="http://api.railway.internal:3000" \
  --service web

ok "Web variables configured"

# ── Step 7: Summary ─────────────────────────────────────
echo ""
echo "=========================================="
echo -e "${GREEN}  Railway setup complete!${NC}"
echo "=========================================="
echo ""
echo "Project structure:"
echo "  ├── PostgreSQL (database)"
echo "  ├── api (NestJS + Prisma)"
echo "  └── web (React + nginx)"
echo ""
echo "Next steps:"
echo "  1. Open Railway dashboard and verify the services"
echo "  2. Link PostgreSQL DATABASE_URL to the API service:"
echo "     Dashboard → API → Variables → Add Reference Variable → PostgreSQL"
echo "  3. Generate domains for both services:"
echo "     Dashboard → Service → Networking → Generate Domain"
echo "  4. Set CORS_ORIGIN on the API with the Web domain:"
echo "     railway variables set CORS_ORIGIN=https://YOUR-WEB-DOMAIN.up.railway.app --service api"
echo "  5. Push to deploy:"
echo "     git push origin main"
echo "  6. After deploy, seed the admin user:"
echo "     railway run --service api npx ts-node prisma/seed.ts"
echo ""
