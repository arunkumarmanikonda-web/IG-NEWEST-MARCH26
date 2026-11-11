# India Gully platform rebuild

Public rebuild merged to main; backend/search readiness work is on `backend/2026-11`. Existing indiagully.com production is unchanged.

## Implemented
Premium public advisory site, six practice pages, hospitality projects / PMC, HORECA procurement, four public portfolio references with search and taxonomy filters, three perspectives, leadership, contact, privacy and terms pages. Official enquiry details: hello@indiagully.com and +91 89889 88988. The contact brief opens the visitor's email client; it does not claim a server submission. The original server-side valuation API, three calculation models, CSV exports and print views are retained.

## Integration status
The managed CMS, authentication, customer database, commerce, email, SMS, NDA signing, Google Workspace mailboxes and AI / marketing providers are NOT connected. There is no simulated admin account or fake order state. Taxonomy labels are currently editable in source, pending the CMS. Runway's ChatGPT connection is not a website API credential.

Vercel has been reactivated. Project `india-gully` is linked to this repository; the merged public site is deployed at https://india-gully.vercel.app. Private Blob storage is provisioned in Mumbai. Supabase database creation was rejected for overdue organisation invoices. Neon and commerce provider provisioning remain pending.

## Validation
The merged homepage and income valuation flow were verified in the deployed browser. Search/privacy changes pass 54 tests and the production build. See the exact-commit Rebuild quality workflow. Full mobile/accessibility and end-to-end provider validation remain outstanding.

## Development
Node 22+. Run `npm ci`, `npm test`, `npm run build`. Provision actual provider resources before integrating private workflows. No customer data, private dossier, API key or token belongs in this repository.

## Extended operating platform
See [platform-expansion.md](docs/platform-expansion.md) for the AI CMS, editable taxonomy, registration and consent, NDA signing, user CRUD, per-user mail, enquiry routing, personalised marketing, SEO/SEM and security acceptance requirements. Pure domain modules under `lib/domain` implement permission and eligibility checks without pretending that providers are connected. Tests include negative cases for cross-user NDA access, revoked consent, mailbox grants and spend limits.

## Launch and commerce decisions
[Launch readiness](docs/launch-readiness.md) records verified work and actual blockers. [Commerce architecture](docs/commerce-architecture.md) separates custom HORECA procurement, Neon, Shopify and the existing Vyapar accounting workflow. Search campaign drafts are in `lib/search-marketing.mjs`.
