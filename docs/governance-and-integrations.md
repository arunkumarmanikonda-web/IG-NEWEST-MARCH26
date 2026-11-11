# Governance and integration handover · 11 November 2026

## Company identity

- Legal entity: **Vivacious Entertainment and Hospitality Private Limited**.
- Brand: **India Gully**.
- CIN: **U74999DL2017PTC323237**. Corroborated by the existing company website and two public company directories; a current authenticated MCA extract was not obtained.
- GSTIN: **07AAGCV0867P1ZN**, supplied by the owner and matching the existing website. No claim of live GST-registration verification is made.
- General service email: **hello@indiagully.com**.
- Official telephone: **+918988988988**.
- Enquiry recipients: **akm@indiagully.com**, **pavan@indiagully.com**, **amit.jhingan@indiagully.com**.
- Registered office confirmed by owner: **QTR NO. 229, Four Storey, Tagore Garden Extn., New Delhi, Delhi, 110027, India**. Appointed grievance officer name/designation remain outstanding.

## Implemented

Owner-only `/admin/settings` requires verified identity, current policy acceptance, changed initial password and MFA. Provider secrets are encrypted using AES-256-GCM with provider-bound associated data. The encryption root is a server-only Vercel variable; the database holds its hash and encrypted provider credentials. Client responses and audit records do not contain secret values. Configuration changes use optimistic versions and are read without persistent caching on subsequent requests. These are supported runtime settings, not permission to execute arbitrary generated code or migrate databases.

Eight versioned policies cover privacy, data usage, website terms, cookies, procurement, refunds, delivery and grievances. Published bundles retain exact text and SHA-256. A new release requires renewed account acceptance and records its hash; it does not rewrite signed NDAs or previous payment acceptance. The initial expanded release remains explicitly unreviewed for public-commerce activation. Owner publication requires a legal-review declaration. This is a technical control, not a substitute for qualified Indian legal review.

The owner can assign each staff member a practice-rights matrix. Roles impose a ceiling; practice rights further restrict read, edit, publish, enquiries, NDA/data-room and commerce actions. Read/write checks apply in database policies and privileged RPCs, not just navigation. Role/scope updates revoke sessions. AKM is owner; Pavan and Amit are administrators with all eight current practice scopes. Other staff default to no scopes. Only the owner may assign staff roles/scopes. Clients receive project grants independently of employee practice assignments.

Account privacy requests have references, statuses, responses and acknowledgement/resolution deadlines. Requests are private to their subject and the owner. Erasure is reviewed against contractual and statutory retention; the application does not silently delete signed evidence.

Resend adapter: enquiry capture, configured internal routing, acknowledgement, database queue, leased processing, stable provider idempotency keys, bounded retries within 23 hours, signed timestamp-checked webhooks and bounce/complaint suppression. New enquiries trigger processing; the owner can process pending messages. A Supabase Cron recovery job runs every two minutes when eligible email jobs exist. `accepted` means provider acceptance, not delivery. Authentication verification/recovery email still uses Supabase SMTP and must be configured separately.

Razorpay adapter: administrator-issued invoice/accepted-quote payment requests, practice access checks, customer-specific dashboard, server-fixed INR/paise totals, provider Orders API, checkout, signature verification, server fetch of captured payment, matching amount/currency/order and webhook reconciliation. Customer and authorised staff controls can re-fetch the provider status without issuing a charge. Captured and refunded totals, reconciliation timestamps and durable webhook receipts are recorded. Duplicate events and older responses cannot undo a recorded captured payment or increase refunds beyond the captured amount. An ambiguous order-creation failure remains `initializing` for manual investigation instead of blindly creating another payable order. Payment credentials are encrypted in a binding for the initiated transaction so later key changes do not rewrite its verification context. Refund initiation remains in the merchant dashboard; the website reconciles provider-reported refund totals. Automated refunds, tax-invoice generation, inventory and third-party seller settlement are not implemented. This is invoice collection, not a complete retail cart or regulated escrow arrangement.

## Activation status and launch gates

