# India Gully operational scope audit

Evidence reviewed 11 November 2026: source routes and RPCs, hosted schema/public content, encrypted-setting presence, delivery events and rollback-only permission/workflow tests. This is a capability audit, not a declaration of production acceptance.

| Area | Verified / implemented | Still required for the complete engine |
| --- | --- | --- |
| Real estate opportunities | Four published database records; draft/revision editing; explicit publish; archive/unpublish, restoration and guarded deletion; editable taxonomy; masked public fields; NDA/data-room workflow | Fresh commercial/mandate/availability verification of each listing; final client onboarding and full live acceptance |
| Public enquiries | No account required; privacy acknowledgement; validation/rate limiting; recorded CRM enquiry; one acknowledgement and independent notices to AKM, Pavan and Amit | Monitoring and operational response SLA; broader anti-abuse acceptance before launch |
| HORECA | Service/category pages; database product CRUD and publication; searchable published catalogue; specification pages; contextual RFQ enquiry; approved-quote payment foundation | BOQ upload and parsing, structured multi-line RFQ, supplier master, vendor bids/deviations, margin/tax approvals, stock/reservations, POs, fulfilment, returns and reconciliation. Zero published products currently; no fabricated catalogue seeded |
| Hospitality / design / PMC | Public scope and selected-work pages; private client/engagement records and report rooms | Project programme, dependencies, baselines, milestones, budget/commitment/actual register, variations, RFIs, drawing/submittal versions, site diary, risk/issues, approvals, snag/handover and client progress views |
| Feasibility / valuations / audits | Defined services, client/contact creation, engagement rooms, one room shared to multiple independent email accounts, per-file original-download rules | Final real-client onboarding/OTP acceptance and approved report templates |
| AI editorial | Source-based OpenAI content, SEO, ad copy and creative briefs; practice permissions and draft review | API key, billing and live generation acceptance |
| AI creatives | Runway image/video queue, caps, one-attempt submission, periodic polling, durable private import, review and publication/withdrawal controls | Developer key, live generation/storage/media-quality acceptance; reference-photo workflows and professional campaign composition beyond the current public brief |
| One-page marketing | Branded public opportunity brief generated from the current published database revision; browser print/PDF layout; no private room contents used | Actual print acceptance for the supported browsers; automated attachment/dossier distribution and campaign approval/consent workflows |
| Marketing / SEM | Consent/preferences, SEO fields and OpenAI draft copy | Campaign scheduling/suppression tests, delivery and conversion attribution, ad-platform OAuth, approved audiences/budgets, unsubscribe verification. No paid campaign or autonomous ad spending active |
| SMS | Owner-controlled approved DLT service-message queue with permission reference, daily caps and provider-acceptance status | Key and exact approved DLT values; handset-delivery evidence; verified DLR sync; event-triggered notifications and consented marketing campaigns |
| Payments | Razorpay test order/capture, customer/staff reconciliation, signed webhook relay and duplicate-event guards | Merchant/live onboarding; provider rejected sandbox refund (HTTP 400); successful refund and remaining provider failure cases required |
| Mail | Resend sender, enquiry notices, SMTP and signed delivery events verified in preview | Per-user Google Workspace OAuth/mailbox engine; Pavan/Amit onboarding; do not use shared Google passwords |
| Production security | MFA, practice rights, current-policy gates, RLS, private storage, restricted public projections, audits, encrypted settings | Compromised-password protection, production database/secret isolation, backup restore exercise, malware scanning, monitoring, legal/grievance-officer confirmation and full release acceptance |

## Enquiry evidence

The saved runtime recipient list is exactly `akm@indiagully.com`, `pavan@indiagully.com`, `amit.jhingan@indiagully.com`. Existing real Resend events record one delivered internal enquiry message for each. The new rollback suite checks real estate, HORECA, hospitality project and general subjects with three internal jobs and one customer acknowledgement each. All enter the same channel through `hello@indiagully.com`. Project files are never attached to these public-enquiry notices.

## Recommended HORECA implementation order

1. Structured enquiry/RFQ and versioned BOQ line items, with units, quantities, delivery destination and approved specifications.
2. Supplier quotes, substitutions/deviations, brand/model references and comparable landed-cost tables. AI can suggest description matches; humans approve substitutions and prices.
3. Versioned client quotation, tax/freight/installation terms, margins and approval thresholds. Acceptance locks the payable version.
4. Purchase orders, supplier acknowledgements, dispatch/GRN, shortages, returns, credit notes and payment reconciliation.
5. Inventory reservations only for goods actually stocked. Project procurement can remain quote-based. Vyapar should remain the accounting record until a documented, supported import/API route and reconciliation rules are confirmed.

## Recommended PMC implementation order

1. Project membership, responsibility matrix, baseline programme and milestone approvals.
2. Budgets, commitments, actuals and independently approved variations.
3. RFI/submittal/drawing registers, revision supersession and decision due dates.
4. Site progress, risk/issues, procurement dependencies and owner dashboards.
5. Snagging, handover documents, closure and signed reporting. AI may summarise approved facts or flag overdue work; it must not certify site progress, engineering compliance or costs without evidence.

## Salesforce decision

Recommendation: complete the native India Gully CRM first. Clients, multiple contacts, engagements, practice rights and enquiry records already share the NDA/data-room identity model. Adding a second CRM now introduces record ownership, deduplication, consent and synchronization decisions before the native workflows are complete.

Salesforce is appropriate if the business chooses its sales-pipeline, forecasting, activity/territory and reporting processes as a system of record. Integration is possible through Salesforce REST APIs, but requires an API-enabled organization/user, OAuth and edition-specific licensing. Do not purchase or connect it solely to obtain a contact list.

A future integration should map enquiry → Lead, client → Account, contact → Contact and commercial mandate → Opportunity, using immutable India Gully IDs as external IDs. Sync only approved business fields, queue retries with idempotency and conflict handling, and keep confidential data-room documents in India Gully. Consent withdrawal and record ownership must be mapped explicitly. No Salesforce account, license, app or synchronization has been created.

Sources checked: [Salesforce REST API](https://developer.salesforce.com/docs/platform/api-rest/guide/intro-what-is-rest-api.html), [API editions and permissions](https://developer.salesforce.com/docs/platform/api-rest/guide/intro-rest-compatible-editions.html), [Salesforce India pricing](https://www.salesforce.com/in/sales/pricing/).

## Release decision

Keep PR 3 in draft and the live domain unchanged. The integration code and preview checks are distinct from activated providers and complete commerce/PMC engines. See `provider-studio.md` for credential activation and `launch-readiness.md` for the full release gates.
