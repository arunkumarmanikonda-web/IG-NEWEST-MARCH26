# India Gully programme status — 13 November 2026

Historical checkpoint. The current requirement-by-requirement record is [14 November discussion audit](discussion-audit-2026-11-14.md). Earlier checkpoint documents remain historical and their upload limits or content counts may be superseded. Deployed code is not equivalent to accepted production business workflows.

| Request | Current evidence | Remaining acceptance / work |
| --- | --- | --- |
| Git, Vercel and Supabase | Main branch deploys to India Gully Vercel production; production database connected | Final live user workflow acceptance |
| Enquiry interest and confirmation | Select preserves prefilled interests; prominent thank-you/reference panel | Broader device acceptance |
| Enquiry emails to Arun, Pavan and Amit | Latest 13 Nov 08:28 UTC test: all three internal notifications and acknowledgement delivered | Ongoing operational follow-up by staff |
| Brand, CTAs and practices | Original logos, neutral palette, corrected CTA contrast, unnumbered practice navigation, Real Estate Listings & Advisory as first practice; property-led home hero and prominent Property Collection | Whole-site design/content/mobile/performance acceptance |
| Property discovery and global search | Property Collection with large photography, URL-persisted search/filter/sort, full-screen photograph, approved facts, enquiry/brief/NDA links and related properties; four restored portfolio briefs | Verify current mandates/availability; historical briefs are not new listings |
| Bulk live/offline | Filtered checkbox selection and revision/permission controlled bulk action | Staff acceptance on actual records |
| AI property creation and teaser | Source intake, evidence extraction, full map coordinates, content/SEO drafts, hero controls, reviewed publication and A4 teaser | Full signed-in source-to-publish-to-PDF acceptance; short Google Maps links now expand where redirects expose coordinates, with mandatory pin/disclosure review |
| HORECA catalogue/products/images | Catalogue extraction, source images, generated editable SKUs and image controls implemented | Zero published products at audit; import and approve actual brand catalogues |
| Upload size request | AI source/brand-catalogue and data-room originals have no website-imposed MB cap; resumable private transfer. Standalone photographs have no input MB cap and are resized in the browser | Storage provider allowances/browser resources still apply. Large view-only room originals need an optimised companion PDF for bounded rendering. CSV catalogues stream without a total file/row cap into bounded, retry-safe batches; individual product fields remain validated |
| HORECA / PMC / practice operations | Operational modules implemented with rollback and selected browser checks | Full commercial lifecycle acceptance with actual engagements |
| Staff payment links/QR/attribution | New collection workflow, issuer snapshots, references, QR cards, branded email queue and scheduled status checks | Actual signed-in production request/inbox/payment/cancellation acceptance; refunds in Razorpay |
| Brand communications | Payment, enquiry, internal enquiry, room, campaign and mailbox renderers share branding | Branded sign-in, confirmation and recovery templates installed in production Supabase and previewed; inbox rendering/recovery acceptance remains. Google mailbox OAuth inactive |
| Staff access | Owner access configured | Pavan and Amit invitation acceptance still outstanding at audit |
| SMS, WhatsApp and campaigns | Infrastructure/controls present where documented | SMS/WhatsApp inactive; no approved production campaign/audience/budget activated |
| Recovery and operations | Backup and recovery configuration present | Full restore drill and password-recovery completion |
| Vyapar | Excluded by decision | No integration planned |

Production content at audit: four opportunity briefs, 12 projects, three pages, three people and three articles; zero published products. This record must not be read as a claim that the entire programme is complete.

## Property Collection release verification

- Next production build passed. All 187 Node tests passed, including collection filtering, bounded upload validation, map redirect rules and streaming CSV parsing.
- Eight transaction/rollback upload and access checks plus ten catalogue retry/permission checks passed on preview and production. No real storage file, email or payment created by these checks.
- Data-room broker v2 deployed to both projects. Existing private storage and authenticated permission checks retained.
- Browser: homepage showcase, unnumbered practices, collection city + text filters, URL reload persistence, property details and photograph dialog checked. Responsive layout inspected at 681 and 340 CSS pixels using browser zoom. Fixed footer legal-link overflow; document width 337 at viewport 340. This is not a full physical-device audit.
- Production security advisor: no warning/error findings; existing deny-by-default private-table INFO notices only.
- Historical property identity, photographs and current mandate status were not rewritten as new offers. No fabricated price, area, availability, imagery or HORECA inventory added.

Production release `41a98148b6d0ab3c297b325670752268a0d83e17` reached Vercel READY on 13 November 2026 and was verified at indiagully.com. Live collection filters, reload persistence, detail and photo-dialog behaviour passed. Supabase production sign-in, account confirmation and recovery templates were installed through the provider dashboard; recovery was reloaded to verify persistence. No OTP or password was read, and no recovery email was sent.
