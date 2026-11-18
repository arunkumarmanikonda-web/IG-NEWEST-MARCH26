# India Gully audit remediation

Authorised scope: all 17 findings in the 18 November 2026 audit. This register is updated with release evidence before completion. No confidential originals are made publicly downloadable as a workaround.

## Release state

- Main remediation release: https://github.com/arunkumarmanikonda-web/IG-NEWEST-MARCH26/pull/35, merged as `2d18ccc182eb842dea774f3695fc7fe24f3ff635` and deployed to production. Vercel deployment `dpl_94W6j1VAzgzMyGbUwzBbYo9ZoYnJ` is READY and serves indiagully.com.
- Final main-release CI at `4437a39921d0c60be40c082d26a8b22bd9f34b34`: 297 unit tests, 32 isolated SQL workflows, three Chromium browser journeys, production build and dependency audit passed. GitHub run: https://github.com/arunkumarmanikonda-web/IG-NEWEST-MARCH26/actions/runs/44230151310
- Upload broker version 3 is deployed. It enforces bounded Office/ZIP structure inspection while retaining per-user file authorisation.
- Production migrations `20261118004405_audit_resource_guards` and `20261118074605_audit_remaining` are applied. Repository filenames match the production migration history. No client file or content deletion was included.
- Live smoke at 13:19 IST on 18 November: all eight core pages returned 200, nonce CSP and canonical checks passed, catalogue pagination returned 24 then 15 of 39 Crockery products, and unauthenticated chat history returned null. Database RPC/migration parity passed. Live browser checks confirmed model search and paging and Gullu's welcome form. The synthetic zero-message guest was ended and removed; no client messages or emails were sent.
- Perspectives run `595ebdb3-d414-4954-b4a4-9a1d3d05f5c8` completed at 13:20 IST on 18 November with a **held** outcome: the independent audit did not corroborate every cited URL. No article was published. Background health correctly retains that failure while the other seven worker components are ready with no due work.
- Follow-up recovery allows one fresh independent audit when a positive verdict omits individual source citations. It preserves the original deadline, all source checks and both audit response IDs. An actual factual HOLD cannot be bypassed. Production publication is not marked verified until a cycle passes every check.
- Reusable smoke: `node scripts/verify-release.mjs https://indiagully.com`. This script makes read-only requests and does not contact clients.

## Content and service prerequisites

Existing room originals still require faithful previews; download restrictions have not been relaxed. Exact approved photos are still missing for Ariane SKUs IG-ARIA-0000057 / IG-ARIA-0000058 and the legacy Jaipur property. Approved supplier data and signed brand mandates are needed for empty collections. Container inspection is not antivirus: a private malware-scanning service remains to be configured. These items are not marked closed.

| Finding | Implementation | Verification / remaining work |
|---|---|---|
| F01 Archive dependency | fflate 0.8.3; isolated document extraction with time and memory limits | Dependency audit clean; malformed archive and deadline tests |
| F02 Perspectives | Daily recovery after exhausted attempts; one bounded source-verification retry; persistent held outcome | Research and writing ran live; independent fact check held publication. Successful publication remains to verify |
| F03 Room readiness | Readiness list and server-side invitation/grant gate | Existing Office documents still need faithful PDF previews; original download permissions retained |
| F04 KYC processing | 10 MB evidence limit, six-page/16 MP bounds, isolated 45-second OCR, account lease/rate limit | Synthetic scan, database ownership and concurrent lease tests |
| F05 Upload verification | Bounded archive central-directory and legacy Office structure checks | Dedicated private malware scanner remains a prerequisite for antivirus assurance |
| F06 Browser policy | Per-response nonce CSP, explicit payment/storage origins | CI browser checks and production page/nonce checks passed |
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
| F17 Release checks | Dependency audit, SQL workflows and browser gates in CI | Read-only production smoke and migration parity passed |
