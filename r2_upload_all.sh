#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  India Gully Ventures – Master R2 Upload Script
#  Generates GOV-007 & GOV-008 PDFs, then uploads ALL board_pack docs to R2
#  Run from repo root:  bash r2_upload_all.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e
BUCKET="india-gully-docs"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✅ $1${NC}"; }
warn() { echo -e "  ${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "  ${RED}❌ $1${NC}"; }

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📂  India Gully – R2 Board Pack Upload"
echo "  Bucket: $BUCKET"
echo "  Repo:   $REPO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 1 – Generate PDFs that can be auto-created (GOV-007, GOV-008)
# ─────────────────────────────────────────────────────────────────────────────
echo "[PHASE 1] Generating policy PDFs..."
echo ""

if [ ! -f "$REPO/code-of-conduct-ethics.pdf" ] || [ ! -f "$REPO/related-party-transaction-policy.pdf" ]; then
  if [ -f "$REPO/gen_policies_windows.py" ]; then
    pip install reportlab --quiet 2>/dev/null || true
    python "$REPO/gen_policies_windows.py"
  else
    warn "gen_policies_windows.py not found – download it and place in repo root first"
    warn "Skipping GOV-007 and GOV-008 generation"
  fi
else
  ok "GOV-007: code-of-conduct-ethics.pdf already exists"
  ok "GOV-008: related-party-transaction-policy.pdf already exists"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 2 – Upload function
# ─────────────────────────────────────────────────────────────────────────────
upload() {
  local LOCAL_FILE="$1"
  local R2_KEY="$2"
  local LABEL="$3"

  if [ -f "$LOCAL_FILE" ]; then
    echo "  ↑ Uploading $LABEL..."
    npx wrangler r2 object put "$BUCKET/$R2_KEY" --file "$LOCAL_FILE" --remote 2>&1 | grep -v "^$\|wrangler\|────\|Resource\|Use --remote" || true
    ok "$LABEL → $R2_KEY"
  else
    warn "$LABEL SKIPPED – file not found: $LOCAL_FILE"
    warn "       Place the file at: $LOCAL_FILE"
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 2 – Upload ALL board_pack documents
# ─────────────────────────────────────────────────────────────────────────────
echo "[PHASE 2] Uploading all board_pack documents to R2..."
echo ""
echo "  ── Auto-generated policy PDFs ──────────────────────────────"
upload "$REPO/code-of-conduct-ethics.pdf"          "board_pack/code-of-conduct-ethics.pdf"          "GOV-007 Code of Conduct & Ethics"
upload "$REPO/related-party-transaction-policy.pdf" "board_pack/related-party-transaction-policy.pdf" "GOV-008 Related Party Transaction Policy"

echo ""
echo "  ── Legal / Registration documents (place in repo root) ─────"
upload "$REPO/moa-indiagully.pdf"                  "board_pack/moa-indiagully.pdf"                  "GOV-001 Memorandum of Association"
upload "$REPO/aoa-indiagully.pdf"                  "board_pack/aoa-indiagully.pdf"                  "GOV-002 Articles of Association"
upload "$REPO/board-resolution-register.pdf"       "board_pack/board-resolution-register.pdf"       "GOV-003 Board Resolution Register"
upload "$REPO/annual-return-mgt7.pdf"              "board_pack/annual-return-mgt7.pdf"              "GOV-004 Annual Return (MGT-7)"
upload "$REPO/director-kyc-din-register.pdf"       "board_pack/director-kyc-din-register.pdf"       "GOV-005 Director KYC & DIN Register"
upload "$REPO/secretarial-audit-mr3.pdf"           "board_pack/secretarial-audit-mr3.pdf"           "GOV-006 Secretarial Audit (MR-3)"

echo ""
echo "  ── Compliance documents (download from govt portals) ────────"
upload "$REPO/certificate-of-incorporation.pdf"    "board_pack/certificate-of-incorporation.pdf"    "COMP-001 Certificate of Incorporation"
upload "$REPO/gstin-certificate.pdf"               "board_pack/gstin-certificate.pdf"               "COMP-002 GSTIN Certificate"
upload "$REPO/e-pan.pdf"                           "board_pack/e-pan.pdf"                           "COMP-003 e-PAN Card"

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 3 – Summary
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📋  Upload Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Listing what's now in R2 bucket (board_pack/)..."
npx wrangler r2 object list "$BUCKET" --prefix "board_pack/" --remote 2>/dev/null | grep -E "\.pdf|Key" || echo "  (run: npx wrangler r2 object list $BUCKET --prefix board_pack/ --remote)"
echo ""
echo "  Documents skipped with ⚠️  need to be placed manually."
echo ""
echo "  How to get missing documents:"
echo "  ┌─────────────────────────────────────────────────────────┐"
echo "  │  GOV-001 MOA         → from your Company Secretary       │"
echo "  │  GOV-002 AOA         → from your Company Secretary       │"
echo "  │  GOV-003 Board Resol → internal company records          │"
echo "  │  GOV-004 MGT-7       → MCA21 portal filing               │"
echo "  │  GOV-005 Director KYC→ MCA portal / DIN records          │"
echo "  │  GOV-006 MR-3        → Secretarial Auditor               │"
echo "  │  COMP-001 CoI        → https://www.mca.gov.in            │"
echo "  │  COMP-002 GSTIN cert → https://www.gst.gov.in            │"
echo "  │  COMP-003 e-PAN      → https://www.incometax.gov.in      │"
echo "  └─────────────────────────────────────────────────────────┘"
echo ""
echo "  Once you have the file, re-run:  bash r2_upload_all.sh"
echo "  It skips already-uploaded files and only uploads missing ones."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎉  R2 upload run complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
