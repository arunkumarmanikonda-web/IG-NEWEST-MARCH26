# India Gully experience audit implementation

Source: IG_Experience_Audit.pdf, 18 November 2026. Scope: all 20 observations, preserving the existing India Gully design, access controls and lead-capture policy.

| Audit | Delivered | Verification |
|---|---|---|
| 01 | One canonical Park Plaza Ludhiana record, Majestic Hotels Limited identity, 114 total keys, operator agreement separated from tenure; source-qualified historical operations | Optimistic content-release script; public page, PDF and Gullu share the published record |
| 02 | Separate controlled sector, asset type and transaction choices; corrected active records and filter projection | Classification and collection tests; editor quality checks |
| 03 | Facts review, information period, process stage and separate availability confirmation; automatic 30-day review reminders in staff overview | Future-date rejection in SQL, freshness unit tests; unknown operational facts remain flagged |
| 04 | Office subtype, eighth-floor drawing label, correctly labelled unit area, separate rent period/basis/CAM/taxes/possession/use | Source-reviewed Unitech correction preserves the owner-approved ₹100 quote, with missing commercial terms explicitly unconfirmed |
| 05 | Five homepage intent routes, Client workspace label, shortlist entry, clean practice strip | Build and live layout check |
| 06 | Shorter active property titles, compact cards, fact grids and source-qualified sections | Shared page and PDF records; long-paragraph tests |
| 07 | Funding, refinancing, leasing, insolvency and Hinglish search aliases; canonical locations and leasing types | Representative customer-phrase regression tests |
| 08 | Current opportunities default; portfolio switch and matching inventory counts; two-sided leasing brief | Collection tests and live catalogue review |
| 09 | Product detail quantity, pack/MOQ, add-to-quotation, basket link and confirmation | Quantity boundaries and live detail-to-basket check |
| 10 | Complete quotation draft persists in session storage for 24 hours; exact basket return after login; entity revalidation | Browser reload test includes title, destination, date, notes and lines; authenticated submission covered by existing procurement SQL workflows |
| 11 | Category-aware specification fields, exact manufacturer length for sampled Ariane spreader, sample/finish unknowns explicit; AI source-evidence extraction extended | Manufacturer catalogue article ARIA140ARN112, length 168.50 mm. Existing exact-photo checks preserved |
| 12 | Browse/count labels distinguish stocked catalogue records from project sourcing; structured sourcing brief | Empty catalogue journey and contact prefill |
| 13 | Public-to-private stages before registration and within the NDA journey; existing request/status/room tracker retained | Current stage based on request status; existing access-control SQL workflows |
| 14 | Clean prefilled enquiry, private listing reference, contact preference, team expectation and customer-owned enquiry tracker | Enquiry outbox workflow and new ownership SQL tests; no unsolicited test emails |
| 15 | Contextual questions before and after lead capture; explanation of registration benefit | Existing multilingual, greeting, assent, first-person, grounding and handoff regression tests |
| 16 | Corrected Alphathum alt text, larger controls, mobile reading alignment and responsive cards/tables; reduced-motion treatment | 320px browser regression, keyboard Escape/focus test and visual review |
| 17 | Optical logo sizing, role filters and existing approved relationship qualifications | Visual review; artwork unchanged |
| 18 | One canonical practice label across generated and manual Perspectives | Category normalization tests and archive check |
| 19 | Reading time, opening takeaway, related reading and practice-specific enquiry that retains article context | Public article/related-record projection |
| 20 | Anonymous shortlist, explicit import into authenticated account, up-to-three comparison, links to enquiry/access/procurement status | UUID validation, caps, same-account SQL isolation, unavailable-record handling |

## Release and operating limits

The migration adds an own-account saved-list table, limited customer RPCs, enquiry listing references and validated factual-review dates. It preserves existing content versioning and access controls. `scripts/release-experience-content.sql` checks exact reviewed versions and records new revisions; it refuses concurrent edits.

Unknown facts are not converted into verified claims. Current operational inventory, rent period, area basis, CAM, taxes and possession remain confirmation items where the source did not establish them. Two previously identified Ariane knife SKUs still require exact approved manufacturer photographs; unrelated or generated substitutes are not used. The Jaipur portfolio remains honestly labelled photography on request.

Actual new outbound email delivery and a complete live customer identity/NDA execution are not claimed from local or mocked tests. Existing provider configuration and controlled database workflows are preserved. No live customer enquiry, purchase or access request is created merely to test this release.

No accessibility certification or conversion-uplift claim is made. Browser checks cover the specified public journeys, keyboard dismissal and 320 CSS-pixel reflow.
