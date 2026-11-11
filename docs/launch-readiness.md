# India Gully launch acceptance
Updated 11 November 2026. The live domain must remain on its existing host until the full acceptance suite passes.

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
| AI | No website generation integration | Authenticated and budgeted OpenAI draft generation, evidence references, revision review and failure tests |
| Runway | ChatGPT connector is not a website API credential | Provider account, credential, queue/retry/cancellation and output rights/provenance |
| HORECA commerce | Razorpay invoice collection enabled in preview test mode; INR 1 checkout captured and recorded paid; capture webhook returned HTTP 200 | Full catalogue/pricing/stock/cart; payment failure, webhook-only recovery and refund tests; reviewed commercial policies; production/live credentials and acceptance |
| Vyapar | Public API not verified | Official supported interface for the actual licence/version; otherwise approved file exchange with reconciliation |
| NDA / data rooms | Typed-name, versioned acceptance; project review/grants; private folders, bulk upload, watermarked previews and download rules | Owner-approved legal wording, real client acceptance, production storage/retention/restore and optional certified signature provider |
| SMS | Fast2SMS not configured | Account, sender/template configuration, consent rules and delivery test |
| Marketing / SEM | Consent preferences persist; campaigns remain paused drafts | Suppression processing, unsubscribe delivery links, approved caps, provider access and independently verified conversions |
| Operations | Production acceptance outstanding | Backups and restore drill, monitoring, incident owner, retention, security review, mobile and accessibility QA |

GitHub is connected to Vercel and the stable branch preview runs the real Supabase backend. Verification email delivery and owner onboarding are complete. Production configuration, remaining staff onboarding and the outstanding acceptance rows above still block full launch.

## Search and conversion acceptance
Confirm every canonical resolves, redirects preserve valuable old URLs, private paths stay excluded, structured data matches visible facts, and sitemap includes only approved public content. Do not advertise old portfolio references as current sale mandates. Do not set `lead_submitted` on button clicks or a mailto opening: count it only after a server-persisted enquiry. Record payment conversions only from verified provider events. Enable analytics/remarketing according to the selected consent policy. Review debt/financial-services ad eligibility for the intended market before enabling that campaign.

Official references checked: [Google favicon](https://developers.google.com/search/docs/appearance/favicon-in-search), [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag), [Google supported meta tags](https://developers.google.com/search/docs/crawling-indexing/special-tags), [Google Ads responsive search ads](https://developers.google.com/google-ads/api/docs/responsive-search-ads/create-responsive-search-ads).

## PR #3 merge gates
Keep this PR in draft. Implementation commit `554a7d5` passed 82 tests, build and CI, and AKM completed mailbox verification, mandatory password rotation, policy acceptance and TOTP with protected CMS access. SMTP and real confirmation delivery are verified. Remaining merge gates are a full recovery journey, resolution of the compromised-password control, and a production environment with its own migrated database and secrets (or a separately approved staging-only release strategy). Full live-domain acceptance additionally requires the provider and operational rows above. A successful test-mode payment does not clear live-payment or legal approval gates.


## Governance and payments update · 11 November 2026
See [governance-and-integrations.md](./governance-and-integrations.md) for the current implementation and complete activation blockers. Policies/settings, practice rights, privacy requests, Resend enquiry delivery and Razorpay invoice collection have been added. This does not clear the public-launch gates.
