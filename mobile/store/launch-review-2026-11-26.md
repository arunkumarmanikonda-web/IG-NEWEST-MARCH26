# Play launch disclosure evidence · 26 November 2026

Read-only source and connected-configuration review. No console declarations, accounts, data deletion, emails, policy publication or production changes were made by this review. These notes complement `privacy-disclosures.md`; they are not a completed Data safety certification.

## Answers supported now

| Form | Supported answer and limit |
| --- | --- |
| Contains ads | **No** for this version's catalogue and services. No native ad SDK, display ad, interstitial or other-app ad placement was found. The production environment has no Google Ads tag/label or tracking keys, so its optional tag route is disabled. Email campaigns being enabled does not mean the app displays ads. Reassess if sponsored/native ad placements or ad SDKs are introduced. |
| Government app | **No**. The app represents the verified private company, not a government entity. |
| Health features | **None**. No health functionality appears in the app. |
| Target audience | **18 and over**, consistent with the published service/registration notice. This is an audience selection, not the separate content-rating result. |
| App access | **Some functionality is restricted**. Public catalogue, local search, shortlist, sharing and Perspectives work without registration; client services and staff workspace require sign-in and permissions. |
| Account creation | Supported through the linked website. Client sign-in supports email/password and email codes. A link to external account creation is still in scope for Google's deletion requirement. |
| Financial features | Review **Financial advice** against the actual form: the practices explicitly offer debt/refinancing advice and capital-structure review. Do not select “no financial features” solely because this is a Business app. Source does not establish a direct personal-loan lender, crypto exchange, banking or securities-trading feature. |
| Independent security validation | Do not claim MASA or other formal accreditation based on repository tests or this review. |

## Connected production evidence

- Vercel project `india-gully`: complete environment inventory reported `hiddenProductionEnvCount=0`. No `GOOGLE_ADS_TAG_ID`, `GOOGLE_ADS_ENQUIRY_LABEL`, advertising/analytics/pixel keys were present. `CAMPAIGNS_INSTALLED=true` and `MARKETING_ENABLED=true` enable separate consent-controlled communications. No project log drains were configured. Vercel's returned project summary did not establish its platform log retention or Observability settings.
- Supabase project `india-gully-production`: OpenAI, Resend, Runway and Google Mail were enabled; Razorpay was live; Fast2SMS was disabled. Only modes/settings names were inspected; credentials and private client content were not output.
- The current approved policy remains `2026-11-11.2`. Its stored hash matches its actual PostgreSQL JSONB documents. Live `/privacy` includes separate identity/Gullu disclosures, but no explicit native-cache coverage; `/data-usage` still says an NDA is always needed. The staged policy corrections are described in `docs/mobile-policy-review-2026-11-26.md`.
- The `ig-gullu-retention` cron is active daily at `20 21 * * *` UTC. Its last three observed runs, 23–25 November, succeeded. Its actual deployed body deletes old turns, expired guest/report records and rate-limit records. It does not delete retained enquiry copies or previously delivered internal report emails/attachments.
- The public `/delete-account` route exists in source. The public web retrieval tool could not access that URL during this review; this is not proof of a 404. Verify the deployed route in the actual signed-build flow before certifying it.

## Data-safety inventory to finish

Google distinguishes native on-device data, controlled web experiences, provider processing and third-party sharing. The app uses Custom Tabs, not a native WebView. The documentation reviewed does not explicitly resolve every Custom Tab boundary. Do not use browser navigation as a basis for a blanket “no collection” answer; account creation/deletion is explicitly covered even when reached outside the app.

