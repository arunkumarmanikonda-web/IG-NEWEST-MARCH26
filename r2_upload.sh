#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# India Gully Ventures – R2 Policy PDF Upload Script (Git Bash compatible)
# Run from repo root:  bash r2_upload.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GOV007="$REPO_DIR/code-of-conduct-ethics.pdf"
GOV008="$REPO_DIR/related-party-transaction-policy.pdf"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  India Gully Ventures – R2 Policy PDF Upload"
echo "  Working directory: $REPO_DIR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Generate PDFs if missing ─────────────────────────────────────────
if [ ! -f "$GOV007" ] || [ ! -f "$GOV008" ]; then
  echo ""
  echo "[1/3] PDFs not found – generating now..."
  pip install reportlab --quiet
  python gen_policies_windows.py
else
  echo ""
  echo "[1/3] PDFs already exist – skipping generation."
  echo "      GOV-007: $(du -h "$GOV007" | cut -f1)"
  echo "      GOV-008: $(du -h "$GOV008" | cut -f1)"
fi

# ── Step 2: Verify PDFs exist ─────────────────────────────────────────────────
if [ ! -f "$GOV007" ]; then
  echo "ERROR: $GOV007 not found. Check gen_policies_windows.py output above."
  exit 1
fi
if [ ! -f "$GOV008" ]; then
  echo "ERROR: $GOV008 not found. Check gen_policies_windows.py output above."
  exit 1
fi

echo ""
echo "[2/3] Uploading to Cloudflare R2 (remote)..."

# GOV-007
echo "      Uploading GOV-007: board_pack/code-of-conduct-ethics.pdf ..."
npx wrangler r2 object put "india-gully-docs/board_pack/code-of-conduct-ethics.pdf" --file "$GOV007" --remote
echo "      ✅ GOV-007 uploaded"

# GOV-008
echo "      Uploading GOV-008: board_pack/related-party-transaction-policy.pdf ..."
npx wrangler r2 object put "india-gully-docs/board_pack/related-party-transaction-policy.pdf" --file "$GOV008" --remote
echo "      ✅ GOV-008 uploaded"

echo ""
echo "[3/3] Verifying uploads..."
npx wrangler r2 object get "india-gully-docs/board_pack/code-of-conduct-ethics.pdf" --pipe --remote > /dev/null && echo "      ✅ GOV-007 verified in R2" || echo "      ⚠️  GOV-007 verification failed"
npx wrangler r2 object get "india-gully-docs/board_pack/related-party-transaction-policy.pdf" --pipe --remote > /dev/null && echo "      ✅ GOV-008 verified in R2" || echo "      ⚠️  GOV-008 verification failed"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎉  R2 upload complete!"
echo "      GOV-007 → india-gully-docs/board_pack/code-of-conduct-ethics.pdf"
echo "      GOV-008 → india-gully-docs/board_pack/related-party-transaction-policy.pdf"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
