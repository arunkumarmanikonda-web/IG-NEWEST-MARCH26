# India Gully discussion audit · 14 November 2026

This is the current requirement-by-requirement review. It replaces blanket completion claims in earlier handovers. It uses the messages available in this conversation, the recovered 11 November client-management requirements, current code, production records and recorded live tests. Repeated login acknowledgements and repeated requests are consolidated; later design decisions take precedence. It does not claim access to a verbatim transcript of every separate ChatGPT window.

**Status definitions:** Verified = observed live or supported by production evidence; Implemented = code/database controls exist, with the stated test scope; Partial = a substantive requested capability is still missing; Activation = a person/provider configuration is required; Acceptance = a representative real business workflow remains unobserved. These labels are deliberately distinct.

## Material gaps still open

1. **Complete CMS control is partial.** Listings, products, projects, articles, people and company-story records are editable. The home hero, practice presentation and journey milestones still contain code-managed copy. A CMS practice record currently has a generic published route; it does not replace the main `/practices/[slug]` page. A complete page/menu/block editor, publication scheduling and complete layout control are not delivered.
2. **Business mailbox integration is not connected.** Production has zero connected staff mailboxes. The OAuth application setup and each person's authorisation are outstanding. Transactional enquiry/payment emails through Resend are a separate working service.
3. **Autonomous marketing/remarketing is incomplete.** Campaign preparation, audience consent and approval controls exist, but production campaign sending is disabled and there are zero active campaigns. Advertising/SEM is draft copy and strategy, not a connected advertising account, live conversion tracking or an approved paid campaign.
4. **Real HORECA catalogue release is outstanding.** The import mechanism passed a live two-product fixture; production still has zero published products. Actual Ankur/Ariane imports, product-image matching, specifications and release require completion. Catalogue-import SEO uses generated titles/summaries as fallback; dedicated keyword population is not automatic on that particular route.
5. **AI image creation is assisted, not wholly unattended.** Suitable extracted source media can be prepared privately. Generate/enhance controls are available, but an administrator still starts a generation where a suitable source image is absent and approves the image. An automatic fallback hero for every source-free draft is not established.
6. **Operational acceptance is incomplete.** HORECA RFQ-to-delivery and PMC baseline-to-variation-to-progress controls passed transactional checks. Actual full commercial workflows, multiple real client sign-ins, and end-to-end client report circulation have not all been observed.
7. **Staff onboarding remains open for Pavan and Amit.** Both invitations were still unaccepted in the production read on 14 November. Arun's staff session works. The exact previously requested password-reset outcome is unverified; this audit contains no credentials.
8. **Recovery acceptance remains open.** A database/Storage restore exercise, full recovery-password completion and production refund/failure acceptance are not established by the successful upload or live INR 10 collection tests.

## Request ledger

