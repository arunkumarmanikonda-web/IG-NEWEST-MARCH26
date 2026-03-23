#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# India Gully Ventures – Razorpay Live Keys Setup Script
# Run: bash setup_razorpay.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

PROJECT="india-gully"
LIVE_URL="https://india-gully.pages.dev"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  💳  India Gully – Razorpay Live Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  You will be prompted 3 times."
echo "  Paste the value and press ENTER each time."
echo "  Values are sent directly to Cloudflare — never stored locally."
echo ""
echo "  Have these ready from https://dashboard.razorpay.com:"
echo "    1.  Key ID      (starts with rzp_live_...)"
echo "    2.  Key Secret  (shown only once after generation)"
echo "    3.  Webhook Secret (you set this when creating the webhook)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Step 1: RAZORPAY_KEY_ID ───────────────────────────────────────────────
echo "[1/3] Setting RAZORPAY_KEY_ID..."
npx wrangler pages secret put RAZORPAY_KEY_ID --project-name "$PROJECT"
echo "      ✅ RAZORPAY_KEY_ID saved"
echo ""

# ── Step 2: RAZORPAY_KEY_SECRET ───────────────────────────────────────────
echo "[2/3] Setting RAZORPAY_KEY_SECRET..."
npx wrangler pages secret put RAZORPAY_KEY_SECRET --project-name "$PROJECT"
echo "      ✅ RAZORPAY_KEY_SECRET saved"
echo ""

# ── Step 3: RAZORPAY_WEBHOOK_SECRET ──────────────────────────────────────
echo "[3/3] Setting RAZORPAY_WEBHOOK_SECRET..."
npx wrangler pages secret put RAZORPAY_WEBHOOK_SECRET --project-name "$PROJECT"
echo "      ✅ RAZORPAY_WEBHOOK_SECRET saved"
echo ""

# ── Done ──────────────────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎉  All 3 Razorpay secrets saved to Cloudflare Pages!"
echo ""
echo "  ┌──────────────────────────────────────────────────────────┐"
echo "  │  NEXT STEP — Add Webhook in Razorpay Dashboard:          │"
echo "  │                                                           │"
echo "  │  URL:    $LIVE_URL/api/payments/webhook  │"
echo "  │  Events: payment.captured                                 │"
echo "  │          payment.failed                                   │"
echo "  │          order.paid                                       │"
echo "  │          refund.processed                                 │"
echo "  │  Secret: (use the same secret you just entered above)     │"
echo "  └──────────────────────────────────────────────────────────┘"
echo ""
echo "  Verifying secrets are live (waiting 5s for propagation)..."
sleep 5

# ── Verify via secrets list ───────────────────────────────────────────────
echo ""
echo "  Cloudflare Pages secrets currently set:"
npx wrangler pages secret list --project-name "$PROJECT" 2>/dev/null | grep -E "RAZORPAY|Name" || echo "  (run: npx wrangler pages secret list --project-name india-gully)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅  Razorpay setup complete!"
echo ""
echo "  Test your live integration:"
echo "  1. Open $LIVE_URL"
echo "  2. Log in as Super Admin"
echo "  3. Go to Admin → Integrations → Razorpay Health"
echo "     OR visit: $LIVE_URL/api/payments/razorpay-health"
echo ""
echo "  Expected response:"
echo '  { "key_mode": "live", "api_alive": true, "webhook_secret": "✅ Set" }'
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
