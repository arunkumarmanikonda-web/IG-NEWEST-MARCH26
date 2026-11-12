# India Gully: operating platform implementation contract
Updated 11 November 2026. This extends the original master plan with the owner's subsequent requirements.

## Current status
See [launch-readiness.md](launch-readiness.md). The architecture and scope below are the original implementation contract, not a current provisioning status. Supabase, CMS, identity, private storage and operational engines have since been implemented.

## Fixed owner requirements
- Public enquiries and automatic acknowledgements: hello@indiagully.com.
- Official telephone: +91 89889 88988 (E.164 +918988988988).
- Every website enquiry creates separate internal notifications for akm@indiagully.com, pavan@indiagully.com and amit.jhingan@indiagully.com.
- Original India Gully logos retain their colours and proportions.
- Real estate, transactions, debt and special situations, hospitality design coordination / PMC, retail, entertainment and HORECA have distinct journeys.
- OpenAI-backed content and SEO assistance; Runway-supported creative production.
- Editable opportunity categories and tags, comprehensive user CRUD, individual Google Workspace mailboxes, NDA signing and personalised marketing.
- Operate automatically wherever the relevant authority, facts, permissions, limits and integrations have been established.

## Platform architecture
The implementation sequence remains provision first, integrate second. Planned services from the master plan:
Next.js on Vercel; GitHub source and CI; managed editorial CMS (Sanity was the discovery recommendation); transactional Postgres (Neon); managed identity; private file storage; Shopify for actual HORECA catalogue/cart/checkout/order state; Resend for transactional delivery; Fast2SMS after the relevant account and messaging configuration.
Discover current provider capabilities and provision real resources before installing SDKs or writing provider-bound models. Do not replace an unavailable service with a pretend catalogue, fake admin login, in-memory customer store or successful-send animation.
A Google Workspace connection and the Runway connector inside ChatGPT do not provision website OAuth clients or API credentials.

## 1. CMS and editorial workspace
Content types: practice pages, general pages, articles, property opportunities, product editorial overlays, project case studies, people, FAQs, menus, reusable blocks, media, taxonomy, policies, redirects and campaigns.
Required actions: create, edit, preview, compare versions, schedule, publish, archive, restore, duplicate and audited bulk import.
Fields: immutable ID; slug; lifecycle; author; owner; reviewer; publication schedule; locale; SEO metadata; canonical target; content version; evidence references; media rights; confidentiality classification.
Public content and confidential dossier records are separate. Public queries never select private fields.
Product inventory, checkout and commercial order state remain owned by the commerce provider; CMS copy must not overwrite authoritative SKU, price, tax or availability data.

### AI content assistance
1. Import approved documents or structured records into a private review queue.
2. Extract proposed facts with source-page references and confidence; mark missing information explicitly.
3. A responsible editor verifies the fact record.
4. OpenAI produces draft copy, headlines, summaries, SEO fields, FAQs, translations and campaign variants from approved facts.
5. Display source references and a version diff beside each suggestion.
6. Publish the exact approved revision, with a log of model, prompt version, editor, cost and approval.
7. Any subsequent change invalidates the prior revision approval.
Never invent RERA/approval status, title, tenure, CIRP status, prices, dimensions, returns, warranties or technical product specifications.
The current validation contract checks declared fact references, not semantic truth; editorial verification remains necessary.

### Creative production
Maintain distinct media roles: documentary photography; labelled concept creative; editorial illustration.
Runway tasks are asynchronous, with task IDs, progress, cancellation, retries, cost caps and private output ingestion.
Original property and product images remain the evidence-bearing images. Generated images cannot become documentary photography.
Use exact supplied logo files as deterministic overlays in approved templates, not model-redrawn logos.
Preserve original assets, record usage rights and generation provenance, and require visible disclosure for generated concepts.
Deliver website, dossier, email, social and advertising formats from approved reusable templates.

## 2. Opportunity taxonomy
Separate dimensions:
- Asset class: land, office, retail, industrial/logistics, hotel, resort, residential, mixed-use, operating business and other approved classes.
- Transaction type: acquisition/sale, lease, management agreement, JV/JDA, growth capital, debt/refinancing and strategic partnership.
- Opportunity context: strategic investment, CIRP, distressed asset, special situation, turnaround, income-producing asset, development, growth capital, refinancing and JV/JDA.
- Location, sector and lifecycle.
Terms are records with immutable IDs, editable labels/slugs, descriptions, ordering, aliases, parent relationships, active/retired state and evidence requirements.
Administrators may create, rename, reorder, merge, retire and delete terms. Show impacted listings before mutations. Referenced terms must be reassigned or retired before deletion. Merge within the same taxonomy dimension in one database transaction, invalidate caches and retain an audit record.
A renamed label must not silently break old URLs. Use aliases/redirects.
CIRP, distress and regulatory status require source evidence, an as-of date and reviewer approval. Do not infer these classifications from price or age of a listing.
The current four migrated assets are portfolio references, not verified current offers. No unsupported CIRP or distress label has been assigned.

