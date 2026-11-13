# Production release and domain cutover

Verified 13 November 2026. This record distinguishes the completed Git deployment from the pending public-domain switch.

## Completed release

- PR #3 merged at 05:25:55 UTC (10:55:55 IST): `325b27e77748d05b4ef149d11b9ef6be7101684b`.
- The merged tree is `efe2a37aee973e99931cb33ca907bdafe5c76612`, matching tested branch head `07d7a23faf6cab4163a301faf03705c90319c381`.
- GitHub Rebuild quality run 43319555613 succeeded; the branch Vercel preview was READY. Existing local evidence is 147 passing Node tests and a successful Next.js build.
- GitHub automatically triggered Production deployment `dpl_4P8KkUnW9fGCU28ZyGLWjgex33QP` from `main`. Vercel reports READY, source git and target production, without an alias error.
- Protected production alias: https://india-gully.vercel.app. Vercel Authentication remains enabled for non-custom domains.
- Deployed `/about`, `/horeca` and `/privacy` returned HTTP 200 with expected content. Anonymous `/admin` reached sign-in. No error/fatal runtime logs were returned during the post-merge check.
- Production remains isolated on Mumbai Supabase `szmsvxbqtakzbfpvgeth`, with 43 migrations and three runtime Edge Functions. Both Supabase projects have the saved repository association; automatic database deployment and paid PR branching remain off.

## Domain state

`indiagully.com` and `www.indiagully.com` are attached to Vercel project `india-gully`, with ownership verified. The www domain is configured to redirect to https://indiagully.com using HTTP 308. This does not establish working DNS or public launch.

Cloudflare is authoritative: `penny.ns.cloudflare.com` and `jimmy.ns.cloudflare.com`. Current public IPv4 responses are Cloudflare proxy addresses `172.67.198.210` and `104.21.13.80`; these do not reveal the existing origin. Vercel reports both domains as misconfigured, service type external and no conflicting domain association.

Vercel's returned DNS recommendations, captured before any change:

| Record option | Rank | Recommended value |
|---|---|---|
| IPv4 | 1 | 216.150.1.1, 216.150.16.1 |
| IPv4 | 2 | 76.76.21.21 |
| CNAME | 1 | 2d8d37c55eee69b4.vercel-dns-016.com. |
| CNAME | 2 | cname.vercel-dns.com. |

These are provider recommendations, not applied records. Inspect the actual Cloudflare zone and record the existing website origin before choosing the final apex/www records. Preserve MX, SPF, DKIM, DMARC and unrelated service records; do not change nameservers or transfer the domain. Inspect existing proxy/Workers/redirect rules if they affect these hosts.

Cloudflare requires sign-in. The secure method selector returned Google as the chosen option, but automatic approval review rejected access to the Google authentication origin because it did not accept that selector result as sufficient user-authored authorization. The sign-in attempt stopped. No Cloudflare DNS mutation, nameserver change or email-record change occurred.

At cutover, update the production canonical site URL and Supabase Site URL to https://indiagully.com, add the exact approved authentication callback, and retain the necessary protected-alias callback. Enable production search indexing only after the public site is ready. Then verify DNS, TLS, apex/www redirect, public pages and authentication on the final domain. Do not describe the custom domain as live before these checks.

## Recovery and remaining acceptance

Resend showed the owner's recovery message delivered at 05:11:49 UTC. Auth recorded a successful owner login at 05:23:37 UTC, and the browser reached `/account/security`. No password update from that recovery session was observed; the user must privately complete new-password entry and submission. Existing verified MFA remains in place.

Razorpay is configured in live mode and signed receiver diagnostics pass. No real charge/refund or Razorpay-originated live event has been exercised. A completed physical database backup is available, but restoration has not been exercised and Storage object bytes require separate recovery coverage. Four opportunity drafts remain unpublished pending current availability/mandate confirmation. These are outstanding acceptance items, not failed build checks.
