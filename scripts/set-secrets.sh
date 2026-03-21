#!/usr/bin/env bash
# ============================================================================
# India Gully — Complete Secrets Setup (Phase Portal-1 / 2026.51)
# ============================================================================
# Sets ALL required Cloudflare Pages secrets for the india-gully project.
# Run AFTER obtaining live credentials from each provider.
#
# Usage:
#   bash scripts/set-secrets.sh                    # interactive
#   source .env.secrets && bash scripts/set-secrets.sh  # non-interactive
#
# Generate secure random secrets locally:
#   JWT_SECRET:       openssl rand -hex 32
#   TOTP_ENCRYPT_KEY: openssl rand -hex 16  (must be exactly 32 hex chars)
#
# Required credentials by provider:
#   Razorpay    → https://dashboard.razorpay.com/app/keys
#   SendGrid    → https://app.sendgrid.com/settings/api_keys
#   Twilio      → https://console.twilio.com/us1/account/keys-credentials/api-keys
#   DocuSign    → https://admindemo.docusign.com/integrations/apps-and-keys
#   GST/IRP     → https://einvoice1.gst.gov.in/Others/SandboxAcc
#   WhatsApp    → https://developers.facebook.com/apps (WhatsApp Business API)
# ============================================================================
set -euo pipefail

PROJECT="india-gully"
CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "${CYAN}══════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  India Gully — Secrets Setup (build 2026.51, 21 Mar 2026)${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════════════════════${NC}"

# ── Helper ──────────────────────────────────────────────────────────────────
SKIPPED=(); SET_OK=()

set_secret() {
  local NAME="$1" PROMPT="$2" ENV_VAR="${3:-}" VALUE=""
  [[ -n "$ENV_VAR" ]] && VALUE="${!ENV_VAR:-}"
  if [[ -n "$VALUE" ]]; then
    printf '%s' "$VALUE" | npx wrangler pages secret put "$NAME" --project-name "$PROJECT" >/dev/null 2>&1
    echo -e "  ${GREEN}✅ $NAME${NC} — set from environment"
    SET_OK+=("$NAME")
  else
    echo -e "  ${YELLOW}Enter $PROMPT${NC} (blank = skip):"
    read -rs VALUE || true
    echo ""
    if [[ -n "$VALUE" ]]; then
      printf '%s' "$VALUE" | npx wrangler pages secret put "$NAME" --project-name "$PROJECT" >/dev/null 2>&1
      echo -e "  ${GREEN}✅ $NAME${NC} — set"
      SET_OK+=("$NAME")
    else
      echo -e "  ${YELLOW}⚠  $NAME${NC} — skipped"
      SKIPPED+=("$NAME")
    fi
  fi
}

# ════════════════════════════════════════════════════════════════════════════
# GROUP 1 — Platform Auth (BLOCKING — set these first)
# ════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${YELLOW}▶ GROUP 1 — Platform Auth (BLOCKING)${NC}"
echo "   JWT_SECRET:       openssl rand -hex 32"
echo "   TOTP_ENCRYPT_KEY: openssl rand -hex 16"
set_secret "JWT_SECRET"       "JWT signing secret (min 64 hex chars)"   "JWT_SECRET"
set_secret "TOTP_ENCRYPT_KEY" "TOTP AES-256 key (exactly 32 hex chars)" "TOTP_ENCRYPT_KEY"

# ════════════════════════════════════════════════════════════════════════════
# GROUP 2 — Razorpay (Payment Gateway)
# ════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${YELLOW}▶ GROUP 2 — Razorpay${NC}"
echo "   Dashboard: https://dashboard.razorpay.com/app/keys"
set_secret "RAZORPAY_KEY_ID"         "Razorpay Live Key ID (rzp_live_...)"    "RAZORPAY_KEY_ID"
set_secret "RAZORPAY_KEY_SECRET"     "Razorpay Live Key Secret"               "RAZORPAY_KEY_SECRET"
set_secret "RAZORPAY_WEBHOOK_SECRET" "Razorpay Webhook Signing Secret"        "RAZORPAY_WEBHOOK_SECRET"