## 3. Identity, registration and user CRUD
Roles: owner, administrator, publisher, editor, property manager, procurement manager, marketing manager, sales, auditor, client and vendor. Support scoped assignments rather than one unrestricted admin flag.
User lifecycle: invitation/pending verification, active, suspended, closure requested, anonymised/deleted subject to retention.
Administrative actions: invite/create, search, filter, view, edit profile, assign approved roles, manage practice/organisation access, suspend/reactivate, revoke sessions, disconnect mailboxes, export permitted records and process closure.
Prevent self-escalation and removal of the last active owner. Recheck privileges on every server request. Role changes and owner-count checks must be transactional.
Staff MFA, secure session cookies, CSRF/origin controls, rate limits, recovery procedures and session expiry are launch requirements.
Registration must present current Terms, Privacy Notice and Data Usage Policy, with explicit acceptance and durable evidence: user ID, document versions/hashes, timestamp and capture context.
Marketing, behavioural personalisation, remarketing and each communication channel are separate optional choices. Registration or an NDA is not marketing consent.
Keep consent history append-only; changes create new events. Withdrawal must suppress queued campaigns, not merely future segmentation.

## 4. NDA and controlled dossier access
Visitor journey: public teaser → register and verify email → accept current policies → complete required investor/organisation fields → review the asset-specific NDA → sign through the selected provider → verified completion → permitted dossier access.
Use a legally reviewed NDA template and an appropriate signature provider. A typed name or browser success screen alone is not verified signing.
Bind each envelope to the signer, organisation/authority where applicable, asset or mandate scope, template version/hash and expiry.
Only a verified, replay-protected provider event can complete the signature record. Download and verify the signed document and completion evidence into private storage.
Access requires active account, current policy acceptance, explicit asset/document grant, a matching completed NDA where required, and no expiry or revocation.
Check access on each request and again when generating a download link. Never expose storage object URLs in public CMS responses, search indexes or analytics events.
Use short-lived download grants, private/no-store responses, watermarking and access logs. Revocation prevents new access immediately; already downloaded copies cannot be recalled.
A changed NDA template or expanded disclosure scope can require a new signature.
All access-denied states must be tested, including cross-user, cross-asset, stale policy, expired NDA, revoked grant, suspended account and direct object URL requests.

## 5. Enquiries and the mail engine
Persist the enquiry and delivery outbox atomically before returning a receipt.
One enquiry ID creates three separate internal jobs plus one acknowledgement job. Independent recipient state allows retrying one failure without re-sending to everyone.
The existing delivery planner fixes the sender and three destinations and emits stable idempotency keys plus a payload digest.
Store idempotency and payload digests durably; reject reuse of an ID for changed content. Provider idempotency alone does not replace application deduplication.
Internal notification Reply-To points to the validated requester. The acknowledgement Reply-To is hello@indiagully.com.
Use a fixed acknowledgement without untrusted HTML. Mark quoted enquiry text as untrusted when an AI assistant reads it.
Record accepted, queued, provider accepted, delivered, bounced, complained, failed and suppressed states. Provider acceptance is not delivery.
Verify webhook signatures and deduplicate events. Retry transient errors with bounded backoff; route permanent failures to a visible failure queue and alert the owner.
Do not transmit confidential attachments in the three notification emails. Send authenticated application links.
The current public contact form is explicitly mailto-only until the real endpoint is activated.

### Google Workspace per user
Use per-user OAuth with the least scopes needed for the selected feature. Read, draft and send permissions are distinct. A global administrator does not automatically receive every mailbox.
Encrypt refresh tokens with managed keys; keep tokens server-side; support revocation, expiry and re-authorisation. Disconnecting a user prevents further sync and sends.
Implement incremental sync, verified push notification handling and watch renewal according to current Gmail documentation.
Preserve Message-ID, thread IDs and References/In-Reply-To so replies stay in the correct conversation.
Shared hello inbox access requires an explicit mailbox grant or an agreed Workspace routing arrangement.
Keep existing Google Workspace MX records. Do not repoint the root domain to Resend receiving and accidentally displace business email.
Resend sender-domain verification, DNS authentication and Google OAuth consent/scope approval are activation requirements.

