# Large source uploads

The AI creation studio and HORECA brand-PDF importer have no website-imposed MB cap. Both upload directly to private Supabase Storage with 6 MiB resumable chunks. Hashing uses slices rather than loading the entire file into browser memory. The bucket-specific size limit is unset; the storage project's global upload allowance and available capacity still apply.

The creation studio accepts up to eight supported source files per draft. Source metadata is bound to the signed-in staff member, practice and SHA-256 digest. Access requires current staff permissions and MFA. Uploaded originals are immutable and never receive public URLs. Processing validates the stored length and digest.

PDFs are read in sections of 20 pages. Text and large Office text are processed in sections. Large processing images are resized without changing the original upload. A final draft can combine only all completed sections of the same sources and brief. Conflicting or unsupported specifications are left for review. Section results are cached so retrying completed work does not repeat its AI call. Keep the page open; pause takes effect after the current operation. Existing AI daily allowances still apply.

Upload size and processing capacity are different. Provider request budgets, server memory/time, archive-expansion protection, supported formats and catalogue page limits remain operational constraints. A very large or unusually dense source can upload successfully but need a smaller processing copy or a specialist processing pass. The original remains private. The new path does not silently truncate the document. Existing data-room and standalone media upload workflows are unchanged.

## Verification (13 November 2026)

- 167 Node tests and the Next.js production build pass.
- A valid padded 26 MB PDF is divided into all 41 pages across three sections.
- A 60 MB test PDF is accepted by the actual client component in the isolated local interface check. This verifies selection, not a completed production transfer.
- The rollback-only database suite passes 14 assertions in preview and production, including large-size metadata, deduplication, incomplete upload rejection, practice/MFA/anonymous access, and private bucket settings. No paid AI calls or real large-file transfers are made by that suite.
- A complete authenticated large-file transfer and AI run in production has not been repeated; the browser requires staff sign-in.
