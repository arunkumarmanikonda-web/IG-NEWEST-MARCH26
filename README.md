# India Gully platform rebuild

Vercel project `india-gully` is connected to this repository. Backend work is on `backend/2026-11`, PR #3. The existing indiagully.com domain remains on its current host.

## Working in the isolated preview
- Public advisory site, six practices, hospitality/PMC, HORECA procurement, valuation API, original branding, SVG favicons and gated search indexing.
- Dedicated Supabase project in Mumbai with password authentication, TOTP MFA, server-side sessions, role permissions enforced in the database and immediate session revocation.
- CMS drafts, revisions, exact-revision publishing, archive/restore/delete and separate public snapshots. Opportunities and perspectives read the database; other content types have published URLs. Existing static practice/layout sections still need full CMS field mapping.
- Editable categories/tags, staff invitations and revocation, user roles/status/profile editing, account closure, last-owner protection, audit trail and consent preferences.
- Enquiry persistence, request deduplication, rate limiting and Resend delivery to three named internal recipients plus the customer. All four authorised provider test messages were delivered.

## Environment boundary
The database is `india-gully-preview`, reference `wktdgczjdocsnfgvcsat`. Its credentials are scoped to Vercel Preview and Development only. Production database/auth configuration is deliberately not shared with this test environment. Do not merge PR #3 or connect the live domain until the merge gates in [launch readiness](docs/launch-readiness.md) are resolved.

## Current delivery status
The corporate white/charcoal refresh uses the supplied India Gully logos, SVGs and favicons across the public site and management suite. Independent CMS, listings, clients, data rooms, HORECA and PMC workspaces are implemented.

HORECA supports brand-PDF import into product drafts with source images/specifications, automatic SKUs and admin overrides, alongside CSV import, image upload, enhancement and generation. See [catalogue imports](docs/catalogue-import.md).

Resend authentication/enquiry delivery, OpenAI intake and Runway image workflows have real preview acceptance evidence. Razorpay remains in test mode. Google mailbox OAuth, production marketing and live payments require activation. Vyapar is excluded at the owner's direction. The authoritative status and remaining launch dependencies are in [launch readiness](docs/launch-readiness.md).

## Development and verification
Node 22+. `npm ci`, `npm test`, `npm run build`. See `env.example` for variable names; keep values in ignored `.env.local` or Vercel environment settings. No service-role credential is exposed to the website. The private Supabase storage broker uses only its platform-managed server-side credential after user-scoped checks.

SQL schema changes live under `supabase/migrations`. The 41 existing migration filenames match the hosted India Gully preview ledger, verified on 12 November 2026; their SQL is unchanged. GitHub deployment can therefore identify changes already applied to this project. New migrations must retain their committed version IDs. Configure the exact repository, project and branch in the Supabase GitHub integration before enabling automatic deployment. `supabase/config.toml` declares the three runtime Edge Functions and disables automatic editorial seeding; credentials, SMTP and callback URLs remain environment-specific. See [deployment connections](docs/deployment-connections.md).

Live integration scripts under `scripts/verify-*.mjs` use disposable fixtures in an isolated preview. `verify-supabase.mjs` tests Auth/MFA, RLS and CRUD; `verify-enquiries.mjs` tests ingestion and deduplication; `verify-web.mjs` starts the production server and tests the HTTP/session boundary. Fixture files and passwords are never committed. Pre-verified test identities do not prove registration email delivery. Always remove fixtures after testing.

Detailed scope: [platform expansion](docs/platform-expansion.md), [backend handover](docs/backend-handover.md), [launch readiness](docs/launch-readiness.md), [commerce architecture](docs/commerce-architecture.md).

## Expanded public experience and private rooms
Full About and leadership pages, selected work, CMS editorial content, NDA requests/acceptance, project data rooms, nested folders, bulk/local-folder upload, per-client and per-file download rules, and server-rendered watermarked previews. See [data-room guide](docs/data-rooms.md) and [customer experience audit](docs/customer-experience-audit.md). Owner email verification and MFA are complete. Legal release confirmation and other staff onboarding remain in the launch checklist.
