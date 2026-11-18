# India Gully audit remediation

Authorised scope: all 17 findings in the 18 November 2026 audit. This register is updated with release evidence before completion. No confidential originals are made publicly downloadable as a workaround.

## Initial remediation release history

- Main remediation release: https://github.com/arunkumarmanikonda-web/IG-NEWEST-MARCH26/pull/35, merged as `2d18ccc182eb842dea774f3695fc7fe24f3ff635` and deployed to production. Vercel deployment `dpl_94W6j1VAzgzMyGbUwzBbYo9ZoYnJ` is READY and serves indiagully.com.
- Final main-release CI at `4437a39921d0c60be40c082d26a8b22bd9f34b34`: 297 unit tests, 32 isolated SQL workflows, three Chromium browser journeys, production build and dependency audit passed. GitHub run: https://github.com/arunkumarmanikonda-web/IG-NEWEST-MARCH26/actions/runs/44230151310
- Upload broker version 4 is deployed. It enforces bounded Office/ZIP structure inspection and exact scan-job lease checks while retaining per-user file authorisation.
- Production migrations `20261118004405_audit_resource_guards` and `20261118074605_audit_remaining` are applied. Repository filenames match the production migration history. No client file or content deletion was included.
- Live smoke at 13:19 IST on 18 November: all eight core pages returned 200, nonce CSP and canonical checks passed, catalogue pagination returned 24 then 15 of 39 Crockery products, and unauthenticated chat history returned null. Database RPC/migration parity passed. Live browser checks confirmed model search and paging and Gullu's welcome form. The synthetic zero-message guest was ended and removed; no client messages or emails were sent.
- Perspectives run `595ebdb3-d414-4954-b4a4-9a1d3d05f5c8` completed at 13:20 IST on 18 November with a **held** outcome: the independent audit did not corroborate every cited URL. No article was published. Background health correctly retains that failure while the other seven worker components are ready with no due work.
- Follow-up recovery allows one fresh independent audit when a positive verdict omits individual source citations. It preserves the original deadline, all source checks and both audit response IDs. An actual factual HOLD cannot be bypassed. This was an interim hold; the later successful live publication is recorded below.
- Reusable smoke: `node scripts/verify-release.mjs https://indiagully.com`. This script makes read-only requests and does not contact clients.

## Content and service prerequisites

Private antivirus scanning and faithful PDF conversion are deployed and backfilling existing originals. Per-file outcomes below distinguish successful processing from files requiring review. Download restrictions have not been relaxed. Exact approved photos remain missing for Ariane SKUs IG-ARIA-0000057 / IG-ARIA-0000058 and the legacy Jaipur property. The current official Ariane cutlery catalogue was checked and does not establish those two exact knife codes; a different collection's photograph was not substituted. Approved supplier data and signed brand mandates are needed for empty collections. These content prerequisites are not marked closed.

| Finding | Implementation | Verification / remaining work |
|---|---|---|
| F01 Archive dependency | fflate 0.8.3; isolated document extraction with time and memory limits | Dependency audit clean; malformed archive and deadline tests |
| F02 Perspectives | Daily recovery, targeted primary-source repair, bounded independent recheck, durable diagnostics and corrected publication constraint | Complete live research, independent verification, publication and archive cycle passed on 18 November; fortnightly schedule enabled |
| F03 Room readiness | Readiness list and server-side invitation/grant gate | Private Office/PDF conversion and backfill deployed; source download permissions retained; individual exceptions listed below |
| F04 KYC processing | 10 MB evidence limit, six-page/16 MP bounds, isolated 45-second OCR, account lease/rate limit | Synthetic scan, database ownership and concurrent lease tests |
| F05 Upload verification | Bounded archive central-directory and legacy Office structure checks | ClamAV deployed in private disposable VMs; fail-closed scan gates and isolated conversion verified |
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

## Completion releases on 18 November

- PR39 isolates the Perspectives research model from ordinary drafting and retains private research/fact-check diagnostics. PR40 fixes false rejection of independent companies whose original filings share the NSE archive host. Both are deployed.
- Private processing now uses disposable Vercel VMs with ClamAV and LibreOffice. Originals remain private. Downloads use per-file expiring URLs; network access is denied before parsing. Macros and document link updates are disabled. Only a clean software/definition image may be snapshotted; client-file VMs are stopped without persistence.
- New completed uploads queue automatically, remain inaccessible until a clean scan, and receive PDF companions where required. Scan leases, bounded retries, staff retry, preview checksums and invitation readiness checks preserve existing room and download permissions. Existing files are backfilled in the controlled activation phase; infected files are blocked regardless of earlier grants.
- Synthetic live sandbox checks passed for clean/infected antivirus signatures, CSV, DOCX and XLSX conversion. CSV references retain leading zeros and formula-like text is literal. No client records were used in those tests. SQL checks cover secret/lease rejection, queued access blocks, preview permissions, malware blocks and lease exhaustion.
- A factual editorial HOLD may trigger one sourced revision followed by a fresh independent web audit. Both reviews are retained. Unchanged text, unsupported revisions or another HOLD still prevent publication.
- The Sandbox SDK's transitive configuration package pinned an affected Zod version. A scoped override to Zod 4.6.7 retains the same major version and clears the dependency audit.
- Limits: automated originals up to 1 GiB, generated previews up to 20 MiB/500 pages, bounded VM processing. Encrypted/oversized/unreadable documents require review rather than being declared safe. Antivirus reduces risk; it cannot establish the absence of every possible threat.