| ID | Requirement from the discussion | Current result and evidence | Status / remaining work |
|---|---|---|---|
| 01 | Resume the existing India Gully project; do not create an unrelated organisation/repository | Existing `IG-NEWEST-MARCH26`, India Gully Vercel project and Mumbai production Supabase retained | Verified |
| 02 | Git connected to Vercel and Supabase; merge and deploy | Main is Git-deployed to the live domain; Supabase supplies production data/auth/storage | Verified; schema migrations are controlled separately, not automatic Git deployment |
| 03 | Website live at indiagully.com | Production custom-domain deployment is ready | Verified |
| 04 | Use the supplied India Gully logos, no replacement IG text mark | Public/admin layouts use brand assets; SVG, icon, mask and manifest assets exist | Implemented; actual logo colours retained |
| 05 | Corporate whites and matching charcoal; no green or gold website borders | Current shared public/admin brand styles use neutral palette | Implemented; full aesthetic acceptance remains subjective |
| 06 | Gold borders specifically for payment card and luxury brief | Dedicated payment and three-page brief renderers retain that later approved exception | Implemented |
| 07 | Better homepage, visible practices, richer content | Property-led hero, practice explorer, fuller practice deliverables, company and work sections | Implemented; not every fixed section is CMS-editable |
| 08 | Real estate listings must be a prime focus | Main home CTA, showcase, navigation and real-estate practice links lead to listings | Verified |
| 09 | Corporate nomenclature; remove Property Collection label | Public label is Real Estate Listings | Implemented; historical filenames/docs may retain old implementation names |
| 10 | Remove cheap numbered practice bullets | Public practice navigation uses unnumbered labels | Verified |
| 11 | Listing presentation, photography, filters, details and CTA | Property cards, filters, photograph dialog, details, related properties and brief/NDA/enquiry links | Implemented; current inventory is four historical property records, not newly confirmed mandates |
| 12 | Visible Explore button before hover | Explicit high-contrast CTA styling in current public design | Verified in prior browser pass |
| 13 | Profiles align and expand elegantly | Dedicated expanded leadership pages and revised typography | Implemented; design still subject to owner review |
| 14 | Leadership LinkedIn links | Per-person verified profile links in leadership presentation | Implemented |
| 15 | Rephrase the entire gradual company journey | Narrative milestones in `lib/company.mjs` and timeline presentation | Implemented; editing those milestones still requires code |
| 16 | Add 2022 retail leasing | 2022 milestone: Connecting places with brands | Implemented |
| 17 | Add 2023 transaction advisory, feasibility and forensic advisory | 2023 milestone: Greater depth behind every decision | Implemented |
| 18 | Add 2025 CIRP / NCLT advisory | 2025 milestone: Engaging with greater complexity | Implemented |
| 19 | Interest dropdown must reopen/change after a selection | Replaced brittle selection behaviour; live switching between real estate and HORECA checked | Verified |
| 20 | Prominent enquiry thank-you with reference | Dedicated success presentation with receipt reference | Implemented and automated checks; earlier exact enquiry retained in database |
| 21 | Enquiries reach Arun, Pavan and Amit plus customer acknowledgement | Separate transactional outbox jobs; provider-delivered records for all three staff destinations | Verified provider delivery; inbox/spam placement cannot be inferred |
| 22 | Pavan grievance email and telephone | pavan@indiagully.com; +91 8988988988 | Implemented |
| 23 | Global filterable website search | `/search`, content-type filters and property location matching | Verified with Chandigarh property search |
| 24 | Separate CMS, listings, catalogue, clients, data rooms and practice modules | Separate management navigation and registers | Verified |
| 25 | Full editable CMS, including all website content | CMS records exist, but main home/practice/journey copy still uses code | **Partial**; full visual/page/menu control is missing |
| 26 | Client organisation with multiple named contacts | Backend already supported multiple emails; former UI hid repeated entry. New visible batch form supports several contacts during creation and afterward | Verified live: two contacts on creation, then a third added to the same client |
| 27 | Contact telephone number | Added persistent phone field, editing and contact-summary display | Verified live: three distinct numbers; edited number persisted after reload; no OTP/SMS sent |
| 28 | Find contacts easily | Client search now matches organisation/reference plus contact name, email and phone | Implemented in this release |
| 29 | Each client contact signs in independently | Contact email eligibility and separate room grants; no shared client password | Implemented; multiple actual client OTP sessions still need acceptance |
| 30 | Manually create client engagements for feasibility, valuation and audits | Client assignments for feasibility, valuation, forensic/operational audit, financial review, due diligence and other engagements | Implemented; private rooms created per engagement |
| 31 | Multiple report circulation emails | Multi-contact grants and separate personalised notices without exposing other recipients | Implemented; ten-contact transactional checks pass; actual circulation acceptance open |
| 32 | Start listing creation with source/data-room uploads | New content defaults to source-first AI workflow | Verified with PPTX + XLSX |
| 33 | AI fills the whole listing, content and SEO; administrator reviews/publishes | Title, summary, body, applicable facts, search phrases and SEO metadata saved in editor | Verified with fictional property; unknown facts remain blank for review |
| 34 | PDF, image, Word, Excel, PowerPoint and location sources | Supported modern source formats and coordinate/map processing | Implemented; unsupported/encrypted files require a readable source copy |
| 35 | Extract source images and retain source documents | Private source media plus linked source room | Verified originals retained; image identity/rights approval remains explicit |
| 36 | No arbitrary file-size restriction | Direct resumable originals without website MB cap | Verified 7.34 MiB PPTX across chunk boundary; provider/resource allowances still apply |
| 37 | Fix property and HORECA upload-paused errors | Corrected signed resumable endpoint; invalid signature was the observed cause | Verified with property and catalogue fixtures; exact Trillion/Ankur original retry still outstanding |
| 38 | AI should not fail an entire draft over an optional field/ad suggestion | Unsupported optional fields withheld; overlength ad suggestions omitted with private review note | Verified property flow after both fixes; regression checks pass |
| 39 | Professional public copy without internal processing notes | Dedicated fields and a guard against repeated labelled SEO/ad/admin paragraphs in body | Implemented; final editorial review remains necessary |
| 40 | HORECA brand catalogue automatically creates multiple products | Page processing, specifications, manufacturer codes and source-image crops | Verified with two-product PDF; real brand catalogue release outstanding |
| 41 | Auto SKU with administrator override | Automatic unique SKU; editable control; separate manufacturer code | Verified with two distinct test SKUs |
| 42 | Upload or professionally enhance/generate HORECA images | Three image methods in product editor; provider-backed private generation/enhancement | Implemented; source identity/technical correctness need approval |
| 43 | Property hero generation when required | Upload/enhance/generate methods in listing editor | **Partial automation**; missing-image generation still needs an administrator action |
| 44 | Bulk checkbox live/unlive on listings and other content | Filtered registers and version/permission-aware publication actions | Implemented; publishing actual records requires content approval |
| 45 | Data-room files, folders, file permissions and multiple clients | Private room folders, bulk uploads, grant expiry/revoke, view-only/download controls | Implemented; original Office files need a linked PDF for watermarked view-only preview |
| 46 | Clear data-room access-share option | Data room & access links from editor/register; visible share/NDA/secure-link controls | Verified live; copying a link does not grant access |
| 47 | Store uploaded sources in the related room for later sharing | Original intake files remain linked privately to content | Verified; publication does not publish the originals |
| 48 | NDA then approved property access | Project-specific acceptance and administrative approval/grants | Implemented; separate engagement confidentiality workflow for client reports |
| 49 | Elegant property brief, up to three pages | Shared approved three-page renderer, full-bleed opener and CTA, gold frame/header/footer | Verified download; approved design preserved |
| 50 | Correct CTA: Arun + Amit for real estate, Pavan for HORECA | Shared brief contact logic | Implemented |
| 51 | Reuse the approved brief design for each AI-created listing | AI-created and manual records use the same PDF renderer | Implemented; generation is on-demand from current saved content |
| 52 | Faster and useful brief download | Public PDF endpoint tested as an attachment; optimised output retrieved | Verified tested file; not a universal latency guarantee |
| 53 | Every staff dashboard can create amount-specific payment link/QR | Shared Collect payment entry and collection workspace | Implemented |
| 54 | Attribute every collection to issuing staff | Issuer snapshot, reference and provider reconciliation | Verified paid live INR 10 request attributed to Arun; bank settlement separate |
| 55 | Branded friendly payment/enquiry/internal communications | Shared templates with legal entity, issuer/client/purpose/amount as applicable | Implemented; all possible inbox clients have not been visually tested |
| 56 | Payment request card with gold border and embedded QR | Branded payment card/PDF and email representation | Implemented; QR/amount/issuer automated checks pass |
| 57 | Razorpay live, not test | Production live credentials and verified live collection | Verified; refund and failure/recovery acceptance remain open |
| 58 | Staff/admin direct returning login, keep email, choose authenticator or email code | Saved sign-in state and either approved verification method | Verified Arun staff session; identity verification is still required for expired sessions |
| 59 | Do not ask for already-recorded terms acceptance repeatedly | Original registration acceptance retained and duplicate consent prevented | Implemented in staff-verification migration |
| 60 | Requested owner passcode reset without repeat change prompt | Owner can sign in; exact reset outcome not verified in this review | **Acceptance open**; no password copied into documentation or source |
| 61 | HORECA RFQs, vendor comparison, quotes and fulfilment | Procurement workspace, customer/supplier portal and audited state transitions | Implemented; actual full commercial lifecycle acceptance remains open |
| 62 | PMC programme, budget, variations and progress | Operational records and approval/baseline/progress controls | Implemented; actual programme lifecycle acceptance remains open |
| 63 | AI drafting for other practice operations | Source-based operational drafting | Implemented; budget/award/payment approvals are explicit |
| 64 | Individual business mailboxes inside the backend | OAuth/mailbox UI and encrypted personal credentials/drafts | **Activation open**; production currently has zero connected mailboxes |
| 65 | AI SEO/SEM, personalised marketing and remarketing | Metadata, ad suggestions, consent/audience and campaign controls | **Partial / activation open**; no active paid ads, automated remarketing or production campaigns |
| 66 | Email OTP, optional WhatsApp/SMS | Email OTP works; WhatsApp/SMS not activated | Email verified; optional channels open |
| 67 | No Vyapar integration | Excluded from the implementation | Agreed exclusion retained |
| 68 | Free valuation tools from the earlier site | Income-capitalisation, DCF and hotel enterprise/equity calculators | Implemented with automated calculation checks; indicative tools, not valuation certification |
| 69 | Finest backend with dependable recovery | Permission/audit controls, tests, storage and backups | **Acceptance open**; restore exercise and full end-to-end operational rehearsal remain |

