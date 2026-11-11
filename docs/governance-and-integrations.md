# Governance and integration handover · 11 November 2026

## Company identity

- Legal entity: **Vivacious Entertainment and Hospitality Private Limited**.
- Brand: **India Gully**.
- CIN: **U74999DL2017PTC323237**. Corroborated by the existing company website and two public company directories; a current authenticated MCA extract was not obtained.
- GSTIN: **07AAGCV0867P1ZN**, supplied by the owner and matching the existing website. No claim of live GST-registration verification is made.
- General service email: **hello@indiagully.com**.
- Official telephone: **+918988988988**.
- Enquiry recipients: **akm@indiagully.com**, **pavan@indiagully.com**, **amit.jhingan@indiagully.com**.
- Full current registered office and appointed grievance officer name/designation: **awaiting owner confirmation**. A directory address has deliberately not been promoted to a confirmed statutory disclosure.

## Implemented

Owner-only `/admin/settings` requires verified identity, current policy acceptance, changed initial password and MFA. Provider secrets are encrypted using AES-256-GCM with provider-bound associated data. The encryption root is a server-only Vercel variable; the database holds its hash and encrypted provider credentials. Client responses and audit records do not contain secret values. Configuration changes use optimistic versions and are read without persistent caching on subsequent requests. These are supported runtime settings, not permission to execute arbitrary generated code or migrate databases.

Eight versioned policies cover privacy, data usage, website terms, cookies, procurement, refunds, delivery and grievances. Published bundles retain exact text and SHA-256. A new release requires renewed account acceptance and records its hash; it does not rewrite signed NDAs or previous payment acceptance. The initial expanded release remains explicitly unreviewed for public-commerce activation. Owner publication requires a legal-review declaration. This is a technical control, not a substitute for qualified Indian legal review.

The owner can assign each staff member a practice-rights matrix. Roles impose a ceiling; practice rights further restrict read, edit, publish, enquiries, NDA/data-room and commerce actions. Read/write checks apply in database policies and privileged RPCs, not just navigation. Role/scope updates revoke sessions. AKM is owner; Pavan and Amit are administrators with all eight current practice scopes. Other staff default to no scopes. Only the owner may assign staff roles/scopes. Clients receive project grants independently of employee practice assignments.

Account privacy requests have references, statuses, responses and acknowledgement/resolution deadlines. Requests are private to their subject and the owner. Erasure is reviewed against contractual and statutory retention; the application does not silently delete signed evidence.

Resend adapter: enquiry capture, configured internal routing, acknowledgement, database queue, leased processing, stable provider idempotency keys, bounded retries within 23 hours, signed timestamp-checked webhooks and bounce/complaint suppression. New enquiries trigger processing; the owner can process pending messages. There is not yet a periodic recovery scheduler. `accepted` means provider acceptance, not delivery. Authentication verification/recovery email still uses Supabase SMTP and must be configured separately.

Razorpay adapter: administrator-issued invoice/accepted-quote payment requests, practice access checks, customer-specific dashboard, server-fixed INR/paise totals, provider Orders API, checkout, signature verification, server fetch of captured payment, matching amount/currency/order and webhook reconciliation. An ambiguous order-creation failure remains `initializing` for reconciliation instead of blindly creating another payable order. Payment credentials are encrypted in a binding for the initiated transaction so later key changes do not rewrite its verification context. Refund handling is through the merchant dashboard; automated refunds, tax-invoice generation, inventory and third-party seller settlement are not implemented. This is invoice collection, not a complete retail cart or regulated escrow arrangement.

## Activation status and launch gates

| Item | Status / requirement |
|---|---|
| Supabase | Connected in preview, Mumbai. No Neon required. |
| Resend | Code complete for enquiry delivery; API key, webhook secret, verified sender/DNS and real delivery test missing. Disabled. |
| Auth email | Supabase custom SMTP remains unconfigured. Real staff emails remain unverified; no claim of usable staff login yet. |
| Razorpay | Invoice payment integration implemented; test/live merchant keys, webhook secret, merchant activation and sandbox checkout/refund reconciliation tests missing. Disabled. Live activation additionally requires confirmed statutory details, reviewed legal release and production environment. |
| OpenAI / Runway | Editorial and creative workflows not connected. Reserved configuration fields do not activate generation. |
| Fast2SMS | Optional; reserved configuration fields only. DLT principal entity, sender, template, credentials and consent-controlled delivery workflow remain required. No SMS sent. |
| Google Workspace | Per-user OAuth/mail grants not implemented. Do not use shared Google passwords. |
| Shopify | Not required for the present advisory/procurement quote architecture. A future retail catalogue/cart/fulfilment decision is separate. |
| Vyapar | No verified API/accounting connector connected. Payment receipts are not GST invoices. |
| Legal operations | Confirm registered office and grievance appointment; counsel review policies/NDA and actual business model; implement operational retention, incident response and vendor agreements. |
| Security | Database access tests pass; independent penetration test, restore drill, full log-retention/India-residency assessment and upload malware scanning remain pending. Supabase leaked-password protection requires the applicable paid plan and remains disabled. |
| Production | No live domain cutover or production database activation. PR remains draft. |

## Regulatory review basis

Reviewed official sources on 11 November 2026. Applicability must be assessed against actual services and commencement dates; do not market the site as certified, SEBI-registered, CERT-In compliant or fully DPDP compliant without evidence.

- DPDP Rules 2025 and staged commencement: https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf . The notification stages commencement; the principal operational rules are not all effective as of this review. Existing IT/privacy obligations and contractual duties still require attention.
- Consumer Protection rules and the notified 2026 e-commerce amendment: https://consumeraffairs.gov.in/pages/consumer-protection-acts and https://consumeraffairs.gov.in/public/upload/files/E%20Commerce%20Amendment%20Rules%202026_1789127949.pdf . Review marketplace versus inventory/own-seller duties, seller disclosures, grievance process and the January 2027 commencement before public commerce launch.
- CERT-In directions: https://www.cert-in.org.in/PDF/CERT-In_Directions_70B_28.04.2022.pdf . Operational incident-reporting and logging obligations cannot be satisfied by a policy page alone; retain an incident owner, escalation procedure and verified infrastructure configuration.
- IT/SPDI clarification: https://www.meity.gov.in/writereaddata/files/PressNote_25811.pdf . Scope and application should be checked with the actual data collected.
- Razorpay verification: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps and https://razorpay.com/docs/webhooks/validate-test . Server verification and captured-state checks are implemented; provider sandbox proof remains pending.
- Resend: https://resend.com/docs/api-reference/emails/send-email . Stable idempotency keys are used within the provider's 24-hour window.

Additional prelaunch checks: relevant state RERA agent/project disclosures; CIRP official notices/eligibility and authorised representations; no unsupported regulated-investment claims; GST invoice/HSN/SAC/place-of-supply and e-invoice applicability; packaged-commodity/product disclosures where applicable; advertising/endorsement and dark-pattern controls; DLT requirements for commercial SMS. These depend on the actual mandate, products, turnover and operating model, not merely site code.

## Verification

74 local tests passed and a production build completed after the governance/payment implementation. The previous data-room flow passed 32 real Auth/API/storage checks. The governance/payment flow passed 19 real Auth/database checks, including payment-disabled and queue-disabled behaviour. Four additional transactional scope checks confirmed assigned HORECA write/read access while denying debt access and ungranted publication. Provider HTTP adapters are tested with controlled responses, not claimed as real external transactions.
