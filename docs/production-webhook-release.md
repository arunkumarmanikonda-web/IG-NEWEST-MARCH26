# Production webhook relay approval

Prepared, not enabled. Automatic approval review requires specific owner authorization for the persistent production relay.

| Item | Exact configuration |
|---|---|
| Public Razorpay receiver | https://szmsvxbqtakzbfpvgeth.supabase.co/functions/v1/ig-provider-webhook/razorpay |
| Production destination | https://india-gully.vercel.app/api/webhooks/razorpay |
| Vercel project | india-gully, prj_LpEXfQ3Unz9FKm0yMELtgToGCUsH |
| Database | India Gully Pro, Mumbai, szmsvxbqtakzbfpvgeth |
| Required Razorpay events | payment.captured, payment.failed, refund.processed, refund.failed |
| Failure alert | akm@indiagully.com |
| Relay credential | Dedicated Vercel automation bypass, stored only in production Supabase Vault; never in provider URLs |
| Provider authentication | A separate live Razorpay webhook secret; the destination checks the original payload signature and payment binding |
| Other fixed relay paths | Signed Resend delivery events and HMAC-authenticated transactional/provider worker requests |
| Still disabled | Payment collection, all provider integrations and marketing delivery; activation is a separate step after acceptance |

The relay exposes only fixed provider/worker paths. It does not expose the admin dashboard, arbitrary URLs, database credentials or the Vercel bypass to callers. The Vercel bypass is a persistent credential with access to protected project deployments; compromise of the relay or its Vault credential is therefore a security risk. App authentication, MFA, database permissions and webhook signature checks remain enforced. Disable the relay and revoke its dedicated bypass to roll it back.

Approval requested: enable this production relay and store its dedicated credential in Supabase Vault while payment collection and campaign sending remain disabled. The earlier attempt was blocked before any database change; the newly generated unused Vercel bypass was revoked. The existing preview relay was unchanged. No live Razorpay webhook has been created yet.
