# India Gully platform rebuild

Vercel project `india-gully` is connected to this repository. Backend work is on `backend/2026-11`, PR #3. The existing indiagully.com domain remains on its current host.

## Working in the isolated preview
- Public advisory site, six practices, hospitality/PMC, HORECA procurement, valuation API, original branding, SVG favicons and gated search indexing.
- Dedicated Supabase project in Mumbai with password authentication, TOTP MFA, server-side sessions, role permissions enforced in the database and immediate session revocation.
- CMS drafts, revisions, exact-revision publishing, archive/restore/delete and separate public snapshots. Opportunities and perspectives read the database; other content types have published URLs. Existing static practice/layout sections still need full CMS field mapping.
- Editable categories/tags, staff invitations and revocation, user roles/status/profile editing, account closure, last-owner protection, audit trail and consent preferences.
- Enquiry persistence, request deduplication, rate limiting and four pending delivery records: three named internal recipients plus the customer. Messages are NOT sent until Resend is configured.

## Environment boundary
The database is `india-gully-preview`, reference `wktdgczjdocsnfgvcsat`. Its credentials are scoped to Vercel Preview and Development only. Production database/auth configuration is deliberately not shared with this test environment. Do not merge PR #3 or connect the live domain until the merge gates in [launch readiness](docs/launch-readiness.md) are resolved.

## Not yet activated
Preview redirects and strong password settings are saved. Verification/recovery email delivery still needs SMTP configuration and end-to-end testing. Resend, Google Workspace mailbox OAuth, OpenAI/Runway generation, SMS, commerce/checkout, Vyapar synchronisation and marketing delivery are not active. Recorded consents and delivery jobs do not imply a campaign or email was sent. Compromised-password protection must be enabled in Supabase Auth before launch.

## Development and verification
Node 22+. `npm ci`, `npm test`, `npm run build`. See `env.example` for variable names; keep values in ignored `.env.local` or Vercel environment settings. No service-role credential is exposed to the website. The private Supabase storage broker uses only its platform-managed server-side credential after user-scoped checks.

SQL schema changes live under `supabase/migrations` and are applied through the Supabase connector. Migration filenames are created with the Supabase CLI; the hosted migration ledger may use its own timestamp when applied through MCP. Do not blindly replay them onto this provisioned project. Apply the ordered files only to a new empty project, or reconcile the migration ledger before introducing CLI deployment automation.

Live integration scripts under `scripts/verify-*.mjs` use disposable fixtures in an isolated preview. `verify-supabase.mjs` tests Auth/MFA, RLS and CRUD; `verify-enquiries.mjs` tests ingestion and deduplication; `verify-web.mjs` starts the production server and tests the HTTP/session boundary. Fixture files and passwords are never committed. Pre-verified test identities do not prove registration email delivery. Always remove fixtures after testing.

Detailed scope: [platform expansion](docs/platform-expansion.md), [backend handover](docs/backend-handover.md), [launch readiness](docs/launch-readiness.md), [commerce architecture](docs/commerce-architecture.md).

## Expanded public experience and private rooms
Full About and leadership pages, selected work, CMS editorial content, NDA requests/acceptance, project data rooms, nested folders, bulk/local-folder upload, per-client and per-file download rules, and server-rendered watermarked previews. See [data-room guide](docs/data-rooms.md) and [customer experience audit](docs/customer-experience-audit.md). The agreement draft and real account email verification still require activation before operational use.
