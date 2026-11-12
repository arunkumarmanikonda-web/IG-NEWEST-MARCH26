# India Gully launch acceptance
Updated 12 November 2026 (India Standard Time). This is the current status record and supersedes dated status paragraphs in earlier architecture documents.

## Working implementation

| Workspace / journey | Implemented behaviour | Evidence |
|---|---|---|
| Website and CMS | About, leadership, practices, opportunities, insights, legal pages, SEO, valuation; separated CMS and listings; revisions, publication, archive and taxonomy | Preview deployment, build and automated coverage |
| Global clients and data rooms | Shared client directory, independent practice engagements, folders/bulk upload, multiple verified contacts, NDA and per-file/per-contact access, watermarked read-only previews | Earlier Auth/storage checks and rollback-only permission suites |
| HORECA operations | Catalogue/SKU import; RFQs, supplier quotes, landed comparison, awards, receipts, dispatch/returns, delivery and stock reconciliation | 38 operational/catalogue/media checks; browser RFQ save |
| HORECA customer and supplier portal | Quotation basket, private request tracking, deadline-bound supplier assignments, supplier submissions, separate customer selling quotes, exact revision acceptance, payment request and fulfilment projection | 23 hosted rollback-only checks; browser request WEB-BA81231E10AB persisted and visible in customer portal, then cancelled and its RFQ closed |
| PMC and other practices | Programme dependencies, baseline/costs, variations, measured progress, RFI/risk registers and closure guards; independent advisory practice workspaces | Hosted operational checks; production build |
| AI content and media | Source text/PDF/Office/CSV/images, evidence, missing-data questions, product/project forms and SEO; source image preparation; Runway queue and private output | Real OpenAI text and CSV intake; CSV preserved SKU QA-FILE-PLATE-002, MOQ 24, pack 12, lead 14; real Runway private image import |
| Brand catalogue imports | Private PDF upload; resumable page extraction; product/variant specifications, source evidence and matching image crops; automatic SKUs with manual override; duplicate source/page and manufacturer-code protection | 133 local tests including real PDF rendering and manufacturer-code image matching; browser tests cover correct complete plate/lamp images, automatic drafts/SKUs, manual override, duplicate rejection and repeat-page idempotency. The additional rollback SQL suite is prepared but was not executed because confirmation expired. |
| Visual identity | Corporate white/charcoal frontend and staff suite, original logo SVGs, favicons, neutral valuation/teaser styles and canonical product URLs | Production build; desktop public/admin screenshots and responsive menus verified at 539 px and 337 px CSS widths; no horizontal overflow at 337 px |
| HORECA product images | Dedicated upload, AI enhancement and description-based generation; private sources, leased reference URLs, side-by-side comparison and review before catalogue use | 17 hosted rollback-only privacy/disclosure checks and 3 unit checks; real upload, enhancement and description generation reached ready privately in the browser |
| Personal business mailbox | Own-address Google OAuth, inbox search, plain-text threads, encrypted drafts, reviewed sending, disconnect | 15 hosted rollback-only checks and unit coverage; Google activation still awaits credentials |
| Email marketing | Scoped consented audiences, owner release, immutable approved copy, pause/resume, capped queue, unsubscribe, suppression and delivery reporting | 18 hosted rollback-only checks; no campaign sent |
| Transactional email and sign-in | Email OTP; enquiry acknowledgement and three senior notifications; signed delivery reports and recovery worker | Prior real four-message delivered test; owner onboarding/MFA |
| Payment collection | Razorpay test-mode invoice/quote collection, signature verification, provider reconciliation and replay handling | INR 1 sandbox capture and reconciliation; refund remains a provider issue |

Latest local validation: 137 Node tests and the Next.js production build passed. Added hosted checks are rollback-only and send no mail, place no orders and retain no fixtures. Labelled browser/provider test records remain private unless explicitly archived. Successful code tests are not a substitute for production/provider acceptance.

## Concrete activation dependencies

