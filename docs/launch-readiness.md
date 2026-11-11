# India Gully launch acceptance
Updated 12 November 2026 (India Standard Time). The live domain must remain on its existing host until the full acceptance suite passes.

## Implemented and tested
- GitHub repository is linked to Vercel project `india-gully`; the merged public site is deployed.
- Public pages and server valuation calculation verified on the deployment.
- Private Vercel Blob was provisioned during initial setup. The implemented data-room backend uses private Supabase Storage with project/NDA grants, previews and per-file download controls; see the data-room handover for the tested access boundaries.
- SVG favicon and pinned-tab mask trace the supplied India Gully monogram. The original raster assets remain unchanged.
- Unique canonical, Open Graph and Twitter metadata; organisation, website, service, article and breadcrumb structured data; manifest; sitemap and robots routes.
- Indexing defaults to OFF. Enable only after domain acceptance using `SEARCH_INDEXING_ENABLED=true`, `VERCEL_ENV=production` and `NEXT_PUBLIC_SITE_URL=https://www.indiagully.com` (or the selected apex canonical). A preview hostname cannot pass this gate.
- Public opportunity projection is an allowlist. Exact address, coordinates, owner contacts and document fields are not emitted. Current portfolio references expose only city/region. Confidential identities need separate reviewed teaser copy, an opaque slug and reviewed imagery. This does not grant private access or make already-public named portfolio entries anonymous.
- Seven paused search campaign drafts with exact/phrase keyword mappings and length-validated ad text. Drafts are not keyword-volume research, Google policy approval, live ads or conversion tracking.
- Unit coverage includes indexing gates, public-field exclusion and confidential identity checks. CI now covers main and backend branches. Dependency update proposals are scheduled; automatic merging is not enabled.

## Blocking provider state
| Capability | Current state | Required evidence before launch |
|---|---|---|
| Database / identity | Dedicated Supabase preview in Mumbai; SMTP enabled; staff verification emails delivered; owner verification, password change and MFA completed | Production isolation/configuration, remaining staff onboarding, full recovery journey, compromised-password protection (paid plan); preview redirects and strong password policy configured |
| CMS / CRUD | Database-backed content/user/category operations with audit; published snapshots; real owner login and protected CMS access observed | Remaining role-by-role browser acceptance, complete static-section field mapping, media uploads and revision rollback UI |
| Resend | Verified sender, acknowledgement plus three recipient notifications delivered; signed webhooks and recovery cron active | Production credential isolation and acceptance; forced-retry/bounce operational drills and production monitoring |
| Google Workspace | No website OAuth client or mailbox grants | Per-user authorisation, encrypted tokens, scoped access, disconnect and thread tests |
| AI | Source-based OpenAI drafting studio implemented with practice/MFA checks, request/token caps and unpublished-save review; disabled with no credential | API key and funded account, live generation acceptance; creative-provider connection remains pending |
| Runway | ChatGPT connector is not a website API credential | Provider account, credential, queue/retry/cancellation and output rights/provenance |
| HORECA commerce | Razorpay invoice collection enabled in preview test mode; INR 1 checkout captured; customer/admin reconciliation verified; signed relay and duplicate receipt checks passed | Provider refund attempt rejected with HTTP 400; resolve and complete refund/failure/webhook-only recovery acceptance. Full catalogue/pricing/stock/cart, reviewed commercial policies and production/live credentials remain pending |
| Vyapar | Public API not verified | Official supported interface for the actual licence/version; otherwise approved file exchange with reconciliation |
| NDA / data rooms | Typed-name, versioned acceptance; project review/grants; private folders, bulk upload, watermarked previews and download rules; private client engagements with one-action multi-email sharing | Owner-approved legal wording, real client acceptance, production storage/retention/restore and optional certified signature provider |
| SMS | Fast2SMS not configured | Account, sender/template configuration, consent rules and delivery test |
| Marketing / SEM | Consent preferences persist; campaigns remain paused drafts | Suppression processing, unsubscribe delivery links, approved caps, provider access and independently verified conversions |
| Operations | Production acceptance outstanding | Backups and restore drill, monitoring, incident owner, retention, security review, mobile and accessibility QA |

GitHub is connected to Vercel and the stable branch preview runs the real Supabase backend. Verification email delivery and owner onboarding are complete. Production configuration, remaining staff onboarding and the outstanding acceptance rows above still block full launch.

