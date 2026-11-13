# Production transactional email

Verified 13 November 2026 (India Standard Time).

- Provider: Resend; verified sender domain indiagully.com.
- Sender: India Gully <hello@indiagully.com>; replies: hello@indiagully.com.
- Normal enquiry recipients: akm@indiagully.com, pavan@indiagully.com and amit.jhingan@indiagully.com, plus the customer acknowledgement.
- Production receiver: https://szmsvxbqtakzbfpvgeth.supabase.co/functions/v1/ig-provider-webhook/resend
- Resend webhook: 6abf8bc5-3619-4261-a737-a7f58c69466f, enabled. Events: email.delivered, email.bounced, email.complained, email.suppressed and email.failed.
- API key and signing secret were entered privately by the owner and are encrypted in production integration settings. Their contents were not read or displayed.
- Production Resend is enabled at configuration revision 5; domain verification is recorded. The existing preview webhook remains separate.

## Actual production delivery

A single labelled system-test notification was addressed only to the owner at akm@indiagully.com. The test record was created closed and does not represent a customer enquiry. No test message was sent to Pavan or Amit.

- Enquiry evidence: 0a015525-3472-410a-9a87-7ec3e8b96829.
- Outbox evidence: 9912166a-51c2-422f-9a58-910404f8ca54.
- Resend email: 01a1d1c5-3741-76bd-bd90-9a135d20c983.
- Signed delivery event: msg_3M1arojPlXF5VfagXzYZTVS2muV.
- Delivery: 13 November 2026, 03:28:48 IST (provider event timestamp 2026-11-12T21:58:48.592Z).

Resend reported email.delivered and the production webhook returned HTTP 200 Accepted on its first attempt. The application verified the signature and processed the delivery event. The database independently shows delivered, attempts 1, last_error null, and processed delivery evidence. The normal owner dashboard queue action dispatched the message. The labelled closed test record and delivery evidence are retained privately for audit.

No transactional messages remain pending. Marketing remains disabled in Vercel and the database, and campaign deliveries remain zero. Razorpay remains live at revision 4, with zero payment requests and no real charge. At this email checkpoint OpenAI and Runway were disabled; they were subsequently enabled and verified in `production-ai-release.md`. No code or schema changed during this email activation; the validated application remains commit 22ebe8d, with all 147 tests and the production build passing.
