# Client relationships, engagements and shared report rooms

Updated 12 November 2026 (India Standard Time).

## One room, multiple independent logins

A client organisation can have up to 50 active named email contacts. Create the client once in **Clients & engagements**, add each contact, and open an engagement for feasibility, valuation, forensic audit, operational audit, financial review, due diligence or another assignment. The room is private and does not create a public opportunity listing.

In **Manage reports & access**, select all eligible contacts or an individual subset and share once. Ten selected email addresses create ten independent grants to the same room. Uploading a report once makes that report available to each currently authorised contact. Each person authenticates using their own email and password or emailed one-time code; no shared account or shared passcode is created. The dashboard checks the current verified email against the contact record.

Bulk sharing leaves existing grants unchanged. Administrators can subsequently change or revoke one contact's grant without affecting others. An authorised email cannot be reassigned to another person; disable the old contact and create a new contact instead. Adding a contact does not grant room access by itself. Newly added contacts require a deliberate share action.

## Access and confidentiality

Only a practice-authorised administrator may create an engagement room, attest to executed engagement/confidentiality terms, grant or revoke access, manage files or change download rules. Sales users can maintain clients within their assigned practices; once a contact has a room grant, only the practice administrator can modify it. An archived client can only be reactivated by an administrator.

An engagement requires an executed-agreement reference and administrator confirmation before client access is effective. This records the administrator's verification; it does not execute a contract for the client. Public opportunity/CIRP rooms retain their separate project-specific NDA and review requirements.

A contact must be active and portal-enabled; the client must not be archived; the account/session and current policy acceptance must be valid; and the engagement, room and unexpired grant must remain active. Download rights require both the file's global permission and the individual's grant/rule. None, all eligible files and selected files are supported. Disabling one contact, revoking its grant or withdrawing engagement confidentiality approval blocks the next access check.

Existing private-storage, recipient-watermarked preview, upload validation, subfolder and bulk-upload controls are reused. Original download links already issued can remain valid for up to 60 seconds, and previously downloaded material cannot be recalled. View-only rendering cannot prevent screenshots or photographs. See [data-rooms.md](./data-rooms.md) for the exact file allowlist and preview limitations.

## Circulation

Contacts have separate portal and circulation preferences. **Notify authorised contacts** queues one individual service notice per eligible, unsuppressed email. It contains only a secure room link, no report attachment, other contact addresses, financial figures or report title. The recipient must sign in and pass the current access checks. Permission is rechecked before sending. The existing signed Resend worker and two-minute recovery schedule process the queue in bounded batches. Repeated requests with the same batch ID do not duplicate notices; a five-minute room cooldown limits repeated circulation.

These are assignment service notices, not marketing subscriptions. Marketing consent and campaign activation remain separate.

## Verification

- 25 rollback-only hosted database assertions passed, including one-action sharing to 10 contacts, duplicate sharing, wrong-client rejection, individual revocation leaving nine other grants intact, expiry, confidentiality withdrawal, private dashboard visibility, RLS and download precedence.
- 95 Node tests and Next.js production build passed for this implementation. Email-code type mapping and individual notice privacy are covered.
- The branded Supabase Magic Link or OTP template was changed to display the one-time code and the `/auth/verify?purpose=login` destination; saved template preview verified.
- No new Auth test accounts were created. Database fixtures and temporary role changes rolled back. No client reports were disclosed or circulation messages sent during these tests.
- Browser acceptance and individual client onboarding must still be completed on the deployed preview; successful database assertions are not evidence of 10 real users signing in.
