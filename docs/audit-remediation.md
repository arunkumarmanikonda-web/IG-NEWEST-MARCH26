# India Gully audit remediation

Authorised scope: all 17 findings in the 18 November 2026 audit. This register is updated with release evidence before completion. No confidential originals are made publicly downloadable as a workaround.

## Release state

- Pull request: https://github.com/arunkumarmanikonda-web/IG-NEWEST-MARCH26/pull/35
- CI at `76ed06930979d82ac6158c64cde9323bdc629463`: 297 unit tests, 32 isolated SQL workflows, three Chromium browser journeys, production build and dependency audit passed. GitHub run: https://github.com/arunkumarmanikonda-web/IG-NEWEST-MARCH26/actions/runs/44192267080
- Upload broker version 3 is deployed. It enforces bounded Office/ZIP structure inspection while retaining per-user file authorisation.
- Production migration `20261118004405_audit_resource_guards` is applied: parser-related indexes/RLS, KYC byte limit/admission control and worker-health storage/functions. The new website must still be deployed to use the application-side controls.
- Remaining database migration is prepared in `supabase/migrations/20261118032244_audit_remaining.sql`. Supabase returned an expired confirmation, so the remaining migration has **not** run. The changes replace existing chat/sharing functions, extend entity constraints, consolidate equivalent outbox read policies and add catalogue/recovery functions. No client file or content deletion is included.
- The application PR remains unmerged; production application deployment and live outcome checks depend on the remaining database migration. The database migration split passed all 32 isolated SQL workflows again.
- Use `node scripts/verify-release.mjs https://indiagully.com` after deployment, then verify database migration/function parity and one sourced autonomous Perspective cycle. The smoke script makes read-only requests and does not contact clients.

## Content and service prerequisites

Existing room originals still require faithful previews; download restrictions have not been relaxed. Exact approved photos are still missing for Ariane SKUs IG-ARIA-0000057 / IG-ARIA-0000058 and the legacy Jaipur property. Approved supplier data and signed brand mandates are needed for empty collections. Container inspection is not antivirus: a private malware-scanning service remains to be configured. These items are not marked closed.

| Finding | Implementation | Verification / remaining work |
|---|---|---|
| F01 Archive dependency | fflate 0.8.3; isolated document extraction with time and memory limits | Dependency audit clean; malformed archive and deadline tests |
| F02 Perspectives | Daily recovery after exhausted attempts; persistent held outcome | Independent fact checks retained; successful production cycle still to verify |
| F03 Room readiness | Readiness list and server-side invitation/grant gate | Existing Office documents still need faithful PDF previews; original download permissions retained |
| F04 KYC processing | 10 MB evidence limit, six-page/16 MP bounds, isolated 45-second OCR, account lease/rate limit | Synthetic scan, database ownership and concurrent lease tests |
| F05 Upload verification | Bounded archive central-directory and legacy Office structure checks | Dedicated private malware scanner remains a prerequisite for antivirus assurance |
| F06 Browser policy | Per-response nonce CSP, explicit payment/storage origins | Production browser checks required |
| F07 Background health | Durable per-component leases/outcomes and stale/failed admin display | Scheduler acceptance distinguished from completion |
| F08 Gullu accuracy | Separate claim-entailment check with exact supporting source excerpts | Negation, wrong evidence and unsupported-number regressions |
| F09 Daily reports | Complete secure workbook link, attachment-limit notice, requirements/budget/location/timing columns | Full transcripts retained |
| F10 Missing photographs | Existing publication image gate retained; source verification in progress | Two Ariane codes and legacy Jaipur property require approved exact asset evidence |
| F11 Chat continuity | Signed HttpOnly cookie, 24-hour DB expiry, revocation, paged history | Reload/resume/end browser test; cookie and database isolation tests |
| F12 Catalogue coverage | Admin coverage counts and approved-source import route | Supplier data and signed brand mandates cannot be invented |
| F13 SEO | Missing canonicals; product titles include SKU | Browser canonical checks |
| F14 Catalogue scaling | Database filtering/facets, 24-item pages and single-record product lookup | Stable ordering, pagination and SKU search tests |
| F15 Database hygiene | Missing FK indexes, RLS on private processing tables, consolidated outbox policy and cached auth identity | Workflow authorization regressions |
| F16 Entity onboarding | LLP/partnership/trust/overseas organisation and overseas individual paths; GST optional where absent | Human review retained; synthetic registration tests |
| F17 Release checks | Dependency audit, SQL workflows and browser gates in CI | Read-only post-release smoke and migration parity still to complete |
