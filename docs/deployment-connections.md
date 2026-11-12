# India Gully deployment connections

## Verified targets

- Source: `arunkumarmanikonda-web/IG-NEWEST-MARCH26` on GitHub.
- Change branch: `backend/2026-11`; PR #3 targets `main`.
- Vercel: `india-gully` in `akms-projects-1230b0a9`.
- Preview Supabase: `india-gully-preview`, project `wktdgczjdocsnfgvcsat`, Mumbai.
- Production Supabase: `india-gully-production`, `szmsvxbqtakzbfpvgeth`, Mumbai (`ap-south-1`), in India Gully Pro (`phcobqderzqawddtptqi`).
- The other Supabase project `xjqehwvxscoktfecbwse` is not the India Gully backend.

GitHub pushes already trigger Vercel preview builds. Commit `f74b926` reached READY and GitHub's Rebuild quality check passed. Preview/Development have the Supabase public URL/key and server-side integration configuration. Production now has the Mumbai database URL/publishable key and distinct sensitive master, room broker, enquiry ingest and email-worker secrets, alongside the separately saved live Razorpay pair. No provider has been activated in the production database. PR #3 remains unmerged.

## Supabase Git deployment preparation

On 12 November, all 41 hosted migration names were matched to repository files. The 33 filenames whose timestamp differed were aligned to the actual hosted ledger. SQL content is unchanged: 37 files match the database's stored SQL digest exactly, three differ only in surrounding whitespace, and the creative storage grant differs only in comments/formatting. No migration was rerun and no migration-history row or application data was changed.

`supabase/config.toml` identifies the three runtime Edge Functions with their existing per-handler authentication model. Automatic seeding is off. The retired one-time staff provisioning function is intentionally not added to the deployment manifest.

The native Supabase GitHub integration is connected to `arunkumarmanikonda-web/IG-NEWEST-MARCH26`, with working directory `.`. The owner completed GitHub installation for this repository, and Supabase confirmed the saved connection. Automatic database deployment and automatic PR branching are off. Automatic approval review rejected enabling the form's production-deployment option against the preview branch, so the connection was saved without deployment enabled. No Git-triggered database deployment is claimed.

Association alone is not proof of an applied deployment. Verify an actual deployment/check result before describing GitHub-to-Supabase deployment as active. Avoid duplicate migration runners: use the native integration or one CI runner, not both.

For the existing test database, any enabled branch must be `backend/2026-11` while production is being prepared. The dedicated production project's branch must be `main`. Leave automatic PR database branching off unless its separate hourly cost is explicitly approved. GitHub integration itself works on the Free plan.

## Production installation: 12 November 2026 UTC

The owner explicitly approved deleting the empty Oregon project and replacing it with a Mumbai Micro project. Oregon `ngnvkdwejdurasrxxfks` was deleted and the healthy replacement `szmsvxbqtakzbfpvgeth` was created in the existing India Gully Pro organisation. No new organisation or second active Micro project was added.

Forty migrations are installed. `consent_campaign_delivery` and `campaign_scheduler_guard` are deliberately NOT applied in production: automatic approval review rejected installing the bulk campaign capability. They remain in the repository and preview history, so do not run an unrestricted `db push` or enable automatic database deployment until this is resolved. No ledger entries were fabricated for the two omitted migrations. Production campaign UI and RPC dispatch fail closed unless `CAMPAIGNS_INSTALLED=true`; `MARKETING_ENABLED=false` is set independently.

Four historical files now use safer fresh-install defaults: editorial migration no longer creates named administrator invitations; practice permissions no longer grant named staff all-practice rights; governance stores the initial policy as an unpublished, unreviewed draft and hides it from public reads; the initial scheduler uses a configured environment origin instead of the preview hostname. These changes were required after automatic approval review rejected the original side effects. Existing preview roles and policy records were not changed. Do not describe those four historical SQL files as byte-identical across environments.