| Item | Status / requirement |
|---|---|
| Supabase | Connected in preview, Mumbai. No Neon required. |
| Resend | Enabled on preview. Verified domain, server-only Vercel Secrets, signed webhook relay and automatic recovery configured. All four authorised test messages delivered on 11 November 2026. |
| Auth email | Supabase custom SMTP is enabled with a separate sending-only Resend key, sender `hello@indiagully.com`, host `smtp.resend.com`, port 465. Verification emails were delivered to Arun, Pavan and Amit. Arun completed email verification, policy acceptance, private password change and TOTP; protected CMS access was observed on the stable preview. Other staff onboarding and a full recovery journey remain pending. |
| Razorpay | Test mode enabled, encrypted CMS credentials stored, INR 100 limit. INR 1 checkout/capture, customer/admin status checks and signed relay/duplicate checks passed. The dashboard and documented API rejected a simulated refund with HTTP 400 / `invalid request sent`; refund acceptance remains blocked. Live credentials/activation, failure/recovery scenarios and production acceptance remain pending. Live activation additionally requires confirmed statutory details, reviewed legal release and production environment. |
| OpenAI / Runway | Editorial and creative workflows not connected. Reserved configuration fields do not activate generation. |
| Fast2SMS | Optional; reserved configuration fields only. DLT principal entity, sender, template, credentials and consent-controlled delivery workflow remain required. No SMS sent. |
| Google Workspace | Per-user OAuth/mail grants not implemented. Do not use shared Google passwords. |
| Shopify | Not required for the present advisory/procurement quote architecture. A future retail catalogue/cart/fulfilment decision is separate. |
| Vyapar | No verified API/accounting connector connected. Payment receipts are not GST invoices. |
| Legal operations | Confirm grievance appointment; counsel review policies/NDA and actual business model; implement operational retention, incident response and vendor agreements. |
| Security | Database access tests pass; independent penetration test, restore drill, full log-retention/India-residency assessment and upload malware scanning remain pending. Supabase leaked-password protection requires the applicable paid plan and remains disabled. |
| Production | No live domain cutover or production database activation. PR remains draft. |

## Regulatory review basis

Reviewed official sources on 11 November 2026. Applicability must be assessed against actual services and commencement dates; do not market the site as certified, SEBI-registered, CERT-In compliant or fully DPDP compliant without evidence.

- DPDP Rules 2025 and staged commencement: https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf . The notification stages commencement; the principal operational rules are not all effective as of this review. Existing IT/privacy obligations and contractual duties still require attention.
- Consumer Protection rules and the notified 2026 e-commerce amendment: https://consumeraffairs.gov.in/pages/consumer-protection-acts and https://consumeraffairs.gov.in/public/upload/files/E%20Commerce%20Amendment%20Rules%202026_1789127949.pdf . Review marketplace versus inventory/own-seller duties, seller disclosures, grievance process and the January 2027 commencement before public commerce launch.
- CERT-In directions: https://www.cert-in.org.in/PDF/CERT-In_Directions_70B_28.04.2022.pdf . Operational incident-reporting and logging obligations cannot be satisfied by a policy page alone; retain an incident owner, escalation procedure and verified infrastructure configuration.
- IT/SPDI clarification: https://www.meity.gov.in/writereaddata/files/PressNote_25811.pdf . Scope and application should be checked with the actual data collected.
- Razorpay verification: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps and https://razorpay.com/docs/webhooks/validate-test . Server verification and captured-state checks are implemented; successful provider sandbox evidence is recorded below. Live operation and broader failure/refund scenarios are separate acceptance checks.
- Resend: https://resend.com/docs/api-reference/emails/send-email . Stable idempotency keys are used within the provider's 24-hour window.

Additional prelaunch checks: relevant state RERA agent/project disclosures; CIRP official notices/eligibility and authorised representations; no unsupported regulated-investment claims; GST invoice/HSN/SAC/place-of-supply and e-invoice applicability; packaged-commodity/product disclosures where applicable; advertising/endorsement and dark-pattern controls; DLT requirements for commercial SMS. These depend on the actual mandate, products, turnover and operating model, not merely site code.

## Verification

87 local tests and the production build passed for implementation commit `4d444ae`; GitHub Actions run `43077098482` also passed. Twenty-one rollback-only database assertions additionally cover payment permissions, capture/refund bounds, duplicate receipts and non-regression. The previous data-room flow passed 32 real Auth/API/storage checks. The governance/payment flow passed 19 real Auth/database checks, including payment-disabled and queue-disabled behaviour. Four additional transactional scope checks confirmed assigned HORECA write/read access while denying debt access and ungranted publication. Twelve rollback-only database assertions cover email delivery and relay authorisation. Real Resend delivery and successful Razorpay checkout evidence are recorded below. Documentation updates do not change the tested implementation.

