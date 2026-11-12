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
| Current activation | Razorpay live mode, revision 4; Resend transactional email enabled, revision 5; OpenAI and Runway enabled at revision 3; SMS and marketing delivery remain disabled |

The relay exposes only fixed provider/worker paths. It does not expose the admin dashboard, arbitrary URLs, database credentials or the Vercel bypass to callers. The Vercel bypass is a persistent credential with access to protected project deployments; compromise of the relay or its Vault credential is therefore a security risk. App authentication, MFA, database permissions and webhook signature checks remain enforced. Disable the relay and revoke its dedicated bypass to roll it back.

The dedicated production bypass is now stored in Supabase Vault as `ig_webhook_vercel_bypass`, and the production relay is enabled. The approval, scope and reviewed commit are recorded in the application audit log. The existing preview relay was unchanged. The earlier blocked attempt's unused bypass remains revoked; this release uses a newly created dedicated credential.

Verification: a signed, empty worker request traversed the public Supabase receiver to the protected Vercel application and returned HTTP 200 `Accepted` (pg_net request 3). Missing Razorpay signatures and invalid worker signatures returned HTTP 401; an unsupported relay path returned HTTP 404. Anonymous and authenticated roles cannot execute the relay-configuration RPC. All five external providers remain disabled, `campaign_delivery_enabled=false`, and the outbox, provider-job and campaign-delivery queues remain empty. No order, payment, refund or campaign was created.

The owner created live Razorpay webhook `TzPZipJrb9jdqU` on 13 November 2026 at 02:55 IST. The dashboard confirms it is enabled, has a signing secret and subscribes to all four required events. The owner then saved the same secret privately in India Gully; the UI confirms encrypted storage at disabled configuration revision 3. No secret was read or displayed. A Razorpay-originated event remains necessary to establish that the provider and application secrets match.

The receiver now authenticates unsupported event types and acknowledges unrelated merchant payments only after validating a current signing secret. Database/provider failures remain retryable, and owned payments retain their bound credentials and reconciliation evidence. The owner-only receiver diagnostic sends one altered-signature and one valid-signature non-payment event through the configured Supabase relay. It never calls a payment API or changes payment records. Seven regression tests cover these paths. All 147 Node tests and the Next.js production build pass.

## Production acceptance and activation

Production deployment `dpl_2296UHjs56udzrJaqJPyPmBUHdQa`, commit `22ebe8dc0eacd802ed95a4dc61a7ce10d3c0dc9f`, is READY. The real owner UI receiver diagnostic passed: a valid saved signature returned 200 and an altered signature returned 401. Following the owner's request to move payments to live, the verified merchant flag and live mode were saved at revision 4. A database read independently confirms live mode. There are zero payment requests and no charge or refund was created. No Razorpay-originated live event or transaction has yet been verified; the diagnostic does not establish that the secret stored in Razorpay matches the application secret. Campaign delivery remains disabled and all delivery queues remain empty. Production runtime error/fatal logs returned no entries during acceptance.

## Resend provider-originated acceptance

Production Resend webhook 6abf8bc5-3619-4261-a737-a7f58c69466f is enabled for five delivery/failure events. Its real signed email.delivered event reached this relay, returned HTTP 200 Accepted and updated the application delivery record on the first attempt. The single message was a labelled verification addressed only to the owner. See `production-email-release.md`. This proves the Resend production secret matches the provider; Razorpay-originated acceptance remains a separate outstanding check.
