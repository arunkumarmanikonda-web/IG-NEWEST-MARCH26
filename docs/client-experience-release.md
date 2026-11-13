# Client experience and listing workflow release · 13 November 2026

Owner observations: an interest field that lost its choices, an unobtrusive enquiry acknowledgement, invisible light-button text, missing property references, shallow homepage practice presentation, missing global search and bulk publication, and a fragmented source-to-listing workflow.

## Changes

- Replace the enquiry datalist with a native selector, preserving a pre-filled property/practice brief as an option. Success replaces the form with a focused, prominent thank-you panel showing the server-returned reference. Retry uses the existing request ID; a new enquiry gets a new ID. The interface does not assert email delivery.
- Correct light-button contrast in dark feature panels. Disable page-wide smooth scrolling so keyboard focus and click targets remain stable.
- Put all seven practice choices, detailed service scopes and deliverables near the top of the homepage. Add a prominent site search and a direct real-estate listing navigation label.
- Add public global search with text, type, practice and location filters. It reads only the published content projection, plus public service/page descriptions. Add location and asset-type filters to the property explorer.
- Add filtered checkbox selection and bulk live/offline controls to CMS, real estate, HORECA and project registers. Each record goes through the existing MFA/scope/permission/revision-controlled publication endpoint. Partial failures are reported by record. Changed selections reset the review confirmation. Visibility is derived from actual public records, not a stale last-published counter.
- Extend existing PDF, Office, CSV and image intake with a separate map-link field, source-evidenced coordinates, substantive sectioned copy, SEO phrase suggestions and bounded advertising drafts. Reviewed keywords are saved with the content. No ads or campaigns are enabled.
- Add upload, AI enhancement and description-based hero generation within property/project editors, using the existing Runway job queue, budget and review controls. Generated results are labelled illustrative, including homepage cards. Source imagery extraction and explicit factual/image review remain in place.
- Add an India Gully A4 teaser action to every content register and saved editor. Private draft and public revision modes are separate; drafts carry a review watermark. Public opportunity teasers use the same template. Browser print provides Save as PDF.

## Data release

The four existing public portfolio references were restored with `scripts/restore-portfolio-references.sql`: Heritage Hotel Structure (Jaipur), Hotel Rajshree & Spa (Chandigarh), Prism Tower (Gurugram), and Santa Roza (Kasauli). This is a restoration of historical website briefs, not a statement of a current mandate, price or availability. Original caveats are preserved. The transaction checks each original version/body/metadata before release, and records four audit events. No newer drafts were overwritten and no user was impersonated.

`20261113080432_listing_search_keywords.sql` adds only `seo_keywords` to the existing metadata allowlist. Applied to preview and production. Verified anonymous writes and direct calls to the unscoped private write helper remain denied. Security advisor returned only existing informational deny-by-default RLS notices for private-schema tables; no warning/error finding.

## Validation and limits

- 158 Node tests passed, including global multi-filter search, filtered selection, exact publication flags and revisions, partial failures, teaser bounds, image-brief constraints and advertising-copy limits.
- Next.js production build passed with the production canonical URL and indexing configuration.
- Browser checks: homepage practice switching, dark-text/light-button contrast before hover, pre-filled interest changes, filtered selection and revision review, isolated form submission and focused confirmation with reference. The enquiry test uses an isolated local fixture and sends no real enquiry/email.
- Teaser fixture measured 794 × 1122 CSS pixels with footer inside the page. Browser PDF output still depends on selecting A4 and disabling browser headers/footers. Narrow-screen styles are present; the cloud browser did not expose a usable responsive viewport for a mobile-device acceptance test.
- Local QA fixtures were removed before release. No test property, enquiry or generated creative was published. The new property workflow did not incur a fresh paid OpenAI/Runway generation during this release. Authenticated staff still need to review actual supplied documents and generated results.
- Existing intake limits remain eight files and 2.5 MB combined; brand catalogue import uses its separate PDF upload workflow. Full map URLs with coordinates are supported; shortened location links need a full link or manual verification.
