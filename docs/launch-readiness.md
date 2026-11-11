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
| Database / identity | Supabase project creation rejected for overdue organisation invoices; existing projects inactive. Neon is available but not connected. | Provisioned database, migrations, real verified sign-up/login, staff MFA, cross-role negative tests, session revocation and recovery |
| CMS / CRUD | Not implemented against a real provider | Create, update, publish, archive/restore, taxonomy change and user lifecycle each persisted and audited |
| Resend | No installation or website credential | Verified sending domain, actual acknowledgement plus three recipient deliveries, webhook verification, retries and suppression |
| Google Workspace | No website OAuth client or mailbox grants | Per-user authorisation, encrypted tokens, scoped access, disconnect and thread tests |
| AI | No website generation integration | Authenticated and budgeted OpenAI draft generation, evidence references, revision review and failure tests |
| Runway | ChatGPT connector is not a website API credential | Provider account, credential, queue/retry/cancellation and output rights/provenance |
| HORECA commerce | No connected store | Authoritative catalogue, pricing, stock, cart, payment sandbox, order, refund and reconciliation tests |
| Vyapar | Public API not verified | Official supported interface for the actual licence/version; otherwise approved file exchange with reconciliation |
| NDA | No signing provider or approved template | Reviewed template, authenticated signer, verified provider event, signed evidence, restricted download/revocation tests |
| SMS | Fast2SMS not configured | Account, sender/template configuration, consent rules and delivery test |
| Marketing / SEM | Draft strategy only | Consents, audience suppression, approved caps, provider access and independently verified conversions |
| Operations | Production acceptance outstanding | Backups and restore drill, monitoring, incident owner, retention, security review, mobile and accessibility QA |

The connected Vercel service can deploy and provision Blob. The separate CLI has no authenticated session and marketplace discovery returned `login_required`. Database/login code must not be labelled operational until a real backend is provisioned and tested.

## Search and conversion acceptance
Confirm every canonical resolves, redirects preserve valuable old URLs, private paths stay excluded, structured data matches visible facts, and sitemap includes only approved public content. Do not advertise old portfolio references as current sale mandates. Do not set `lead_submitted` on button clicks or a mailto opening: count it only after a server-persisted enquiry. Record payment conversions only from verified provider events. Enable analytics/remarketing according to the selected consent policy. Review debt/financial-services ad eligibility for the intended market before enabling that campaign.

Official references checked: [Google favicon](https://developers.google.com/search/docs/appearance/favicon-in-search), [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag), [Google supported meta tags](https://developers.google.com/search/docs/crawling-indexing/special-tags), [Google Ads responsive search ads](https://developers.google.com/google-ads/api/docs/responsive-search-ads/create-responsive-search-ads).
