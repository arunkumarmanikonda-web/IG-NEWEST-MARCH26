# Staff payment collections and communication design

Release date: 13 November 2026.

## Behaviour

Every staff workspace header has Collect payment. The Payment links & QR register at `/admin/collections` supports permitted practices, CRM contacts or manually entered client details, staff-defined INR amounts, agreed invoice references, purposes and expiry dates. Staff review before creation; email is a separate, explicitly confirmed action. Existing customer-account invoice payments continue independently.

Each request receives an `IG-COL-YYYYMMDD-…` reference. Authenticated staff UUID, name and email are snapshotted server-side and cannot be edited through the application. Razorpay notes, the dashboard, personal email and branded QR card retain that attribution. Another authorised colleague can check the link without becoming its collector. Funds go to the existing India Gully Razorpay merchant account.

The register filters by issuer, practice, status and client/reference/purpose. Displayed totals cover the latest 250 permitted records and current filters. Live gross collections exclude test records and are not net of refunds. Refund reconciliation for these hosted links is performed in Razorpay.

Links request an exact INR amount with partial payments disabled. The current merchant-configured amount limit applies. The QR is a camera-scannable URL to the hosted Razorpay checkout, not a direct UPI QR. No India Gully client login is needed at checkout. Staff can copy links, download a branded PNG card, review/email the client, refresh status or cancel an unpaid link.

Provider operations use database leases and a stable request UUID. Uncertain creation is reconciled using the original reference, never blindly repeated. The existing scheduled worker checks up to five due links each run; explicit refresh is also available. Verified full payment retains its original issuer. Expired, cancelled and paid records cannot queue a new request email.

## Communications

A shared white/charcoal HTML and plain-text design uses the original India Gully logo and Celebrating Desiness. Payment messages name the issuer, greet the client, state the amount and purpose, identify the legal payee, include expiry/reference/checkout, and display an inline CID QR inside a fine gold-bordered payment card. The downloadable PNG card also has a gold border. Replies route to the issuer's verified India Gully-domain address, otherwise the configured team mailbox. Enquiry acknowledgements, internal enquiry alerts and secure-room updates use the same design. Marketing templates preserve opt-out links and one-click unsubscribe. Business-mailbox messages preserve authored text and add a branded HTML alternative; Google OAuth remains inactive.

Repository sign-in/recovery/confirmation templates have revised copy, but publishing those templates in the Supabase Auth dashboard remains pending. Application deployment does not update provider-managed Auth templates.

Queued, accepted and delivered email states remain distinct. Delivery uses the existing Resend outbox, frozen payloads, retry leases, suppression list and verified delivery events. No sample request emails were sent in this release.

## Verification

- 176 Node tests passed, including amount precision, spoofed provider identity, duplicate creation recovery, QR decoding, staff/legal attribution, HTML escaping and email alternatives.
- 31 transaction-only database checks passed in preview and production; all fixtures and test settings rolled back. No real provider link, payment, refund or external email was created by the checks.
- Next.js production build passed.
- Desktop browser: issuer filter, original attribution, selected request, client email review, creation form and exact amount/recipient review checked with fictional fixtures. Primary-action contrast fixed.
- Revised payment-card browser preview confirms the gold frame and visible QR. Email uses a CID inline attachment; the hosted preview substitutes the same PNG bytes for browser display.
- Actual QR bytes decoded back to the exact checkout URL; card uses a bundled licensed DejaVu font subset for reproducible rupee rendering.
- Narrow-screen styles implemented. Mobile-device browser acceptance remains unverified in this environment.
- A signed-in production link creation, client inbox receipt, real payment, refresh and cancellation acceptance check remains outstanding. Do not describe mocked provider responses as completed live payments.

## Database

Migrations: `20261113091639_dashboard_payment_links`, `20261113093553_collection_delivery_filter`, `20261113094001_collection_context_fix`. New tables and bindings are additive; existing invoice and enquiry rows are preserved. Collection permissions require active staff, current policies, MFA and practice commerce scope. Credentials remain encrypted in the private schema.
