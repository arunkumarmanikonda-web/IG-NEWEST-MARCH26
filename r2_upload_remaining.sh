#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  India Gully – Upload REMAINING 4 R2 documents
#  (MOA / AOA / GSTIN / EPAN / CIN already uploaded ✅)
#  Run: bash r2_upload_remaining.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e
BUCKET="india-gully-docs"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PASS=0; SKIP=0

ok()   { echo -e "  \033[0;32m✅ $1\033[0m"; PASS=$((PASS+1)); }
warn() { echo -e "  \033[1;33m⚠️  $1\033[0m"; SKIP=$((SKIP+1)); }

upload() {
  local FILE="$1" KEY="$2" LABEL="$3"
  if [ -f "$REPO/$FILE" ]; then
    npx wrangler r2 object put "$BUCKET/$KEY" --file "$REPO/$FILE" --remote 2>&1 \
      | grep -v "^$\|wrangler\|────\|Resource\|Use --remote\|update available" || true
    ok "$LABEL"
  else
    warn "$LABEL — place '$FILE' in repo root and re-run"
  fi
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📂  India Gully – R2 Remaining Documents Upload"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Already uploaded (skipping): MOA, AOA, GSTIN, e-PAN, CoI ✅"
echo ""

# ── Step 1: Generate GOV-003, GOV-005, GOV-007, GOV-008 ──────────────────
echo "[1/2] Generating auto-creatable PDFs..."

pip install reportlab --quiet 2>/dev/null || true

# GOV-007 & GOV-008
if [ -f "$REPO/gen_policies_windows.py" ]; then
  python "$REPO/gen_policies_windows.py" 2>/dev/null && ok "GOV-007 & GOV-008 generated" || warn "gen_policies_windows.py failed"
else
  warn "gen_policies_windows.py not in repo root — download it first"
fi

# GOV-003 & GOV-005
if [ -f "$REPO/gen_gov003_005.py" ]; then
  python "$REPO/gen_gov003_005.py" 2>/dev/null && ok "GOV-003 & GOV-005 generated" || warn "gen_gov003_005.py failed"
else
  warn "gen_gov003_005.py not in repo root — download it first"
fi

echo ""
echo "[2/2] Uploading to R2..."
echo ""
echo "  ── Auto-generated ──────────────────────────────────────────"
upload "code-of-conduct-ethics.pdf"          "board_pack/code-of-conduct-ethics.pdf"          "GOV-007 Code of Conduct & Ethics"
upload "related-party-transaction-policy.pdf" "board_pack/related-party-transaction-policy.pdf" "GOV-008 Related Party Transaction Policy"
upload "board-resolution-register.pdf"        "board_pack/board-resolution-register.pdf"        "GOV-003 Board Resolution Register"
upload "director-kyc-din-register.pdf"        "board_pack/director-kyc-din-register.pdf"        "GOV-005 Director KYC & DIN Register"
echo ""
echo "  ── Need real filed documents (from MCA/Auditor) ─────────────"
upload "annual-return-mgt7.pdf"               "board_pack/annual-return-mgt7.pdf"               "GOV-004 Annual Return MGT-7 (from MCA21)"
upload "secretarial-audit-mr3.pdf"            "board_pack/secretarial-audit-mr3.pdf"            "GOV-006 Secretarial Audit MR-3 (from Auditor)"

# ── Summary ──────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📋  Result: $PASS uploaded  |  $SKIP skipped"
echo ""
echo "  R2 bucket contents (board_pack/):"
npx wrangler r2 object list "$BUCKET" --prefix "board_pack/" --remote 2>/dev/null \
  | grep "\.pdf" | awk '{print "    ✅ "$0}' || echo "  (list command unavailable)"
echo ""
if [ "$SKIP" -gt 0 ]; then
  echo "  For skipped files:"
  echo "    GOV-004 Annual Return → download from https://www.mca.gov.in"
  echo "    GOV-006 Secretarial Audit → request from your auditor"
  echo "  Then re-run: bash r2_upload_remaining.sh"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