## Live completion evidence

- PR41 deployed private scanning, Office/PDF conversion and one bounded factual revision. PR42 added corrected-original handling. PR43 reserved full processing budgets for larger documents.
- Production migrations additionally applied: `20261118081812_perspective_review_records`, `20261118083952_private_file_processing`, `20261118085645_private_processing_budgets`, `20261118090603_private_processing_oversize`.
- Live internal workbook canary passed the full scan, conversion, private upload and checksum chain. The resulting one-page PDF is 24,816 bytes and retains the original's download restrictions.
- The Park Plaza admission-order replacement matches the official IBBI original exactly: 771,945 bytes, SHA256 `b1bc740be6a98c1b3fa4508ed23f3e42f71ed59c83f7e101d00c18fc8904e883`. It passed ClamAV. Two earlier failed pending records were archived with an audit trail; no original was deleted and no access grant changed. The repeated `.pdf.pdf` suffix was corrected.
- Read-only production checks at 14:38 IST: eight core pages returned 200 with expected canonical/nonce policy; Crockery pagination returned 24 then 15 of 39 products; anonymous Gullu history remained unavailable.
- The Ankur catalogue AI import remains paused. Private file scanning does not start catalogue extraction or product creation.

- Completed data-room backfill: **139 originals passed antivirus scanning; 12 protected PDF companions were generated**. Park Plaza fixed-asset registers have 141 pages (2023) and 137 pages (2024), with verified output checksums. The oversized hotel operations agreement also has its protected preview.
- All completed-upload scan gates, including backfilled originals, are now mandatory. The only held original is the 740 MB Ankur source catalogue, whose scan exceeded the bounded processing time. It remains private and requires a smaller source or administrator processing. Its AI import remains paused. One earlier pending Ankur upload also remains in a source-intake room.
- The readiness-equivalent query found **no unresolved file issues in customer project rooms**. Only the two paused Ankur source-intake rooms have exceptions.
- PR44 passed 310 unit tests, 33 isolated SQL workflows, three Chromium journeys, dependency audit and production build: https://github.com/arunkumarmanikonda-web/IG-NEWEST-MARCH26/actions/runs/44272922303 . It is deployed as `bf23e5e819ef95309f55aa4c608fab57e1cfa291`.
- A complete live Perspective passed factual verification but exposed a deferred transaction constraint privilege error at publication. Migration `20261118091936_deferred_content_constraint` fixes the narrow check under its existing owner with an empty search path. No anonymous table access is granted. A regression publishes through the actual anonymous transport role and forces transaction-end constraints. The verified draft is retained privately if a future publication error occurs.

- **Perspectives completed end to end at 14:52 IST on 18 November.** Run `2a560559-0a60-4d90-9e91-3cbb19cc91aa` independently verified three original disclosures and published “Apeejay’s 94% occupancy is not a city benchmark”. Public URL: https://indiagully.com/insights/apeejay-s-94-occupancy-is-not-a-city-benchmark-2a560559 . The enabled 14-day schedule next runs on **30 November 2026 at 09:00 IST**; the topic preference was not changed.
- PR45 passed all CI checks including the anonymous-transport/deferred-constraint regression: https://github.com/arunkumarmanikonda-web/IG-NEWEST-MARCH26/actions/runs/44275156385 . Merged as `001d06ee73046228e90629679950d758e45d30d7`.
- All nine monitored background components are healthy after the completed cycles. Held catalogue files remain individually flagged; healthy worker execution does not label an unscanned file safe.

## Remaining inputs, not silently marked complete

1. Approved exact photographs for Ariane dinner knife `IG-ARIA-0000057` / reference `ARIA380ARN115`, steak knife `IG-ARIA-0000058` / reference `ARIA380ARN116`, and the existing Jaipur property record.
2. Approved supplier/product data for empty HORECA collections and real signed brand mandates for brand-side leasing listings. Existing coverage: 84 SKUs across Lighting (34), Cutlery (11) and Crockery (39); nine collections are empty; one promoter mandate and no brand mandate are published.
3. The paused 740 MB Ankur source requires a smaller file or administrator scan/preview before access/import. Its previous pending source-intake upload has not been deleted or presented as complete.

- Final implementation deployment `dpl_q5nNoRxuV3ko7eqwzzngkU1wpASZ` is READY and aliased to indiagully.com. The published Perspective returned HTTP 200 with its canonical and original-source links; the Perspectives archive also returned 200 and contains the new article.
