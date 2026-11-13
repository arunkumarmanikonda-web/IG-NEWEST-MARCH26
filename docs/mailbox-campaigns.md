# Staff mailboxes and permission-based campaigns
Updated 12 November 2026.

## Personal Google Workspace mailbox
`/admin/mailbox` provides per-user OAuth, inbox search, text thread previews, encrypted saved drafts, explicit send and disconnect. The connected Gmail address must equal the verified India Gully staff account. Every request rechecks active staff identity, current policy acceptance and MFA. No owner-wide mailbox access is implied.

OAuth uses a ten-minute, single-use state, an encrypted HTTP-only callback cookie and PKCE. Access/refresh tokens and drafts are encrypted with user-bound AES-GCM additional data. Tokens never reach browser JavaScript. Draft sends bind the exact content hash and revision; ambiguous sends remain locked against automatic retries. Remote HTML and images are not rendered, and mailbox contents are not sent to AI.

Required website environment configuration: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI` (the exact HTTPS origin followed by `/api/mailbox/callback`), and `GOOGLE_MAIL_ENABLED=true`. Enable Gmail API in the company's Google Cloud project and configure the OAuth consent audience appropriately. Scopes are Gmail readonly and send. Each staff member authorises their own account. The ChatGPT Gmail connection is unrelated. Attachments/rich HTML remain in Gmail. Real Google authorisation, renewal and sends still need provider acceptance after credentials are supplied.

Fifteen rollback-only hosted checks passed for server-secret enforcement, single-use/expired state, same-email binding, own-user isolation, exact-draft sending, duplicate/uncertain delivery locks, MFA, role revocation and disconnect. No email was sent.

## Marketing campaigns
`/admin/campaigns` provides draft preparation, scoped practice audiences, owner approval of an exact revision/count, pause/resume and delivery reports. Released copy is immutable. Eligible recipients must have verified active accounts and the latest affirmative email-marketing consent for that practice. Bounces/complaints and withdrawal suppress delivery. Queue claims recheck consent and apply a maximum two messages per seven days with a 24-hour interval. One release supports up to 500 contacts; larger audiences require an explicitly designed rollout.

The worker freezes message bytes, uses stable Resend idempotency keys, five-minute leases and a 23-hour retry boundary. Signed webhook events reconcile early delivery and terminal suppression. Emails contain a visible withdrawal link and RFC 8058 headers; GET does not unsubscribe, signed POST records withdrawal. No tracking pixels or Ads tags are installed.

Sending stays disabled unless `MARKETING_ENABLED=true`, the deployment is production at the confirmed India Gully domain and statutory company details are confirmed. Existing Resend configuration is reused. No campaign was activated or sent during implementation. Google Ads/SEM stays as paused strategy drafts until a real Ads account, budget and conversion implementation are authorised.

References: https://developers.google.com/identity/protocols/oauth2/web-server · https://developers.google.com/workspace/gmail/api/guides/sending · https://resend.com/pricing · https://www.rfc-editor.org/rfc/rfc8058.html
