# Production AI acceptance

Verified 13 November 2026 (India Standard Time), against production `szmsvxbqtakzbfpvgeth` and deployed application commit `22ebe8d`.

The owner entered both API keys privately. Keys remain encrypted in application settings and were not read or displayed. Read-only OpenAI model and Runway organization checks succeeded before each provider was enabled.

| Provider | Saved production setting | Limits |
|---|---|---|
| OpenAI | Enabled, revision 3; gpt-4.1-mini | 20 requests/day; 1,500 output tokens/request |
| Runway | Enabled, revision 3; gen4_image | 10 requests/day; 120 estimated credits/day; video disabled |

## Actual OpenAI draft

The owner/MFA-protected AI creation studio generated `INTERNAL TEST Plain White Ceramic Dinner Plate` from supplied generic product facts. Job: `fad87719-44bb-4395-914a-691d6c420419`.

The output preserved SKU QA-PROD-PLATE-001, 27 cm diameter, Crockery category, piece unit, MOQ 24, pack 12 and 14-day lead time. It identified missing brand/manufacturer, pricing, HSN/GST, inventory and certification information. The UI displayed DRAFT / NOT PUBLISHED. The result was not saved as a product or publicly released. Review questions included redundant generic questions; this test proves the workflow, not perfect editorial judgment.

## Actual Runway image and private import

The creative studio submitted one square generic white-plate concept, reserving five estimated credits. Application job: `71cfa206-9e4b-41d9-ad63-c631f62bf73a`. Provider task: `3f625d95-76ac-4801-9f74-783f1ea3a0cf`. Submitted 13 November 2026 03:39:58 IST.

The provider job reached ready; the recovery worker imported its image into private storage. The database and reloaded register confirmed ready, published=false and no error note. The image was visually inspected and left private. Its scalloped rim does not exactly match the prompt's circular-rim wording: generated imagery must be reviewed and cannot establish actual product geometry or specifications. No public media approval or product publication was performed. Five credits is the application estimate/reservation, not independent billing verification.

## Adjacent production checks

Secure password change and leaked-password blocking are enabled. The server requires at least twelve characters with uppercase, lowercase, digits and symbols, matching the existing password form. Settings were saved and reopened for verification. Current-password enforcement remains off because the UI uses recent-login/reauthentication-code verification. Recovery email delivery and code acceptance were subsequently verified on 13 November; the owner reached `/account/security`. The new-password submission during that recovery session remains unverified. See `production-domain-release.md`.

Security advisors returned no WARNING or ERROR. The only findings were 21 INFO notices for private tables with intentionally deny-all RLS. A completed physical database backup dated 12 November 2026 19:23:22 UTC is available; a restore exercise has not been performed. Storage object bytes require a separate recovery strategy.

No code or schema changed for AI activation or Auth settings. The existing 147 passing tests and production build remain the code validation. Resend is enabled, Razorpay is live, and SMS, video and campaign delivery remain disabled. No charge, refund, campaign or advertisement was initiated by these checks.