## Search and conversion acceptance
Confirm every canonical resolves, redirects preserve valuable old URLs, private paths stay excluded, structured data matches visible facts, and sitemap includes only approved public content. Do not advertise old portfolio references as current sale mandates. Do not set `lead_submitted` on button clicks or a mailto opening: count it only after a server-persisted enquiry. Record payment conversions only from verified provider events. Enable analytics/remarketing according to the selected consent policy. Review debt/financial-services ad eligibility for the intended market before enabling that campaign.

Official references checked: [Google favicon](https://developers.google.com/search/docs/appearance/favicon-in-search), [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag), [Google supported meta tags](https://developers.google.com/search/docs/crawling-indexing/special-tags), [Google Ads responsive search ads](https://developers.google.com/google-ads/api/docs/responsive-search-ads/create-responsive-search-ads).

## PR #3 merge gates
Keep this PR in draft. Implementation commit `4d444ae` passed 87 tests, production build and GitHub Actions run `43077098482`. Twenty-one rollback-only database assertions cover payment permissions, capture/refund bounds, duplicate receipts and non-regression. AKM completed mailbox verification, mandatory password rotation, policy acceptance and TOTP with protected CMS access. SMTP and real confirmation delivery are verified. Remaining merge gates are a full recovery journey, resolution of the compromised-password control, and a production environment with its own migrated database and secrets (or a separately approved staging-only release strategy). Full live-domain acceptance additionally requires the provider and operational rows above. A successful test-mode payment does not clear live-payment or legal approval gates.

## Payment recovery acceptance · 11 November 2026

The customer dashboard now offers **Check payment status**; the CMS offers **Reconcile with Razorpay** with verified payment/refund totals and timestamps. Both controls were exercised against the captured INR 1 sandbox payment on the deployed branch preview. Neither control charges the customer or initiates a refund. Checkout remains busy until completion or dismissal to reduce accidental repeated submissions.

The merchant webhook now subscribes to `payment.captured`, `payment.failed`, `refund.processed` and `refund.failed`. A clearly labelled synthetic event tested the actual public relay: missing signature HTTP 401, altered signed body HTTP 401, valid signature HTTP 200, repeated event HTTP 200 with one durable receipt. This is a synthetic relay test against a real provider-fetched payment, not evidence that Razorpay itself retried an event or that a lost checkout callback was recovered.

**Unresolved provider issue:** the merchant dashboard and one idempotent documented API request both rejected the test refund with `BAD_REQUEST_ERROR: invalid request sent` (API HTTP 400). The original payment remains captured, with INR 0 refunded. No refund success is claimed and no real money moved. Resolve this merchant/test-mode issue with Razorpay before live activation. Refund state handling has controlled-response and database coverage; real partial/full/failed-refund acceptance remains outstanding.


## Governance and payments update · 11 November 2026
See [governance-and-integrations.md](./governance-and-integrations.md) for the current implementation and complete activation blockers. Policies/settings, practice rights, privacy requests, Resend enquiry delivery and Razorpay invoice collection have been added. This does not clear the public-launch gates.

## Client engagement and AI drafting update · 12 November 2026

See [client-engagements.md](./client-engagements.md) and [ai-editorial.md](./ai-editorial.md). Added private client/contact/engagement administration, one-action sharing to multiple independently authenticated contacts, per-contact download rights, individual secure-link circulation and email-code sign-in. Feasibility, valuation, forensic audit and operational audit are included under Transaction Advisory. Validation: 95 Node tests, production build, 25 rollback-only client-room assertions and 12 rollback-only AI assertions passed. The hosted schema and sign-in-code email template are updated; provider credentials and production acceptance gates remain as listed above.

## 11 November 2026 provider and engine audit

See [provider-studio.md](provider-studio.md) and [platform-audit-2026-11-11.md](platform-audit-2026-11-11.md). Runway creative jobs/private storage/review controls and Fast2SMS DLT service-message jobs are now implemented, but no website keys or live acceptance are present. HORECA now reads published product records into a searchable catalogue; the full procurement/inventory engine and PMC operational registers remain incomplete. Published opportunities have a database-derived one-page print brief. These changes do not remove any production launch gate.
