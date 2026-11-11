# India Gully platform rebuild

Rebuild branch: `rebuild/2026-11`. Existing indiagully.com production is unchanged.

## Implemented
Premium public advisory site, six practice pages, hospitality projects / PMC, HORECA procurement, four public portfolio references with search and taxonomy filters, three perspectives, leadership, contact, privacy and terms pages. Official enquiry details: hello@indiagully.com and +91 89889 88988. The contact brief opens the visitor's email client; it does not claim a server submission. The original server-side valuation API, three calculation models, CSV exports and print views are retained.

## Integration status
The managed CMS, authentication, customer database, commerce, email, SMS, NDA signing, Google Workspace mailboxes and AI / marketing providers are NOT connected. There is no simulated admin account or fake order state. Taxonomy labels are currently editable in source, pending the CMS. Runway's ChatGPT connection is not a website API credential.

Vercel project creation on 11 November 2026 returned HTTP 402 resource_creation_blocked: account suspended; a valid payment method is required to reactivate. No project or production deployment was created.

## Validation
The expanded public-site production build passed locally, and the homepage and debt-advisory journey were inspected in the browser. The workspace disconnected before final QA and repository synchronization. This source was preserved through GitHub; check the latest Rebuild quality workflow for exact-commit tests and build. Responsive browser testing and end-to-end provider validation remain outstanding.

## Development
Node 22+. Run `npm ci`, `npm test`, `npm run build`. Provision actual provider resources before integrating private workflows. No customer data, private dossier, API key or token belongs in this repository.
