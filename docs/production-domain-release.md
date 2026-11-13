# India Gully public launch

Verified 13 November 2026 (India Standard Time). The website is publicly available at https://indiagully.com/ on Vercel. The www domain redirects to the apex. This public website launch is distinct from the outstanding transaction and recovery acceptance listed below.

## Git and production deployment

PR #3 merged at 05:25:55 UTC (10:55:55 IST), merge commit `325b27e77748d05b4ef149d11b9ef6be7101684b`. Its tree matched the tested branch head. GitHub automatically triggered a READY Production deployment from `main`; the successful branch quality run was 43319555613.

After the DNS change, production configuration was redeployed from documentation commit `394f23b19cb24fafe640310dfbc08b51ac5edab4` as READY deployment `dpl_CaA6WKWbvER8H7LsJDqGqU6U2Enf`. All expected aliases were assigned with no alias error. Subsequent main-branch pushes use the same automatic Git deployment connection.

Production uses isolated Mumbai Supabase project `szmsvxbqtakzbfpvgeth`, with 43 migrations and three runtime Edge Functions. Both Supabase projects have the saved GitHub association. Automatic database deployment and paid PR branching remain off. The protected Vercel alias and the approved private webhook relay remain available; public-domain activation did not remove staff authentication or MFA.

## DNS cutover and rollback reference

The owner supplied the Cloudflare export dated 13 November 2026 06:02:16 UTC. Both existing website records were CNAMEs to `india-gully.pages.dev`, with Cloudflare proxying enabled. The owner edited those two records in their working browser after this cloud browser's sign-in failed. No account credential was shared with the agent.

| Type | Name | Current target | Proxy | TTL |
|---|---|---|---|---|
| CNAME | @ / indiagully.com | 2d8d37c55eee69b4.vercel-dns-016.com. | DNS only | Auto |
| CNAME | www | 2d8d37c55eee69b4.vercel-dns-016.com. | DNS only | Auto |

Vercel reports `misconfigured=false` and no conflicts for both domains. Cloudflare flattens the apex CNAME; the observed IPv4 answers are `216.150.1.193` and `216.150.16.193`. The www CNAME resolves to the exact Vercel project target. Vercel's saved www redirect is HTTP 308 to https://indiagully.com.

Nameservers remain `jimmy.ns.cloudflare.com` and `penny.ns.cloudflare.com`. A fresh Google Public DNS lookup confirmed these nameservers and all five Google Workspace MX records at their original priorities. The instructions changed no MX, TXT, DKIM, DMARC, sender-domain or unrelated service record. The original Cloudflare Pages website was not deleted; if rollback is required, the two original CNAME targets and proxy states above are the reference, subject to checking the old site's availability first.

## Public URLs and authentication

Vercel Production now sets `NEXT_PUBLIC_SITE_URL=https://indiagully.com` and `SEARCH_INDEXING_ENABLED=true`. These settings apply only to Production. The application additionally requires the production environment and an approved India Gully hostname before allowing indexing. Marketing delivery remains independently disabled.

Supabase Auth Site URL is https://indiagully.com. The exact allowed redirect URLs are:

- https://indiagully.com/auth/callback
- https://india-gully.vercel.app/auth/callback

The saved settings were reloaded and verified in the production dashboard. No wildcard redirect, preview database connection, account-role change or MFA change was introduced.

## Live acceptance

- The homepage rendered over HTTPS at https://indiagully.com/ without a certificate warning or Vercel sign-in wall. Its original logo and corporate white/charcoal layout were visually checked; no broken images were reported by the DOM check.
- Opening https://www.indiagully.com reached the apex homepage.
- An anonymous visit to `/admin` reached `/login`; the email-code and password options were visible. A new authenticated staff session on the custom domain has not yet been exercised.
- The HORECA storefront and quotation basket rendered, and adding a custom requirement created the expected row. No quotation or order was submitted.
- Homepage canonical is https://indiagully.com and robots metadata is `index, follow`.
- `/robots.txt` allows public pages while disallowing admin, account, API, data-room and auth paths. `/sitemap.xml` lists the live domain and published records.
- Browser evidence: `assets/live-website-2026-11-13.jpg`.

The executor's direct HTTP transport returned an upstream connection error, and the web lookup service still returned an older cached homepage. Those results are not treated as current application responses. Fresh browser rendering and Vercel's DNS/deployment state are the launch evidence. Search-index refresh is not claimed.

## Malformed URL handling

The post-launch runtime log check found server errors only on malformed paths ending in encoded backslashes, such as `/insights%5C`. The targeted Proxy matcher now intercepts encoded-backslash paths and returns a non-cacheable 404 before the page launcher or authentication client runs. Normal public paths still bypass the authentication proxy; existing private-route matchers are unchanged. No valid page URL is rewritten.

Validation: 150 Node tests and the production-configured Next.js build pass, including matcher and response tests for malformed URLs, public-route exclusion and retained private-route matching. The Git-triggered deployment is checked separately after publication. Do not describe the earlier runtime log window as error-free.

## Remaining acceptance

The owner's recovery email was delivered at 05:11:49 UTC and its code accepted at 05:23:37 UTC, reaching `/account/security`. New-password submission during that recovery session remains unverified. Existing verified MFA is intact. Pavan and Amit's administrator invitations await their verified onboarding.

Razorpay is configured in live mode and signed receiver diagnostics pass. No real charge/refund or Razorpay-originated live event has been exercised. A completed physical database backup is available, but restoration has not been exercised and Storage object bytes require separate recovery coverage. Four opportunity drafts remain unpublished pending current availability/mandate confirmation. The HORECA production catalogue has no published product records yet; a real brand catalogue can be imported through the implemented admin workflow. Google mailbox OAuth remains disabled pending its own credentials. These limits are not represented as completed acceptance.
