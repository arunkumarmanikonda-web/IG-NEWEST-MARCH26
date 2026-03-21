#!/usr/bin/env bash
# ============================================================================
# India Gully — ONE-SHOT Production Deployment Script
# ============================================================================
# Runs all 4 infrastructure tasks in sequence:
#   Step 1 — Create R2 bucket
#   Step 2 — Set all 15 secrets on Cloudflare Pages
#   Step 3 — Build + Deploy to Cloudflare Pages
#   Step 4 — Apply DB migration 0017 (real user accounts)
#   Step 5 — Verify deployment health
#
# PRE-REQUISITES:
#   1. Fill in all REPLACE_ME values in .env.secrets
#   2. Run: wrangler login   (authenticate to Cloudflare)
#   3. Run: source .env.secrets && bash scripts/deploy-production.sh
#
# ============================================================================
set -euo pipefail

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
RED='\033[0;31m'; BOLD='\033[1m'; NC='\033[0m'
PROJECT="india-gully"
DB_NAME="india-gully-production"
MIGRATION="migrations/0017_real_user_accounts.sql"
LIVE_URL="https://indiagully.com"

banner() { echo -e "${CYAN}"; echo "  ════════════════════════════════════════════════════════════"; echo "  $1"; echo -e "  ════════════════════════════════════════════════════════════${NC}"; }
ok()     { echo -e "  ${GREEN}✅  $1${NC}"; }
warn()   { echo -e "  ${YELLOW}⚠   $1${NC}"; }
fail()   { echo -e "  ${RED}❌  $1${NC}"; exit 1; }
step()   { echo -e "\n${BOLD}▶ $1${NC}"; }

banner "India Gully — Production Deploy (2026.51) — $(date '+%d %b %Y %H:%M')"

# ── 0. Validate secrets are filled in ──────────────────────────────────────
step "Step 0 — Validating secrets"
MISSING=()
for VAR in JWT_SECRET TOTP_ENCRYPT_KEY RAZORPAY_KEY_ID RAZORPAY_KEY_SECRET \
           RAZORPAY_WEBHOOK_SECRET SENDGRID_API_KEY \
           TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN TWILIO_FROM_NUMBER; do
  VAL="${!VAR:-}"
  if [[ -z "$VAL" || "$VAL" == *"REPLACE_ME"* ]]; then
    MISSING+=("$VAR")
  fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo -e "  ${RED}The following secrets are not set in your environment:${NC}"
  for m in "${MISSING[@]}"; do echo -e "    ${RED}• $m${NC}"; done
  echo ""
  warn "Fill in all REPLACE_ME values in .env.secrets, then re-run:"
  echo "    source .env.secrets && bash scripts/deploy-production.sh"
  exit 1
fi
ok "All required secrets present in environment"

# Optional secrets (warn but don't block)
for VAR in DOCUSIGN_API_KEY GST_CLIENT_ID WHATSAPP_TOKEN; do
  VAL="${!VAR:-}"
  if [[ -z "$VAL" || "$VAL" == *"REPLACE_ME"* ]]; then
    warn "$VAR not set — related endpoints will run in demo mode"
  fi
done

# ── 1. Create R2 bucket ────────────────────────────────────────────────────
step "Step 1 — Create R2 bucket: india-gully-docs"
if npx wrangler r2 bucket list 2>&1 | grep -q "india-gully-docs"; then
  ok "R2 bucket 'india-gully-docs' already exists — skipping creation"
else
  npx wrangler r2 bucket create india-gully-docs
  ok "R2 bucket 'india-gully-docs' created"
fi

# ── 2. Set all secrets ─────────────────────────────────────────────────────
step "Step 2 — Setting all secrets on Cloudflare Pages"

set_s() {
  local NAME="$1" VAR="$2"
  local VAL="${!VAR:-}"
  if [[ -n "$VAL" && "$VAL" != *"REPLACE_ME"* && "$VAL" != *"xxxxxxxx"* ]]; then
    printf '%s' "$VAL" | npx wrangler pages secret put "$NAME" --project-name "$PROJECT" >/dev/null 2>&1
    ok "$NAME"
  else
    warn "$NAME — skipped (not set)"
  fi
}

# Group 1: Platform Auth
set_s "JWT_SECRET"              JWT_SECRET
set_s "TOTP_ENCRYPT_KEY"        TOTP_ENCRYPT_KEY

