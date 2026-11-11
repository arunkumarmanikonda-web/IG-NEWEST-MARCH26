# Provider studio and activation

Implemented 11 November 2026 on the preview branch. OpenAI, Runway and Fast2SMS remain disabled until the owner supplies website API credentials through `/admin/settings`. The ChatGPT Runway connection is separate from a Runway developer API key. No paid image/video generation or SMS transmission was performed during implementation.

## Available workflows

- **OpenAI:** approved public facts → source-linked editorial, SEO, keyword and ad-copy draft → explicit review → unpublished CMS draft. Existing daily request and token limits apply. No private room, mailbox or code access is granted to the model.
- **Runway:** approved public creative brief → request/credit reservation → one provider creation attempt → periodic task polling → import into private Supabase Storage → staff preview → explicit public-image approval. Images use `gen4_image` at supported 720p ratios. Videos use `gen4.5`, 2–10 seconds, and require the separate video setting. Default caps: ten requests and 120 estimated credits per India calendar day. Rates are estimates, not a guarantee of the provider invoice.
- **Fast2SMS:** owner selects one Indian recipient, records their service-communication permission reference and supplies variables matching the approved DLT template. The queue sends the DLT Manager **Message ID**, which is distinct from the long registered DLT template ID. Default cap: twenty requests/day and five minutes between messages to one number. Provider acceptance is recorded separately from handset delivery. Promotional campaigns, automated room-event SMS and SMS login OTP are not enabled by this implementation.
- **Connection checks:** saved server-side credentials can be checked while disabled. OpenAI checks configured model access, Runway checks organization access, and Fast2SMS checks wallet authorization. These checks do not generate or send anything and do not prove live workflow completion, adequate billing balance, or DLT approval.

## Reliability and access

The existing signed two-minute Supabase recovery schedule now also processes provider jobs. Browser refresh is for visibility only; generation does not depend on leaving a tab open. A unique actor/request ID prevents duplicate queued work. A database lease permits one submission. An interrupted or ambiguous provider creation is marked `unknown`; it is never automatically resubmitted at potential cost. Investigate the provider console before submitting a new request. Polling and media imports can be retried without creating another generation. Changes to provider settings block unsubmitted work; pending jobs require the original account/configuration to complete.

All jobs have RLS. Creative generation needs current policy acceptance, MFA and practice content rights. Staff see their own jobs; owners can see all within the governance rules. SMS is owner-only. Publication additionally needs practice publication rights. Media lives in the private `ig-creative-drafts` bucket. The Edge Function requires the server integration root, verified against its hash in Postgres, even though gateway JWT checking is off. It never accepts a caller-supplied media URL; it obtains the source from the server-written job, restricts HTTPS output hosts, rejects redirects, caps bytes and checks file signatures. Temporary provider URLs are not exposed to clients. Public image requests recheck release status, so withdrawal blocks future requests.

Generated imagery is illustrative. CMS content using `/images/generated/<uuid>.<ext>` must reference a released image and an alt description beginning `Illustrative AI-generated concept`. Public detail pages show a visible disclosure. No generated image should imply an actual asset photograph or specification.

## Secure activation

1. In `/admin/settings`, keep each provider disabled while entering its key. Save, then use **Check saved connection**. Credentials remain encrypted and are not redisplayed.
2. OpenAI needs a funded API project and a permitted model. Runway needs a funded developer account. Fast2SMS needs a key, approved entity/header/template, exact template text and the separate DLT Manager Message ID.
3. Enable one provider at a time. Verify a bounded editorial generation, image generation/storage/publication/withdrawal, and one explicitly chosen authorised service-SMS recipient. Check provider logs and billing. Verify SMS handset delivery through provider evidence; the UI currently reports only acceptance.
4. Repeat failure/recovery and permission tests with the activated account before declaring production readiness. Do not switch the live domain or enable live payments based solely on a connection check.

## Verification

- 103 Node tests passed, including controlled Runway/Fast2SMS responses, ambiguous-send handling, input validation and URL restrictions.
- Production build passed.
- Hosted rollback-only provider suite verifies disabled-provider enforcement, MFA, practice isolation, idempotency, request/credit reservation, leases, unknown submissions, private-by-default media, reviewed release, withdrawal and listing archive behavior.
- Hosted enquiry suite passed 12 assertions across real estate, HORECA, hospitality/PMC and general enquiries. Each queues three internal notices plus one acknowledgement; retrying does not duplicate messages. No test email was dispatched from this suite.
- Supabase security advisory: no ERROR; intentional deny-all private tables report informational notices. Compromised-password protection remains a launch blocker.
- Live OpenAI output, Runway generation/import and Fast2SMS delivery remain unverified because their website keys are not configured.

Official interfaces checked: [OpenAI API keys](https://developers.openai.com/api/docs/guides/api-keys), [Runway OpenAPI](https://docs.dev.runwayml.com/openapi.json), [Runway outputs](https://docs.dev.runwayml.com/assets/outputs/), [Runway pricing](https://docs.dev.runwayml.com/guides/pricing/), [Fast2SMS DLT](https://docs.fast2sms.com/reference/dlt-sms-single), [Fast2SMS authorization](https://docs.fast2sms.com/reference/authorization).