## Verification for the contact correction

- 212 JavaScript tests passed, including multi-contact input, international phone formatting, blank rows, duplicate email and invalid-row handling.
- Production build passed. Main release: `06c9ea620e9e8fcefb749e1e71e27d53256fea57`; Vercel production deployment `dpl_22ZmQRXfUyhiVbbqGv82XhqoneZT` reached READY.
- 11 new rollback-only contact checks passed: batch creation, persisted phones, later additions, individual edit/versioning, backwards compatibility, duplicate/invalid rollback, no automatic room grants and unauthenticated denial.
- All 25 existing client-engagement access/circulation checks passed again. No real reports or emails were transmitted by these tests.
- Supabase security and health review returned no warning/error findings; private-schema deny-by-default INFO notices remain. A separate performance advisory for the AI-jobs policy and an operations foreign-key index remains an optimisation item, not evidence that contact entry is broken. See [RLS optimisation guidance](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan).
- Live browser acceptance passed on `https://indiagully.com/admin/clients`: created one fictional client with two contacts in one submission, added a third afterward, edited the first contact's phone and reloaded. All three contacts and the edited number persisted. The new-contact form cleared after a successful addition.
- The fictional client `INTERNAL QA Multi-contact Verification` was then archived, and its archived stage was verified after reload. Portal and circulation permissions remained off; no emails were sent and no room access was granted. The existing IRIS RESORTS client and its contact were not altered. The browser was left on the blank corrected Create client form.
- [Live multi-contact verification screenshot](verification/client-contacts-2026-11-14.jpg) shows only fictional contacts before the fixture was archived.