# ════════════════════════════════════════════════════════════════════════════
# GROUP 3 — SendGrid (Transactional Email)
# ════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${YELLOW}▶ GROUP 3 — SendGrid${NC}"
echo "   Dashboard: https://app.sendgrid.com/settings/api_keys"
echo "   Ensure domain indiagully.com is authenticated + DNS validated first"
set_secret "SENDGRID_API_KEY" "SendGrid API Key (SG.xxx...)" "SENDGRID_API_KEY"

# ════════════════════════════════════════════════════════════════════════════
# GROUP 4 — Twilio (SMS OTP + WhatsApp)
# ════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${YELLOW}▶ GROUP 4 — Twilio (SMS + WhatsApp)${NC}"
echo "   Dashboard: https://console.twilio.com"
set_secret "TWILIO_ACCOUNT_SID"  "Twilio Account SID (ACxxx...)"              "TWILIO_ACCOUNT_SID"
set_secret "TWILIO_AUTH_TOKEN"   "Twilio Auth Token"                          "TWILIO_AUTH_TOKEN"
set_secret "TWILIO_FROM_NUMBER"  "Twilio From Number (E.164 e.g. +91xxxxxxxxxx)" "TWILIO_FROM_NUMBER"
set_secret "WHATSAPP_TOKEN"      "WhatsApp Business Cloud API Bearer token"   "WHATSAPP_TOKEN"
set_secret "WHATSAPP_PHONE_ID"   "WhatsApp Phone Number ID (numeric)"         "WHATSAPP_PHONE_ID"

# ════════════════════════════════════════════════════════════════════════════
# GROUP 5 — DocuSign (e-Signatures)
# ════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${YELLOW}▶ GROUP 5 — DocuSign (e-Signatures)${NC}"
echo "   Dashboard: https://admindemo.docusign.com/integrations/apps-and-keys"
echo "   ⚠  Requires Amit Jhingan DSC renewal before any signing envelopes"
set_secret "DOCUSIGN_API_KEY"      "DocuSign Integration Key (UUID)"         "DOCUSIGN_API_KEY"
set_secret "DOCUSIGN_ACCOUNT_ID"   "DocuSign Account ID (UUID)"              "DOCUSIGN_ACCOUNT_ID"
set_secret "DOCUSIGN_USER_ID"      "DocuSign User ID (UUID)"                 "DOCUSIGN_USER_ID"
set_secret "DOCUSIGN_PRIVATE_KEY"  "DocuSign RSA Private Key (PEM, base64)"  "DOCUSIGN_PRIVATE_KEY"

# ════════════════════════════════════════════════════════════════════════════
# GROUP 6 — GST / IRP (e-Invoice)
# ════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${YELLOW}▶ GROUP 6 — GST / IRP (e-Invoice generation)${NC}"
echo "   Sandbox: https://einvoice1.gst.gov.in/Others/SandboxAcc"
set_secret "GSTIN"           "Company GSTIN (15 chars, e.g. 27AAACI...)"  "GSTIN"
set_secret "GST_CLIENT_ID"   "GST API Client ID"                          "GST_CLIENT_ID"
set_secret "GST_CLIENT_SECRET" "GST API Client Secret"                    "GST_CLIENT_SECRET"

# ════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ SET  (${#SET_OK[@]}): ${SET_OK[*]:-none}${NC}"
echo -e "${YELLOW}  ⚠  SKIPPED (${#SKIPPED[@]}): ${SKIPPED[*]:-none}${NC}"
echo ""
echo "  Secrets currently on Cloudflare Pages ($PROJECT):"
npx wrangler pages secret list --project-name "$PROJECT" 2>&1 | grep -v "^$" || true
echo ""
echo "  Next steps after all secrets are set:"
echo "  1. npx wrangler r2 bucket create india-gully-docs"
echo "  2. git add wrangler.jsonc && git commit -m 'chore: enable R2 binding'"
echo "  3. npm run deploy   (or push to trigger CI)"
echo "  4. npx wrangler d1 execute india-gully-production --file=migrations/0017_real_user_accounts.sql"
echo "  5. Distribute TOTP onboarding packs to 8 users"
echo -e "${CYAN}══════════════════════════════════════════════════════════════════${NC}"
