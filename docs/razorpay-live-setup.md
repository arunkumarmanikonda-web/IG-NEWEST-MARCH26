# Razorpay live-key setup

The owner confirmed live-key generation on 12 November 2026. Production now has live credentials staged in disabled mode, revision 3. Preview retains its separate test-mode configuration. No live charge has been made.

## Secure installation
In the Vercel india-gully project, add these as **Secret**, scoped to **Production only**:
- RAZORPAY_LIVE_KEY_ID: the generated rzp_live_ key ID.
- RAZORPAY_LIVE_KEY_SECRET: its matching secret.
- RAZORPAY_LIVE_WEBHOOK_SECRET: the separately chosen live webhook signing secret, when the production webhook is configured.

The owner saved the first two values privately. Vercel metadata confirms both exact variable names exist as Secret values scoped only to Production. Their contents were not retrieved for verification. The owner has saved the webhook secret privately in the application's encrypted integration settings. A Vercel copy is optional, not required. Never put secret values in chat, source control, screenshots or Preview/Development settings.

The owner is verified, has changed the initial password and completed MFA. The production import below has been completed successfully. In owner settings, use **Import production live credentials · keep payments disabled**. The operation requires owner MFA and current policy acceptance, checks production scope and the live-key prefix, replaces old test secrets and writes the normal encrypted configuration with payments disabled. Existing payment bindings remain unchanged. Active live configurations cannot be overwritten through this staging action.

Complete live webhook configuration and verify merchant activation and the approved legal/company release. Then enable live mode in production and complete the agreed payment/reconciliation/refund acceptance. Storing keys alone does not activate live collection. The exact live webhook endpoint must be confirmed after the production domain or relay is deployed; do not point a live webhook at the preview database.

## Validation
147 Node tests and the Next.js production build pass. A new owner/MFA-protected read-only credential check calls the Razorpay Orders API with GET and returns only acceptance status, never merchant order data. It creates no order, payment or refund. New regression coverage proves that staging is blocked in preview/development, rejects test or missing key pairs, preserves the payment limit, removes test-secret carry-over and cannot silently activate or overwrite live payments. Secure storage is verified; read-only provider credential validation has passed; live transaction acceptance remains outstanding.

The owner specifically approved the public production webhook relay on 13 November 2026 (India Standard Time). It is enabled with a dedicated bypass stored in production Vault, and a signed request successfully reached the protected Vercel destination. Payment collection and marketing remain disabled. See `production-webhook-release.md` for the verified configuration. The live Razorpay webhook signing secret is stored in the encrypted production configuration.

## Production credential acceptance

Production deployment `dpl_8VptWtFtRP95u3vvf8cX8x6JBvvU` from commit `c23ea8e6472ea48dec81930958ca12250a465963` is READY. The authenticated owner selected **Check saved Razorpay connection · no charge**, and the deployed UI reported that Razorpay accepted the credentials. No order, payment or refund was created. The merchant dashboard independently shows `https://indiagully.com` approved and the same live key ID. The live webhook `TzPZipJrb9jdqU` is enabled with the production Supabase receiver, akm@indiagully.com failure alerts, and payment.captured/payment.failed/refund.processed/refund.failed selected. The provider confirms a signing secret was supplied, and India Gully confirms its encrypted secret is stored at revision 3. Provider-originated delivery remains unverified.
