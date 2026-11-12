# India Gully deployment connections

## Verified targets

- Source: `arunkumarmanikonda-web/IG-NEWEST-MARCH26` on GitHub.
- Change branch: `backend/2026-11`; PR #3 targets `main`.
- Vercel: `india-gully` in `akms-projects-1230b0a9`.
- Existing Supabase: `india-gully-preview`, project `wktdgczjdocsnfgvcsat`, Mumbai.
- The other Supabase project `xjqehwvxscoktfecbwse` is not the India Gully backend.

GitHub pushes already trigger Vercel preview builds. Commit `f74b926` reached READY and GitHub's Rebuild quality check passed. Preview/Development have the Supabase public URL/key and server-side integration configuration. Production currently has the separately saved live Razorpay pair but no configured production database. PR #3 remains unmerged.

## Supabase Git deployment preparation

On 12 November, all 41 hosted migration names were matched to repository files. The 33 filenames whose timestamp differed were aligned to the actual hosted ledger. SQL content is unchanged: 37 files match the database's stored SQL digest exactly, three differ only in surrounding whitespace, and the creative storage grant differs only in comments/formatting. No migration was rerun and no migration-history row or application data was changed.

`supabase/config.toml` identifies the three runtime Edge Functions with their existing per-handler authentication model. Automatic seeding is off. The retired one-time staff provisioning function is intentionally not added to the deployment manifest.

The native Supabase GitHub integration is connected to `arunkumarmanikonda-web/IG-NEWEST-MARCH26`, with working directory `.`. The owner completed GitHub installation for this repository, and Supabase confirmed the saved connection. Automatic database deployment and automatic PR branching are off. Automatic approval review rejected enabling the form's production-deployment option against the preview branch, so the connection was saved without deployment enabled. No Git-triggered database deployment is claimed.

Association alone is not proof of an applied deployment. Verify an actual deployment/check result before describing GitHub-to-Supabase deployment as active. Avoid duplicate migration runners: use the native integration or one CI runner, not both.

For the existing test database, any enabled branch must be `backend/2026-11` while production is being prepared. The dedicated production project's branch must be `main`. Leave automatic PR database branching off unless its separate hourly cost is explicitly approved. GitHub integration itself works on the Free plan.

## Remaining release steps

Complete the approved dedicated Pro organisation's CAPTCHA and billing activation, create the production project in Mumbai, deploy the checked schema/functions, and configure private storage, email authentication, owner access and distinct server secrets. Stage a production Vercel deployment against that project, validate the complete application flow, then merge/release the checked commit and connect the live domain. Production secrets must never be copied into Preview or Development.

Razorpay collection stays disabled until production credential import, webhook setup and the existing merchant/company/legal checks pass. Saving the live keys does not activate payments.
