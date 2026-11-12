# Razorpay live-key setup

The owner confirmed live-key generation on 12 November 2026. The website remains in test mode, revision 2. No live charge has been made.

## Secure installation
In the Vercel india-gully project, add these as **Secret**, scoped to **Production only**:
- RAZORPAY_LIVE_KEY_ID: the generated rzp_live_ key ID.
- RAZORPAY_LIVE_KEY_SECRET: its matching secret.
- RAZORPAY_LIVE_WEBHOOK_SECRET: the separately chosen live webhook signing secret, when the production webhook is configured.

The owner saved the first two values privately. Vercel metadata confirms both exact variable names exist as Secret values scoped only to Production. Their contents were not retrieved for verification. The live webhook secret is not yet configured. Never put secret values in chat, source control, screenshots or Preview/Development settings.

After the production database and deployment are ready, redeploy to load the production secrets. In owner settings, use **Import production live credentials · keep payments disabled**. The operation requires owner MFA and current policy acceptance, checks production scope and the live-key prefix, replaces old test secrets and writes the normal encrypted configuration with payments disabled. Existing payment bindings remain unchanged. Active live configurations cannot be overwritten through this staging action.

Complete live webhook configuration and verify merchant activation and the approved legal/company release. Then enable live mode in production and complete the agreed payment/reconciliation/refund acceptance. Storing keys alone does not activate live collection. The exact live webhook endpoint must be confirmed after the production domain or relay is deployed; do not point a live webhook at the preview database.

## Validation
136 Node tests and the Next.js production build pass. New regression coverage proves that staging is blocked in preview/development, rejects test or missing key pairs, preserves the payment limit, removes test-secret carry-over and cannot silently activate or overwrite live payments. Secure storage is verified; actual provider credential validation and live transactions remain outstanding until production is configured.
