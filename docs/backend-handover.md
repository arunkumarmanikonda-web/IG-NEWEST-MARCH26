# Backend handover · 11 November 2026

## Scope delivered in this branch
A dedicated Mumbai Supabase preview now serves Auth, MFA, CMS content, staff lifecycle, categories, consent history and enquiry records. The application uses a publishable key with RLS and tightly scoped audited RPCs. It has no service-role key. The public website reads a separate publication snapshot, so a new draft cannot overwrite the current public version.

The CMS supports page, practice, opportunity, product, project, article, person and FAQ records. Opportunity and article routes are directly connected, with generic published pages for the other types. This is not yet a complete visual page builder: static home/practice/about sections, shared navigation, media uploads, scheduling and revision rollback controls still require further implementation. Images currently use approved local media paths. The HORECA product content type is not an inventory/payment engine.

## Permission model
All staff operations require verified email, current policy acceptance, an active profile, a valid non-revoked Auth session and AAL2 MFA. Role assignments are held in the database, never trusted from user-editable metadata. Owner manages all; administrator manages users/content; publisher can publish; editor edits general content; property manager edits opportunities; procurement manager edits products/projects; marketing manager edits pages/articles/FAQs; sales handles enquiries; auditor reads records. Clients and vendors receive no staff privileges. Database policies and RPC checks apply even when a caller bypasses the website.

Owner assignment is reserved for an owner. The last active owner cannot be closed, suspended or demoted. Existing staff cannot use an invitation to bypass role administration. User role/status changes revoke sessions. Account closure preserves audit/business records; permanent personal-data erasure requires a retention process. Authenticator loss/recovery procedures are still an operational launch requirement.

## Owner activation
The only initial staff invitation is for `akm@indiagully.com`, role owner. No password has been assigned and no real user email has been pre-verified. Once SMTP and redirects work: register, verify the email, sign in, record the three policy acceptances, enrol and verify an authenticator at `/account/security`, then choose Activate staff invitation at `/account`. Invite additional staff from `/admin/users`. Invitations currently record access assignments but do not send mail.

## Enquiries
The public contact form stores a non-confidential brief. A server-only random ingestion secret is compared with a stored SHA256 hash; it is not a Supabase service-role credential. Requests have a stable UUID and payload digest, five-per-15-minute rotating hashed-origin limit, required privacy acknowledgement, body/field limits and origin checks. Retries cannot duplicate jobs or change a previously used request reference.

The same transaction creates three internal jobs (`akm@indiagully.com`, `pavan@indiagully.com`, `amit.jhingan@indiagully.com`) and a customer acknowledgement job. All remain `awaiting_provider`. No Resend worker/webhook is active, and no test email has been sent. Configure the sender `hello@indiagully.com`, delivery receipts, idempotency, retries and suppression before enabling dispatch.

## Verification evidence
- 60 local automated tests pass, including request-origin, body-limit and private-cache controls. Existing pure domain tests are specifications, not evidence that the corresponding AI, NDA or marketing provider is integrated.
- 43 real Supabase checks passed with four disposable identities. They cover real password login/TOTP MFA, RLS, injected-metadata role rejection, content-type restrictions, publish permissions, snapshot isolation, optimistic concurrency, confidential public fields, taxonomy CRUD, last-owner protection, invitation/revocation, consent withdrawal and immediate session revocation.
- Six real enquiry checks passed: ingestion secret, privacy acknowledgement, persistence, identical retry, changed-payload rejection and rate limit. SQL inspection confirmed exactly three named internal jobs plus one acknowledgement per saved enquiry, all awaiting the provider.
- Production application build passes. Twelve website HTTP checks passed, including actual SSR cookie login/account rendering, protected admin redirect, API role denial, logout and persisted/idempotent enquiry submission. Seven additional identity/consent SQL assertions passed after the final hardening migrations. All four test identities, six enquiries and their delivery jobs were removed; the remaining database contains seven baseline published records and no real accounts. Deployed browser checks are recorded in the PR.
- Security advisor: no database security ERROR; four INFO findings for deliberately inaccessible private RLS tables. Auth leaked-password protection is disabled and must be enabled. Foreign-key index and RLS-initplan performance findings were addressed in the fourth migration. Unused-index notices are expected for a new preview and are not grounds to remove required indexes.

Fixtures are verified directly for test purposes and subsequently removed. This does not test verification email delivery. Do not turn off real-user email verification as a workaround.

## Remaining configuration and release gates
The Supabase connector does not expose Auth SMTP/site URL/redirect/password policy settings. Dashboard sign-in is needed. The Vercel Preview/Development environment has the new database URL, public key and ingestion secret. Production does not: provision an isolated production database and apply the schema before merging into the production branch. Keep the live domain and search-indexing switch unchanged.

Finish and test verification/recovery email, owner onboarding, production configuration, full provider integrations and the operational launch checklist. The current PR remains draft until its merge gates are met. No claim of a completed autonomous store, fully AI-managed CMS or platinum security certification is made.
