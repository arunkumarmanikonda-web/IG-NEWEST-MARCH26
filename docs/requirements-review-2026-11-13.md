# India Gully requirements review · 13 November 2026

This review supersedes historical launch/handover status notes. It distinguishes implemented functionality from live operational acceptance. A passing build is not proof of a completed customer transaction.

| Discussion requirement | Current implementation / location | Verification or remaining action |
|---|---|---|
| Git → Vercel → production Supabase | Main branch, existing Vercel project, Mumbai production database | Production connection retained; deployment checked against commit |
| Corporate white/charcoal brand, supplied logos, no green or gold website borders | Shared public and management styles, real logo assets, SVG/favicon/manifest | Existing public design retained; gold reserved for approved briefs/payment cards |
| Real estate prominent on home, navigation and practices | Real Estate Listings; opportunity pages and filters | Four real opportunity records; no invented inventory added |
| Remove numbered practice bullets; fuller practice content | Public practice presentation and detailed practice pages | Existing public revision retained |
| Profile alignment, expanded biographies, LinkedIn | Dedicated leadership pages with verified profile links | Existing published revision retained |
| Gradual company journey including 2022/2023/2025 | About / journey | Published narrative retained |
| Global filterable search | /search | Live browser: content-type filter plus Chandigarh search returns the matching hotel listing |
| Enquiry interest selection and prominent thank-you/reference | Contact form and confirmation state | Live browser can switch from Real Estate Advisory to HORECA after selection; confirmation covered by automated tests; delivery records checked separately |
| Enquiry mail to Arun, Pavan and Amit plus client acknowledgement | Transactional outbox and Resend worker | Current delivered records exist for all three named senior mailboxes; provider delivery is not proof of inbox placement |
| Grievance contact | Pavan, pavan@indiagully.com, +91 8988988988 | Business settings/public grievance content |
| Vyapar excluded | No Vyapar integration | Remains excluded |
| Returning-user login, saved acceptance, email/authenticator choice | /login and /login/verify; database sign-in status | Existing implementation; individual staff activation must be completed by each recipient |
| Requested owner passcode reset | Auth administration | No credential is stored in this repository or this report; exact requested reset not verified in this review |
| AI must start the form, not be a hidden separate link | /admin/content/new defaults to source-first AI creation for all eight content kinds | Implemented in this release; manual creation is an explicit secondary option |
| Files → AI → complete form → admin review → publish | Private source room, section processing, saved content draft and private evidence | Eighteen rollback-only database assertions and upload/orchestration unit tests; real signed-in acceptance still required |
| Retain source files in the listing data room | Originals upload directly to linked private room, no second transfer | Content and room created together; publishing content never grants room access |
| Visible data-room share action | Every content row and editor → Data room & access | Top-level Files, Share access & permissions, secure-link and NDA-link controls |
| NDA, multiple clients, expiry, revoke, per-file downloads | Property room grants and Clients & engagements | Existing approval and permission controls retained; copying a link never grants access |
| Other content private source rooms | Product, showcase and CMS AI workspaces | Source storage supported; client report circulation for non-property work uses Clients & engagements |
| Upload without a fixed website MB cap | Direct resumable uploads | Fixed signed TUS endpoint (/resumable/sign); no invented capacity diagnosis. Provider limits still apply. Eight AI sources per draft and 100 room files per batch remain processing limits |
| Reported PPTX and HORECA PDF upload failure | Shared resumable uploader | Production logs showed AccessDenied / Invalid Compact JWS on the unsigned TUS route; fixed endpoint and credential-safe actionable errors |
| HORECA brand catalogue → many products/images/specs | /admin/catalogue/import | Existing page-by-page AI extraction, product drafts, source-image crops, resume and review; shared upload fix applies here |
| Automatic editable SKU | Database SKU allocation plus product editor | Database assertion confirms automatic product SKU; manufacturer source codes preserved by catalogue import |
| Upload/enhance/generate product and listing images | Product image / Listing hero studio | Existing Runway integration; source image automatically prepared privately after AI extraction when available; administrator approves suitability before public use |
| SEO and SEM | Generated metadata/keywords in form; advertising suggestions saved privately | No ranking guarantees; suggestions do not launch paid campaigns |
| Branded luxury property/HORECA brief | Shared approved three-page PDF renderer | Full-bleed cover and CTA, gold frame, header/footer; Arun + Amit for real estate, Pavan for HORECA; design unchanged |
| Bulk live/unlive with checkbox/filter | Content registers | Existing version/permission-aware bulk actions retained |
| Staff amount-defined payment links / QR / attribution | /admin/collections | Production records confirm a live INR 10 collection paid in full and attributed to Arun Manikonda on 14 November 2026 at 01:59 IST. Bank settlement remains a separate provider process |
| Branded friendly payment request with QR in card | Collection card/PDF/email renderer | Automated QR decoding, attribution and amount checks; live client receipt/payment not inferred |
| HORECA RFQ, vendor comparison and fulfilment | HORECA procurement and customer/supplier portal | Rollback-only database checks pass for quote, award, receipt, dispatch, delivery and return; real operational acceptance still required |
| PMC programmes, budgets, variations, progress | PMC delivery workspace | Rollback-only database checks pass for baseline protection, variation approval, measured completion and corrected progress; real operational acceptance still required |
| AI for other practice records | Practice/operations creation | Existing source-based operational drafting retained; financial/award approvals stay explicit |
| Individual business mailbox | My business mailbox | OAuth connection still required per mailbox; general Resend service emails are separate |
| Automated marketing | Campaign and interest/consent controls | Optional campaign provider activation remains outstanding; no unsolicited campaigns enabled |
| Optional SMS / WhatsApp | Email remains primary OTP channel | Not claimed active; Fast2SMS disabled and WhatsApp integration not activated |
| Backup recoverability | Database backup exists | Restore drill and Storage-object recovery exercise still outstanding |

## Verification boundaries

### Checks completed on 14 November 2026 (India time)

- 204 automated JavaScript tests and the production build passed for the main upload/data-room release.
- 153 rollback-only database assertions passed: AI content intake (18), brand catalogue (20), staff collections (31), client engagements and file permissions (25), procurement portal (21), and HORECA/PMC operations (38). These checks leave no test records and do not call paid providers or send mail.
- No production error/fatal entries were returned by Vercel for the inspected 15-minute window ending at 02:33 IST. This is a scoped log check, not a claim that every future request is error-free.
- Supabase security advisors returned no warning/error findings in this review.
- The public property PDF endpoint returned HTTP 200, application/pdf, attachment disposition and a 367,438-byte file. Browser file retrieval completed successfully. The first browser download-event observer timed out; direct retrieval of the same visible link succeeded. The approved three-page renderer is unchanged.
- A final follow-up preserves the saved source text and writing instructions when regenerating an existing AI draft, so a text-only source does not reopen as an empty form.
- Live property-page visual evidence: [property layout](verification/property-check-2026-11-14.jpg).

- Source files in the user's screenshots were not supplied as actual PPTX/XLSX/PDF attachments to this session, so their exact contents were not processed here.
- This browser currently reaches the sign-in screen; a signed-in administrator run is needed to verify upload → AI → editor → publication with those original files.
- Payment credentials, OTPs, customer documents and shared-room tokens must not appear in logs or source control.
- No new client grants, public listings, paid collection or outbound client messages were created by these checks.