The new `environment_worker_origin` migration is applied to both projects. Each relay has its own Supabase origin. The production relay remains disabled. Recovery covers transactional email and explicitly requested provider jobs; marketing scheduling requires a separately approved release. All 40 production migration SQL digests matched repository files before their tool-generated version timestamps were reconciled to canonical source timestamps in a guarded transaction. No application records were removed.

All three Edge Functions are deployed: `ig-room-broker`, `ig-creative-media`, `ig-provider-webhook`. They retain per-handler authentication. Existing private source/catalogue buckets are private; room and creative buckets are created privately on first authorised use. Vercel Production received its own public URL/key and four sensitive server secrets; Preview/Development values were not copied or changed. Only hashes of master/broker/ingest credentials are stored in application configuration. Production has no Auth users, no customer/test enquiries or outbox entries, no enabled providers and no current legal release. Pavan's requested grievance contact is saved; statutory confirmation remains false.

The production project's native GitHub integration is connected to the same repository, working directory `.`. Automatic production database deployment and paid PR branching are OFF. GitHub-to-Vercel preview builds remain active. A saved GitHub association is not automatic schema deployment.

Validation: 137 Node tests and the Next.js build passed. The new rollback-only scheduler suite verified missing/disabled origin, disabled provider, destination selection, signed requests and restricted execution; queued HTTP was rolled back before dispatch. The existing 12 delivery/permission assertions passed in production. The final check found zero test enquiries, outbox rows or HTTP queue entries, all public application tables protected by RLS, and three latest cron runs successful. Supabase security advisories reported only informational notices for deliberately inaccessible private tables, no warnings/errors.

## Remaining release steps

Complete production SMTP, Auth URL/security settings, owner onboarding and recovery; confirm the current legal/statutory release; decide explicitly on Pavan/Amit staff roles and the optional campaign module; finish production provider credentials/webhooks and acceptance, content release and a restore drill. The owner invitation for akm@indiagully.com is installed, but no sign-in or mail was triggered. Pavan/Amit administrator invitations were not created in production.

Protected Vercel Production build `dpl_EXiwXLycZQzCP61Js8sG4n9hUgSa` from `c9fa4a3` is READY at `https://india-gully-bl7nvpm6v-akms-projects-1230b0a9.vercel.app` and `https://india-gully.vercel.app`. Vercel Authentication remains enabled. No indiagully.com domain is attached. Complete browser/API acceptance before merge/domain cutover. Keep the existing live domain on its current host while these checks remain open. Razorpay collection stays disabled until credential import, webhook setup and merchant/company/legal checks pass. Saving live keys does not activate payments. Google mailbox OAuth remains a separate disabled integration.

The confirmation, magic-link/OTP and recovery templates are saved in production. They now use neutral white/charcoal styling, the original logo image and single-use email codes. Production SMTP credentials and its first owner login are still required. `production-approval.md` contains the exact database policy draft (JSON equality verified), proposed staff access and the optional marketing-module decision.

Production acceptance exposed an anonymous admin crash: the layout required a current policy before checking the session, and the dashboard assumed a non-null profile. The follow-up explicitly redirects anonymous visitors before accessing profile data, presents an unavailable state when no policy is published, and blocks registration/OTP creation without a current policy. No draft was published and no consent gate was weakened.

Final acceptance checkpoint: commit `9c0c295` is READY in Vercel Production as `dpl_CSHtyTqbuNR4rVkXzEt4kArcqbk7`, URL `https://india-gully-o846a0enp-akms-projects-1230b0a9.vercel.app`, with stable protected alias `https://india-gully.vercel.app`. Live fetches of `/admin`, `/admin/settings` and `/account` reached the login page; `/register` and `/privacy` showed the pending-policy notice; `/` returned HTTP 200. No runtime errors were returned for this deployment during verification. Production Auth Site URL is the stable protected alias and its sole allowed callback is `/auth/callback`. All 137 tests and the build pass after the fix. SMTP credential entry, legal review and first owner sign-in remain outstanding.

