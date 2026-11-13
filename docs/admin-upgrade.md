# Admin operations upgrade · 12 November 2026

Owner scope: separate website CMS, property opportunities, global clients, project data rooms, HORECA catalogue/SKUs, HORECA procurement and PMC operations; independent practice workspaces; source-assisted AI creation.

Implementation acceptance:
- Persistent audited records, practice rights, MFA, optimistic revisions, archive controls.
- RFQ schedules, quotations, comparable landed totals, award snapshot, receipts/dispatch/returns, delivery record and stock reconciliation.
- PMC projects, dependency programme, approved baseline, cost tracking, approved/rejected variations, measured progress, RFI and risk registers.
- Dedicated catalogue with SKUs and CSV import. Public catalogue reads published database revisions.
- AI intake: text + PDF/Office/CSV/images, evidence references, missing-data questions, content/product/project forms, SEO. No invented property facts, coordinates, imagery provenance, price or legal claims.
- Approved source image gathering, framing/resizing and private storage; optional illustrative Runway concept generation. Coordinates are extracted from supplied source material or full map links, with a review step; external geocoding is not configured; confidential listings never expose exact coordinates.
- Review and publication remain permission controlled. AI cannot approve its own facts, release restricted data or send orders to vendors.

## Recovery and acceptance, 12 November 2026

The previous conversation completed and deployed implementation commit `d28e69d`, but its PR and launch notes were stale. The resumed review verified the repository, healthy Mumbai preview database and protected branch deployment.

Corrections made during acceptance:
- Full receipts now display `received`; return movements recalculate state and clear obsolete delivery acknowledgement.
- A corrected progress measurement below 100% reopens a completed activity. Project closure requires a completed programme and closed RFIs, risks and undecided variations. Predecessor changes cannot silently invalidate successor dates.
- Operational save retries retain their request identity, including lifecycle consistency checks. Added schedule lines use an unused line reference.
- PMC portfolio figures aggregate the portfolio; a selected project's progress is explicitly scoped.
- Quotation validity, event defaults and creative-register timestamps follow India time.
- Source AI quantities such as "24 pieces" and "14 days" become numeric editor fields while retaining evidence excerpts. Ambiguous quantities remain blank with a review question.
- Generated draft kind and practice stay tied to the generation result when the form selection changes. Previously saved intake jobs are normalized when opened in the editor.
- The scheduled worker signature check no longer depends on a global Node Buffer in the Edge runtime.
- The private media importer can resolve its existing authenticated worker RPC. Its storage limit now fits the preview storage plan (50 MB video cap, 15 MiB image cap), and failures log only the stage and error class.

Validation: 116 Node tests and the Next.js production build passed. A rollback-only hosted suite passed 38 operational, catalogue, media and permission checks. The migration was applied only to the preview database. Tests do not leave vendors, orders, clients or stock movements behind.

Live provider acceptance: OpenAI source intake generated an unpublished SYSTEM TEST product draft through the signed-in admin interface. Runway completed the private 5-credit image test, imported a PNG into a private bucket, cleared the temporary source URL and reached `ready`; the admin register displays the private image. The browser RFQ form saved its line schedule and audit revision; the fictional RFQ was then archived. No test content was published. Email OTP remains default and Fast2SMS remains disabled.

Current activation dependencies are listed in [launch-readiness.md](launch-readiness.md). That current matrix supersedes the earlier pending list.

## Customer and supplier procurement continuation

The customer quotation basket now supports published catalogue products and custom requirement lines. Submission rechecks product availability, MOQ and pack size, creates a private customer request and an internal RFQ, and retains an idempotency reference. Customers can view only their own requirement, released quotation, acceptance, payment link and fulfilment status.

Supplier contacts are explicitly enabled by procurement staff. Deadline-bound RFQ assignments expose only that requirement and the supplier's own quotation. Quotation submissions feed the existing comparison register; revocation removes portal access. Customer sales quotations remain separate from supplier costs. Totals are recomputed in Postgres, acceptance binds the exact revision, and payment requests use the accepted amount.

Acceptance: 23 rollback-only hosted checks cover customer/supplier isolation, retry identity, role boundaries, supplier revocation, hidden internal rates, exact quote acceptance, locked commitments and duplicate invoice prevention. Node coverage is 118 tests. Browser acceptance confirmed request WEB-BA81231E10AB entered the RFQ register and was visible in the customer portal. The fictional request was then cancelled through the customer RPC and its RFQ closed; it represents no supply or commercial commitment. Real CSV intake also succeeded with SKU QA-FILE-PLATE-002, MOQ 24, pack size 12 and lead time 14.
