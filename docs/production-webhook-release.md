# Production webhook relay release

Enabled after the owner's explicit “approve relay” authorization on 13 November 2026 (India Standard Time). The approved configuration was reviewed at commit `101fe0cc6096a5a73e80f8e231654e243f3122dc`.

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

The dedicated production bypass is now stored in Supabase Vault as `ig_webhook_vercel_bypass`, and the production relay is enabled. The approval, scope and reviewed commit are recorded in the application audit log. The existing preview relay was unchanged. The earlier blocked attempt's unused bypass remains revoked; this release uses a newly created dedicated credential.

Verification: a signed, empty worker request traversed the public Supabase receiver to the protected Vercel application and returned HTTP 200 `Accepted` (pg_net request 3). Missing Razorpay signatures and invalid worker signatures returned HTTP 401; an unsupported relay path returned HTTP 404. Anonymous and authenticated roles cannot execute the relay-configuration RPC. All five external providers remain disabled, `campaign_delivery_enabled=false`, and the outbox, provider-job and campaign-delivery queues remain empty. No order, payment, refund or campaign was created.

The live Razorpay webhook draft is prepared but not saved. The owner must enter a new private webhook signing secret in Razorpay and save the same value in India Gully's production integration settings before provider webhook acceptance and payment activation.