| Data or flow | Evidenced behavior | Likely form categories/purposes to reconcile |
| --- | --- | --- |
| Native shortlist and search | Stored/filtered only on device; not uploaded | No collection for those local values alone |
| Account, enquiries and Gullu registration | Name, email, phone, account/session IDs, organisation and submitted text | Name, email, phone, user IDs, user-generated content; account management, functionality, service communication; optional to public browsing |
| Gullu conversations | Questions/answers and context stored; provider processes redacted question/history with `store:false`; free text may still contain personal data | Other in-app messages; functionality and any evidenced service-improvement purpose; not ephemeral merely because API response storage is disabled |
| Data rooms and identity verification | Authorised files, identity records, audit activity, addresses where supplied | Files/docs, relevant personal information and app interactions; functionality/security/compliance; separate lawful-retention decisions |
| Procurement and payments | Accepted quotation/order data and payment references retained; card credentials collected in provider checkout | Purchase history and applicable billing data; functionality/compliance. Do not claim India Gully stores full card data absent evidence |
| Staff mailbox | Optional Gmail connection supports reading threads and sending reviewed messages through server calls; sent drafts/context may be recorded | Emails and identifiers where included in app-service scope; functionality. Staff-only data is still user data |
| Security and diagnostics | Rotating IP-derived hashes for enquiry/Gullu abuse prevention; Gullu timing/outcome logs omit contacts, text and session IDs | Device/other IDs or appropriate identifier classification for security hashes; diagnostics/analytics for timing data as applicable. Hosting log retention and possible IP-based geography remain unresolved |
| Optional campaigns | Consent-controlled marketing infrastructure is enabled | Advertising/marketing purpose for contact data when used in those opted-in campaigns; separate from “Contains ads” |

All inspected first-party native URLs and provider integrations use HTTPS. Confirm the final binary/network behavior before selecting encryption-in-transit for every data flow. Transfers to instructed service providers can be exempt from Google's “sharing” label, but remain relevant to collection; final “no sharing” certification requires checking actual provider roles and any counterparty disclosures. No training, zero-retention or anonymisation guarantee follows from `store:false` or regex redaction.

## Reviewer account specification

Use a dedicated company-controlled alias such as `play-review@indiagully.com`, display name `Google Play Review`, with a strong password provided only in Play Console's protected review field. Provision a verified active **client** profile, no staff roles/invitations/practice grants, no forced password change, and no optional marketing consent. Record ordinary test-account policy acceptance; never reuse a real client's consent or identity. Create only a synthetic client/engagement/room containing clearly labelled test documents and no payment requests, live agreements or real client records. Password sign-in avoids OTP for this client without changing authentication logic.

Staff sign-in still requires email-code or authenticator verification. Do not solve that by giving reviewers owner credentials or globally bypassing verification. If Play requires interactive staff coverage, prepare a separate constrained demonstration context with synthetic records and server-enforced permissions, or agree the reviewer-access approach before production submission. The public native functions can already be tested without any account.

## Deletion fulfillment gap

The live `ig_private.privacy_request(jsonb)` only creates requests or updates review status/response. `resolved` is not coupled to deletion. Separate account closure retains the identity/profile and only revokes sessions. Existing Auth foreign keys, email-linked enquiries/CRM contacts/Gullu guests and KYC storage require deliberate handling; direct Auth deletion alone is insufficient.

The minimum complete process is: verify the requester; identify account-linked and email-linked records/files; record any specific retention/hold basis; remove or irreversibly anonymise the remaining records and storage objects; remove the Auth identity and revoke access; request applicable processor cleanup; record completion and explain retained categories to the requester. Exercise that process with a synthetic account before certifying fulfillment. Automation is not inherently required, but an operationally executable and verified process is.

An **internal-testing-only** Play release is exempt from the Data safety section. It can be used for signed-binary testing while the publication questions above are resolved. This does not waive other applicable policies or justify inaccurate declarations for a later closed/open/production release.

## Official references

- [Preparing app-content declarations and reviewer access](https://support.google.com/googleplay/android-developer/answer/9859455)
- [Data safety definitions, purposes, provider exceptions and internal-testing scope](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Account-deletion scope and external account creation](https://support.google.com/googleplay/android-developer/answer/13327111)
- [Current policy declaration questionnaire schema](https://developers.google.com/android-publisher/app-store-review/policy-declarations)

Main source evidence: `mobile/src/App.tsx`, `mobile/src/storage.ts`, `mobile/src/domain.ts`, `app/api/mobile/catalogue/route.js`, `app/api/portal/auth/route.js`, `lib/sign-in.mjs`, `app/api/advertising/event/route.js`, `app/api/gullu/route.js`, `lib/gullu.mjs`, `lib/gullu-verification.mjs`, `app/api/mailbox/route.js`, `lib/mailbox-server.js`, and migrations for governance, account verification, Gullu retention and administrator-authorised room sharing.