SMTP follow-up: the owner replaced the initially incorrect credential and confirmed saving the Resend API key. A dashboard reload verified custom SMTP remains enabled, the configured sender/host/port persist, the password is stored and hidden, and Save changes is disabled. Credential contents were not read. Delivery is not yet verified because production owner registration still awaits the policy release. The registered-office address was recovered from the owner’s explicit 11 November confirmation and saved to production: QTR NO. 229, Four Storey, Tagore Garden Extn., New Delhi, Delhi, 110027, India. No legal-release or statutory-confirmation flag, staff grant, campaign switch or payment mode was changed.

## Owner-approved production release, 12 November 2026

This section supersedes the earlier withheld-approval state. The owner explicitly approved all three prepared decisions: publish policy 2026-11-11.2 and confirm company details; provision Pavan/Amit administrator invitations with all six capabilities across all eight practices; and install the consent-only campaign module with sending disabled. The approval and exact policy hash are recorded in `ig_audit`. Production has all 43 migrations. Newly installed migration history entries were reconciled to canonical repository timestamps only after exact SQL MD5 equality checks. The new `campaign_delivery_release_guard` is applied in both environments, preserves the origin/relay/provider gates and blocks campaign activation, recipient leasing and payload release unless a separate database switch is explicitly enabled. That switch is false in both environments. Production Vercel flags are `CAMPAIGNS_INSTALLED=true` and `MARKETING_ENABLED=false`. No invitation email or campaign was sent. Owner sign-up, SMTP delivery/recovery, provider acceptance, content release, restore and domain cutover remain open.

## Owner activation and payment staging

The production owner akm@indiagully.com completed email verification, current-policy acceptance, initial password change and authenticator MFA, then accepted the owner invitation. The staff dashboard is accessible. Razorpay live keys were imported through the authenticated owner UI, producing disabled configuration revision 2 with the key secret encrypted. No secret was displayed or copied into source. The webhook signing secret is not yet supplied. The first relay attempt was blocked before any database change, and its unused bypass was revoked. The owner subsequently gave specific approval; see the release below.

Production commit c23ea8e is READY as `dpl_8VptWtFtRP95u3vvf8cX8x6JBvvU`. All 140 Node tests and the local Next.js build pass. The owner-only read-only Razorpay connection check succeeded in the production browser. The merchant dashboard shows indiagully.com approved and the matching live key ID. The live webhook draft is prepared but unsaved; no signing secret has been entered.

## Approved relay release, 13 November 2026 IST

The owner explicitly approved the production relay. Its dedicated Vercel bypass is stored in production Supabase Vault, and the fixed production relay is enabled. A signed worker request returned HTTP 200 `Accepted` through the protected Vercel destination; invalid signatures returned 401 and an unsupported path returned 404. The configuration RPC remains inaccessible to anonymous and ordinary authenticated users. External providers and campaign delivery remain disabled, and all delivery queues are empty. See `production-webhook-release.md` for the exact endpoints and rollback. Razorpay signing-secret entry, webhook creation and provider acceptance remain open. PR #3 is unmerged and indiagully.com has not been cut over.

## Webhook setup, 13 November 2026 IST

The owner created live webhook TzPZipJrb9jdqU, enabled with payment.captured/payment.failed/refund.processed/refund.failed and the approved production receiver. Razorpay confirms a signing secret was supplied. India Gully then saved that secret privately and reports disabled configuration revision 3. The receiver now rejects unauthenticated unsupported events, acknowledges authenticated unrelated merchant events, and preserves retries for operational failures. An owner-only non-payment diagnostic exercises valid and altered signatures through the relay. All 147 Node tests and the Next.js build pass. Provider-originated delivery and live transaction acceptance remain open.