1. **Production database and recovery:** healthy Mumbai project `szmsvxbqtakzbfpvgeth` is installed in India Gully Pro. Forty-three migrations and three Edge Functions are deployed, Vercel Production is wired with distinct server credentials, and both projects are associated with GitHub. Automatic database deployment is off. A protected Vercel Production build is READY against this database. SMTP settings are saved and enabled; delivery verification, owner authentication/recovery, content release and a restore drill remain required. The owner approved the two campaign migrations, and both are now installed with an additional database delivery-release guard. See `deployment-connections.md` for the exact fresh-install and migration-history differences.
2. **Company sign-off:** Pavan Manikonda is appointed Grievance Officer (pavan@indiagully.com, +918988988988). The owner explicitly approved all eight policies in version 2026-11-11.2 and the recorded company details; publication and `statutory_details_confirmed=true` are applied.
3. **Staff access:** Arun completed verification, password change and MFA in preview. Production has zero Auth users and three invitations. The owner explicitly approved Pavan and Amit as administrators with read/write/publish/enquiries/data-room/commerce rights across all eight practices. These permissions take effect only after verified sign-up, required password change and MFA. Production owner onboarding, recovery and Auth security settings remain outstanding.
4. **Google Workspace:** supply the website's OAuth client ID/secret and approved callback, enable Gmail API and obtain each user's consent. The implementation remains disabled. ChatGPT's connected Gmail account cannot supply website OAuth credentials. See `mailbox-campaigns.md`.
5. **Payments:** the merchant's sandbox refund returned HTTP 400 from both dashboard and documented API. The Razorpay live dashboard shows indiagully.com approved. The owner generated and privately saved the live-key pair; Vercel metadata verifies RAZORPAY_LIVE_KEY_ID and RAZORPAY_LIVE_KEY_SECRET as Secrets scoped only to Production. Values were not retrieved. Preview retains test configuration revision 2; the new production payment configuration is disabled. Production credential import/provider validation, live webhook setup and real provider refund/failure/recovery cases remain outstanding. No refund success is claimed.
6. **Marketing and SEM:** the owner approved production module installation. All campaign migrations are installed; `CAMPAIGNS_INSTALLED=true`, `MARKETING_ENABLED=false` and the new database `campaign_delivery_enabled=false`. A real campaign requires owner-approved content and audience. Google Ads requires account access, an explicit budget and verified conversion configuration; current search campaigns are paused drafts. No ads, pixels or marketing messages were activated.
7. **Vyapar:** excluded from this implementation at the owner’s direction.
8. **Location enrichment:** coordinates can be extracted from supplied full map links and reviewed. No external geocoder account has been selected. Missing geographic facts remain unanswered.

## Release boundary

Keep PR #3 in draft until authentication/recovery, production isolation and the applicable activation dependencies pass. Keep the current live domain on its existing host. Preview indexing remains off. The deployment must not be described as a fully live marketplace while payment, legal and production acceptance remain open.

The HORECA storefront uses business quotation and acceptance, not unverified fixed-price retail checkout. Prices, tax, freight, availability and delivery are confirmed in a released quotation. Supplier costs are never part of the customer projection.

## Evidence and handover

- `production-approval.md`: exact approved policy release and recorded access/module decisions.
- `admin-upgrade.md`: operational fixes and previous provider/browser acceptance.
- `product-images.md`: product image workflow and live provider acceptance.
- `mailbox-campaigns.md`: new correspondence/marketing implementation and exact configuration.
- `governance-and-integrations.md`: preserved Resend/Razorpay evidence and provider refund error.
- `scripts/verify-procurement.sql`, `scripts/verify-mailbox.sql`, `scripts/verify-campaigns.sql`, `scripts/verify-product-images.sql`: rollback-only hosted acceptance.
- `data-rooms.md`, `client-engagements.md`, `provider-studio.md`: module handover records. Older statements about missing keys/registers are historical and superseded by this page.

## Approved release verification, 12 November 2026

Fourteen production database assertions verify safe drafting, blocked activation/recipient leasing/payload release and worker isolation with queued campaigns. All fixtures and HTTP requests rolled back. The full eighteen-check campaign suite passes in preview under rollback-only simulated delivery release; nine targeted Node tests pass. Production security advisors report no warnings/errors. Public privacy and registration routes return HTTP 200 and expose the released policy and registration form. No real email delivery, owner verification or campaign sending is claimed.
