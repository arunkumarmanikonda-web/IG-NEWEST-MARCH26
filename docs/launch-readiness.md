# India Gully launch acceptance
Updated 11 November 2026. The live domain must remain on its existing host until the full acceptance suite passes.

## Implemented and tested
- GitHub repository is linked to Vercel project `india-gully`; the merged public site is deployed.
- Public pages and server valuation calculation verified on the deployment.
- Private Vercel Blob store provisioned in Mumbai with project environment binding. No confidential files have been uploaded; authenticated document delivery is pending the backend.
- SVG favicon and pinned-tab mask trace the supplied India Gully monogram. The original raster assets remain unchanged.
- Unique canonical, Open Graph and Twitter metadata; organisation, website, service, article and breadcrumb structured data; manifest; sitemap and robots routes.
- Indexing defaults to OFF. Enable only after domain acceptance using `SEARCH_INDEXING_ENABLED=true`, `VERCEL_ENV=production` and `NEXT_PUBLIC_SITE_URL=https://www.indiagully.com` (or the selected apex canonical). A preview hostname cannot pass this gate.
- Public opportunity projection is an allowlist. Exact address, coordinates, owner contacts and document fields are not emitted. Current portfolio references expose only city/region. Confidential identities need separate reviewed teaser copy, an opaque slug and reviewed imagery. This does not grant private access or make already-public named portfolio entries anonymous.
- Seven paused search campaign drafts with exact/phrase keyword mappings and length-validated ad text. Drafts are not keyword-volume research, Google policy approval, live ads or conversion tracking.
- Unit coverage includes indexing gates, public-field exclusion and confidential identity checks. CI now covers main and backend branches. Dependency update proposals are scheduled; automatic merging is not enabled.

## Blocking provider state
| Capability | Current state | Required evidence before launch |
|---|---|---|
| Database / identity | Dedicated Supabase preview in Mumbai; real password/MFA and session tests pass | Production isolation/configuration, SMTP, correct auth redirect allowlist, real email verification and recovery, compromised-password protection |
| CMS / CRUD | Database-backed content/user/category operations with audit; opportunities and articles read published snapshots | Owner onboarding, authenticated browser acceptance, complete static-section field mapping, media uploads and revision rollback UI |
| Resend | No installation or website credential | Verified sending domain, actual acknowledgement plus three recipient deliveries, webhook verification, retries and suppression |
| Google Workspace | No website OAuth client or mailbox grants | Per-user authorisation, encrypted tokens, scoped access, disconnect and thread tests |
| AI | No website generation integration | Authenticated and budgeted OpenAI draft generation, evidence references, revision review and failure tests |
| Runway | ChatGPT connector is not a website API credential | Provider account, credential, queue/retry/cancellation and output rights/provenance |
| HORECA commerce | No connected store | Authoritative catalogue, pricing, stock, cart, payment sandbox, order, refund and reconciliation tests |
| Vyapar | Public API not verified | Official supported interface for the actual licence/version; otherwise approved file exchange with reconciliation |
| NDA | No signing provider or approved template | Reviewed template, authenticated signer, verified provider event, signed evidence, restricted download/revocation tests |
| SMS | Fast2SMS not configured | Account, sender/template configuration, consent rules and delivery test |
| Marketing / SEM | Consent preferences persist; campaigns remain paused drafts | Suppression processing, unsubscribe delivery links, approved caps, provider access and independently verified conversions |
| Operations | Production acceptance outstanding | Backups and restore drill, monitoring, incident owner, retention, security review, mobile and accessibility QA |

The connected Vercel service can deploy and provision Blob. The separate CLI has no authenticated session and marketplace discovery returned `login_required`. The real preview backend is now provisioned and tested. Verification email delivery, owner onboarding and production configuration remain blocked.

## Search and conversion acceptance
Confirm every canonical resolves, redirects preserve valuable old URLs, private paths stay excluded, structured data matches visible facts, and sitemap includes only approved public content. Do not advertise old portfolio references as current sale mandates. Do not set `lead_submitted` on button clicks or a mailto opening: count it only after a server-persisted enquiry. Record payment conversions only from verified provider events. Enable analytics/remarketing according to the selected consent policy. Review debt/financial-services ad eligibility for the intended market before enabling that campaign.

Official references checked: [Google favicon](https://developers.google.com/search/docs/appearance/favicon-in-search), [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag), [Google supported meta tags](https://developers.google.com/search/docs/crawling-indexing/special-tags), [Google Ads responsive search ads](https://developers.google.com/google-ads/api/docs/responsive-search-ads/create-responsive-search-ads).

## PR #3 merge gates
Keep this PR in draft until: (1) the current commit passes CI and deployed preview checks; (2) Supabase Auth Site URL, preview callback allowlist, password strength/leaked-password checks and SMTP are configured; (3) AKM completes verified registration, TOTP and owner invitation activation; (4) production environment receives its own migrated database and secrets, or a separately approved staging-only release strategy is implemented. Full live-domain acceptance additionally requires the provider and operational rows above.