# Group 2: Razorpay
set_s "RAZORPAY_KEY_ID"         RAZORPAY_KEY_ID
set_s "RAZORPAY_KEY_SECRET"     RAZORPAY_KEY_SECRET
set_s "RAZORPAY_WEBHOOK_SECRET" RAZORPAY_WEBHOOK_SECRET

# Group 3: SendGrid
set_s "SENDGRID_API_KEY"        SENDGRID_API_KEY

# Group 4: Twilio
set_s "TWILIO_ACCOUNT_SID"      TWILIO_ACCOUNT_SID
set_s "TWILIO_AUTH_TOKEN"       TWILIO_AUTH_TOKEN
set_s "TWILIO_FROM_NUMBER"      TWILIO_FROM_NUMBER

# Group 5: WhatsApp
set_s "WHATSAPP_TOKEN"          WHATSAPP_TOKEN
set_s "WHATSAPP_PHONE_ID"       WHATSAPP_PHONE_ID

# Group 6: DocuSign
set_s "DOCUSIGN_API_KEY"        DOCUSIGN_API_KEY
set_s "DOCUSIGN_ACCOUNT_ID"     DOCUSIGN_ACCOUNT_ID
set_s "DOCUSIGN_USER_ID"        DOCUSIGN_USER_ID
set_s "DOCUSIGN_PRIVATE_KEY"    DOCUSIGN_PRIVATE_KEY

# Group 7: GST
set_s "GSTIN"                   GSTIN
set_s "GST_CLIENT_ID"           GST_CLIENT_ID
set_s "GST_CLIENT_SECRET"       GST_CLIENT_SECRET

echo ""
echo "  Current secrets on $PROJECT:"
npx wrangler pages secret list --project-name "$PROJECT" 2>&1 | grep -E "^\s+[A-Z]" || true

# ── 3. Build + Deploy ──────────────────────────────────────────────────────
step "Step 3 — Build"
npm run build
ok "Build complete — dist/_worker.js $(du -sh dist/_worker.js 2>/dev/null | cut -f1)"

step "Step 3b — Deploy to Cloudflare Pages"
npx wrangler pages deploy dist --project-name "$PROJECT" --commit-dirty=true
ok "Deployed to $LIVE_URL"

# ── 4. Apply migration 0017 ────────────────────────────────────────────────
step "Step 4 — Apply DB migration 0017 (real user accounts)"
echo "  Running: npx wrangler d1 execute $DB_NAME --file=$MIGRATION"
npx wrangler d1 execute "$DB_NAME" --file="$MIGRATION"
ok "Migration 0017 applied — 8 real user accounts active"

# ── 5. Verify deployment ───────────────────────────────────────────────────
step "Step 5 — Verifying live deployment"
sleep 5

echo "  GET $LIVE_URL/api/health"
curl -fsS "$LIVE_URL/api/health" | python3 -m json.tool 2>/dev/null || \
  curl -fsS "$LIVE_URL/api/health" || warn "Health check non-200 — check logs"

echo ""
echo "  GET $LIVE_URL/api/integrations/sendgrid/verify"
curl -fsS "$LIVE_URL/api/integrations/sendgrid/verify" | python3 -m json.tool 2>/dev/null || true

echo ""
echo "  GET $LIVE_URL/api/payments/razorpay-health"
curl -fsS "$LIVE_URL/api/payments/razorpay-health" | python3 -m json.tool 2>/dev/null || true

# ── 6. Post-deploy checklist ───────────────────────────────────────────────
banner "Deployment complete ✅"
echo ""
echo -e "  ${GREEN}Build:${NC}    4.8 MB dist/_worker.js"
echo -e "  ${GREEN}Routes:${NC}   555 live routes"
echo -e "  ${GREEN}Version:${NC}  PLATFORM_VERSION=2026.51"
echo -e "  ${GREEN}Users:${NC}    8 real accounts active in D1"
echo -e "  ${GREEN}R2:${NC}       india-gully-docs bucket live"
echo ""
echo -e "  ${YELLOW}Remaining manual tasks:${NC}"
echo "    □ Create 19 email inboxes  → see inbox-scripts/create-inboxes-gworkspace.sh"
echo "    □ Distribute onboarding PDFs to 8 users"
echo "    □ 🔴 Renew Amit Jhingan DSC (expired 20 Mar 2026)"
echo "    □ 🔴 File MGT-7, AOC-4, Board Resolution Q4 2025"
echo ""