## Resend activation, 11 November 2026

The owner supplied `RESEND_API_KEY` directly as a Vercel Preview Secret. The application resolves Vercel Secrets on the server; a super-user CMS credential override takes precedence and is stored separately. Clearing a CMS override does not delete the Vercel Secret. No credentials are returned by settings pages.

`indiagully.com` is verified in Resend (domain ID `df960985-c9fd-4231-9573-5dde223dae60`). A dedicated webhook (`828213fe-579f-4030-9bd2-54aa4fa24b0b`) subscribes to delivered, bounced, complained, suppressed and failed events. Its signing secret is a separate Preview Secret. Existing Google Workspace MX records were not changed. Authentication SMTP was subsequently configured separately with a dedicated key entered directly by the owner.

An authorised, clearly labelled system-test enquiry (`38ec9965-269c-4f8d-9422-49def449069c`) was submitted through the deployed preview API. Resend reported all four messages delivered through the real signature-verified webhook path: acknowledgement to `akm@indiagully.com`, and internal enquiry notifications separately to Arun, Pavan and Amit. Each completed on its first attempt with no recorded error. The test enquiry is closed; delivery records remain as evidence. The two-minute recovery cron is active and its latest scheduled executions succeeded; this observation is scheduler evidence, not a separate forced-retry delivery test.

Providers call the public Supabase `ig-provider-webhook/resend` or `/razorpay` endpoint. It forwards bounded raw bytes and original signature headers to allowlisted application routes. Only a service-role RPC can read the routing credentials, which are encrypted in Vault. Provider signatures are verified in the application before any event is accepted. The Vercel bypass remains private to the relay. The receiver never relays application response bodies or credentials.

Recovery uses four-job batches, five-minute leases, exponential retry delays and a 23-hour idempotency window. Complete email bodies are frozen before sending. Early delivery events are retained and reconciled when the email ID binds; duplicate events cannot undo bounce suppression. Permanent provider failures stop automatic retries. The cron HTTP queue carries only a five-minute HMAC for the empty worker action, not permanent credentials.

Validation: 77 local tests and production build; 12 rollback-only database assertions cover early events, duplicate delivery, suppression, unchanged retry bodies, retry backoff and denied client access to relay credentials. Test fixtures are rolled back.

## Authentication email activation

The dedicated Supabase Auth SMTP key is separate from the existing Vercel transactional-email key. Neither secret is committed. Branded confirmation and recovery templates are versioned under `supabase/templates/` and saved in the Supabase dashboard. These use single-use email codes, avoiding dependence on the browser that initiated a PKCE request and avoiding consumption of verification links by email scanners. Codes are submitted only in same-origin POST bodies, never in URLs. Verification permits only email confirmation and recovery, establishes server-side session cookies and uses fixed internal destinations. Existing role, policy, password-change and MFA restrictions still apply.

The deployed `/auth/verify` screen was inspected in the browser. All 80 local tests and the production build passed, and GitHub Actions passed for `a1ee903`. Arun's `Verify your India Gully account` email was confirmed delivered in Resend (email ID `01a1cb98-3ae7-7d5d-83e8-ac8853cd8912`). Pavan's and Amit's verification emails were also confirmed delivered. No staff verification codes were exposed to the agent; Arun entered his own through the secure sign-in flow.

An additional disposable-account end-to-end test did not produce a completed, retained report: automatic approval review stopped further access because repeated requests could continue modifying QA accounts. It is not reported as a passing suite. The temporary account and sessions were removed, temporary local credentials deleted, and the one-time provisioning endpoint returned to a JWT-protected 410 response (version 9). This does not invalidate the subsequently observed real owner flow: Arun completed email verification, current policy acceptance, initial-password replacement and TOTP verification. A fresh password login and protected super-user workspace were observed on the stable branch preview. Unverified authenticators are now resumable after refresh; two regression tests cover the verified-only SDK convenience list. Other staff onboarding and a full recovery journey remain launch checks.

## Razorpay sandbox activation and evidence

On 11 November 2026, the owner generated the test key and supplied its secret and webhook secret directly through the protected settings screens. CMS revision 2 is in `test` mode with encrypted `key_secret` and `webhook_secret`. No secret values are committed or displayed. The maximum permitted test request is 10,000 paise (INR 100). The existing merchant dashboard shows `indiagully.com` as Approved; this is not a substitute for production activation checks.