## 6. Personalised updates, dossiers and remarketing
Admin selects the practice, content or opportunity, audience rules, cadence, channel and automation mode.
Segment by explicit preferences first. Use browsing or enquiry signals for personalisation only where that purpose has been consented to; record event provenance and allow preference correction.
Before each send, recheck active/verified status, practice preference, channel consent, suppression lists, campaign revision approval, frequency limits and document access.
Generate a personalised introduction from approved facts. Do not expose private CRM notes, inferred financial capacity or sensitive personal attributes.
Send restricted dossiers as authenticated links only, never as unattended marketing attachments. Re-evaluate the NDA and grant when the recipient opens the link.
Support immediate unsubscribe and preference centre updates, complaint/bounce suppression, quiet periods, deduplication and dry-run audience previews.
Existing users must not be silently marked subscribed. Import consent evidence or exclude them from marketing until a valid preference is obtained.
Transactional acknowledgements and requested document delivery are tracked separately from promotional communications.
Google/Meta remarketing audiences require separate configured consent, account permissions, retention and suppression handling; no pixels are included in the current build.

## 7. SEO, SEM and autonomous operations
SEO workspace: page titles/descriptions, canonical URLs, structured data from verified fields, internal links, image alternatives, sitemap, redirects, broken links, indexability, crawl diagnostics and freshness queues.
Connect Search Console and analytics using authorised accounts; track qualified enquiries and approved business outcomes, not traffic alone.
AI may audit, propose briefs, create drafts, identify stale information and prepare reports automatically.
Scheduling approved revisions can be autonomous. New factual claims or altered commercial information require verification.
SEM workspace: campaign/landing-page drafts, approved keywords and exclusions, ad variants, audience rules, conversion diagnostics, experiments and reporting.
Live ad changes require configured accounts, approved campaigns, daily/total caps, spend reservations and conversion validation. Use provider-side limits too; local checks alone cannot guarantee a spend ceiling.
Maintenance: dependency/security scans, issue reproduction, isolated branches, tests, preview verification, reviewed release and rollback readiness. Never execute arbitrary generated code in production.
Offer global and per-practice pause controls, job history, failure queue, budget visibility and owner alerts.
No autonomous ad spend, content publishing or code deployment is currently active.

## 8. Data protection and operational acceptance
Private storage and database access must be server-authorised. Separate environments and service accounts; minimise production access; redact secrets and personal data from logs.
Implement row/object-level access tests, upload type/size controls, malware quarantine, signed webhooks, replay protection, request limits and secret rotation.
Create a retention matrix for enquiries, users, consent events, signature evidence, private documents, marketing events and technical logs. Define deletion/export workflows and lawful retention exceptions with counsel.
Backups must be encrypted and restoration-tested. Establish and test recovery time and recovery point targets before claiming operational readiness.
Require incident ownership, audit monitoring, dependency review and an independent security assessment before opening confidential data rooms.
No 'platinum', compliance certification or breach-proof claim should appear without evidence.

## 9. Activation sequence and definition of done
1. Reactivate the owner-controlled Vercel team and create/link the rebuild project.
2. Provision real CMS, database, identity, private storage and commerce services; verify environment bindings.
3. Implement server persistence, schema migrations, row/object permissions and the private admin workspace against those services.
4. Connect Resend and Google Workspace, verify hello sender and all three enquiry routes, then activate acknowledgement and retry workflows.
5. Connect the signature provider with reviewed NDA/policy versions; test restricted access and revocation.
6. Connect OpenAI/Runway, establish approved model choices, quotas, content provenance and creative review.
7. Import verified current opportunities/products and authorised existing users/consent histories.
8. Activate marketing and SEO accounts, then approved scheduled content and eligible-user updates. Activate SEM only after budgets and conversion checks.
9. Complete mobile/accessibility/browser testing, provider end-to-end tests, backup restoration and security review.
10. Approve production content and domain migration, remove preview noindex only at release, retain rollback and monitor the launch.
A capability is complete only when the browser action, server authorization, durable data change and external result have all been verified.

## Official implementation references
- Gmail scopes: https://developers.google.com/workspace/gmail/api/auth/scopes
- Gmail push sync: https://developers.google.com/workspace/gmail/api/guides/push
- Resend idempotency: https://resend.com/changelog/idempotency-keys
- Resend thread identifiers: https://resend.com/changelog/message-id-for-sent-emails
- Runway API: https://docs.dev.runwayml.com/api/
Re-check current provider documentation and applicable legal requirements when provisioning. This implementation contract is not a legal opinion.
