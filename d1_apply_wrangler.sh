#!/usr/bin/env bash
# ============================================================
# India Gully — Wrangler D1 migrations apply (idiomatic)
# Uses `wrangler d1 migrations apply` which tracks what's
# already been applied via the d1_migrations table.
#
# Run from repo root in Git Bash:
#   bash d1_apply_wrangler.sh
# ============================================================

DB="india-gully-production"

echo ""
echo "=============================================="
echo " India Gully — wrangler d1 migrations apply"
echo " DB: $DB"
echo "=============================================="
echo ""

echo "Step 1 — Apply all pending migrations (wrangler tracks applied ones)"
npx wrangler d1 migrations apply "$DB" --remote

echo ""
echo "Step 2 — Run seed_users.sql (if not yet applied)"
echo "(seed_users is not a numbered migration; run manually once)"
read -p "  Apply seed_users.sql? (y/N): " seed_choice
if [[ "$seed_choice" =~ ^[Yy]$ ]]; then
  npx wrangler d1 execute "$DB" --remote --file="migrations/seed_users.sql"
  echo "  ✅ seed_users.sql applied"
fi

echo ""
echo "Step 3 — Run seed_phase18.sql (if not yet applied)"
read -p "  Apply seed_phase18.sql? (y/N): " seed18_choice
if [[ "$seed18_choice" =~ ^[Yy]$ ]]; then
  npx wrangler d1 execute "$DB" --remote --file="migrations/seed_phase18.sql"
  echo "  ✅ seed_phase18.sql applied"
fi

echo ""
echo "Step 4 — Verify real users"
echo "---------------------------"
npx wrangler d1 execute "$DB" --remote --command="SELECT identifier, role, is_active FROM ig_users WHERE is_demo=0 AND is_active=1 ORDER BY role"

echo ""
echo "✅ Done."