Webhook `TyxWKdWTMf93zb` is Enabled and now subscribed to `payment.captured`, `payment.failed`, `refund.processed` and `refund.failed`, targeting the public Supabase relay `/ig-provider-webhook/razorpay`. The owner-created INR 1 simulation was prepared through the staff UI under the reference `SYSTEM-TEST-RAZORPAY-20261111`, with an explicit description that it represents no supply, tax invoice, debt or real payment. The owner completed the checkout confirmation and simulated payment.

| Evidence | Observed result |
|---|---|
| Application request | `ceafebab-8c51-42b0-b0d8-980fb3690c97`, 100 paise, mode `test` |
| Provider order | `order_TyxcxJ5AKZGlYz` |
| Provider payment | `pay_TyxdqGDnKB2QIZ` |
| Customer dashboard | `Payment verified and recorded.` and `paid · TEST MODE; no real money` |
| Database | `paid`, recorded at `2026-11-11 18:06:10.004811+00` |
| Public capture relay | Supabase function log: `POST | 200 | .../ig-provider-webhook/razorpay` at `2026-11-11T18:06:10.029000` |

The checkout handler requires a valid payment signature and a server fetch confirming captured status, exact amount, INR currency and matching order before showing the verified result. The observed callback and relay response establish the successful sandbox path. The labelled test row remains as audit evidence; no real money moved. Live mode and domain cutover remain disabled.

### Recovery controls and event evidence

Deployment `dpl_Er9vb5Ucy3iKgm8tLFYnPaSF4grZ` served implementation `4d444ae`. The customer **Check payment status** control returned `Payment verified and recorded.` after fetching the actual Razorpay payment. The owner then used **Reconcile with Razorpay** in the protected CMS; the register confirmed the provider check and persisted `last_reconciled_at = 2026-11-11 18:32:50.057129+00`. The verified payment remained captured, 100 paise, with zero refunded.

Migration `20261111181658_payment_reconciliation_evidence.sql` adds private event receipts and payment evidence fields. Staff reconciliation requires current identity, MFA and commerce scope; customers may reconcile only their own request. A database timestamp limits refresh requests. Webhook receipts use provider event ID (or a raw-body hash fallback); reusing an ID with different bytes is rejected. Event storage and payment changes commit together. Webhook validation accepts the bound/current secret and explicit previous secret only within the same payment mode, allowing controlled rotation without rewriting transaction credentials. Live provider rotation remains untested.

Four bounded HTTP tests exercised the public relay on the exact sandbox request:

| Test | Result |
|---|---|
| Missing signature | HTTP 401 |
| Altered body with the original signature | HTTP 401 |
| Correctly signed synthetic capture event | HTTP 200; server fetched the actual captured payment |
| Exact repeated synthetic event | HTTP 200; only one private receipt stored |

The receipt is explicitly named `IG-SYNTHETIC-REPLAY-20261111-A`, timestamp `2026-11-11 18:33:40.140738+00`. It is synthetic test evidence, not a Razorpay-generated event. The original successful capture event predates the new receipt table and is supported by the earlier relay log; it was not backfilled as a fabricated receipt.

### Refund acceptance blocker

Razorpay showed the INR 1 test payment as captured and its refund list was empty. A full refund attempted through the merchant dashboard returned `invalid request sent`. One request through the documented normal-refund API, with explicit `speed: normal`, 100-paise amount and fixed `X-Refund-Idempotency`, independently returned HTTP 400, `BAD_REQUEST_ERROR`, `invalid request sent`. No retry loop or live-mode fallback was used. No successful refund or bank credit is claimed.

This provider-side request failure must be resolved before real refund acceptance can pass. The implementation's partial/full-refund and stale-response protections passed controlled-response and rollback-only database tests; these do not prove provider completion. Failed/cancelled checkout, callback-absent recovery, real provider redelivery, automatic refunds of uncaptured payments and secret rotation remain additional provider acceptance cases. Review pending/failed-refund semantics against actual provider responses before live use. Refund API reference checked: https://razorpay.com/docs/api/refunds/normal-refunds-idempotent . Refund event reference: https://razorpay.com/docs/webhooks/refunds .
