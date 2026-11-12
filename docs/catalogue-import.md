# Brand catalogue import

## Admin workflow
1. Open HORECA catalogue, then Upload brand catalogue.
2. Select a brand PDF and enter the brand name and the source/image permission reference. Confirm authority to process the document and use its imagery.
3. Each page creates distinct product/variant drafts containing the supplied description, specifications, manufacturer article code and a proposed source image. Unknown commercial facts stay blank.
4. Open Review product & SKU. Internal SKUs are assigned automatically. Select Set or edit SKU manually to replace one; duplicate SKUs are rejected case-insensitively. Clearing an existing SKU preserves it.
5. Check specifications and image association, approve the source image if appropriate, save and explicitly publish the reviewed product. Existing upload/enhancement/generation tools can replace or improve images.

PDFs may be up to 25 MB and 500 pages. Keep the page open while processing. Pause finishes the active page; resume skips previously completed work without charging a second extraction for those pages. The configured AI daily allowance applies. Large catalogues can be processed over multiple sessions. Pages with more than 24 products or unreadable details require review or a split source.

## Processing and privacy
The original PDF uploads directly into a private Supabase bucket. Processing uses a per-page lease and source fingerprint. Embedded artwork is preferred; white-background artwork segmentation is a fallback. Candidate identifiers are embedded visibly into the AI-only image input, while saved source images remain clean. Unambiguous manufacturer-code positions provide a second image-association check. Scans, complex grids and lifestyle layouts can still require image replacement; all product and image publication remains explicit.

Manufacturer codes are separate from internal SKUs. An existing product with the same brand and manufacturer code is linked without silently overwriting its approved content. Completed pages and their product associations are idempotent. Private source image access requires staff permissions. Missing images do not prevent creation of a draft requiring review.

## Verification
133 Node tests and the Next.js production build pass. Regression tests include actual PDF rendering, complete image extraction, correction of swapped vision image proposals using printed codes, and ambiguous-layout preservation. Browser/database checks confirmed automatic SKUs, manual override, case-insensitive duplicate rejection, retention of an existing SKU when cleared, blank-page exclusion, completed-page retry without duplicate products, and private draft/source storage.

The final live two-page fixture produced two products with the correct complete plate and lamp images and no products on the blank page. All eight synthetic products created while checking earlier and final revisions are archived. Source catalogues and images remain private test evidence; none was published. The separate rollback-only SQL suite at scripts/verify-brand-catalogue.sql is prepared but did not run because its confirmation expired; it is not counted as passed acceptance.
