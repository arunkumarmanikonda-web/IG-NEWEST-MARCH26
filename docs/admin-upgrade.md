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
- Quotation validity and event defaults follow India time.
- Source AI quantities such as "24 pieces" and "14 days" become numeric editor fields while retaining evidence excerpts. Ambiguous quantities remain blank with a review question.
- Generated draft kind and practice stay tied to the generation result when the form selection changes.

Validation: 115 Node tests and the Next.js production build passed. A rollback-only hosted suite passed 38 operational, catalogue, media and permission checks. The migration was applied only to the preview database. Tests do not leave vendors, orders, clients or stock movements behind.

Live provider acceptance: OpenAI source intake generated an unpublished SYSTEM TEST product draft through the signed-in admin interface. Runway image acceptance was started as a private 5-credit test; update its final status after inspecting the job and rendered media. No test content was published. Email OTP remains default and Fast2SMS remains disabled.

Still outstanding: full role-by-role browser acceptance and real source-file intake; Runway final media acceptance; real failed/refunded Razorpay transactions; separate production database/secrets and recovery drill; remaining staff onboarding; legal/grievance sign-off; Google Workspace mailbox OAuth; supported Vyapar interface; campaign sending/SEM activation; optional geocoding. The catalogue/procurement workspace is not a self-service retail cart/checkout or a vendor self-service portal. These capabilities need their own acceptance before being described as a complete marketplace.
