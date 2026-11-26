# Mobile privacy and deletion release record

Prepared 19 November 2026 from repository behaviour and the published India Gully policy pages. This is an engineering inventory and draft disclosure worksheet, not completed App Store Connect or Play Console declarations. Review the exact signed release and live service configuration before certifying any store answers.

## What the native application does

- Retrieves published catalogue JSON and public imagery over HTTPS. Public browsing does not require registration.
- Keeps the public catalogue and saved public briefs in AsyncStorage on the device. Saved text and timestamps are available offline. The app does not upload the native shortlist to India Gully.
- Uses native sharing only when the user chooses to share a public item. The user chooses the receiving app.
- Opens Gullu, contact/enquiry forms and client accounts in the system's secure browser. Version 1.0.1 opens staff sign-in and workspace in an embedded first-party WebView, independent of the system browser. A session-local reset is confirmed before each fresh staff entry, followed by the existing login/verification flow. These services retain their own authentication, records, consent and retention requirements.
- Does not implement a native advertising/analytics SDK, native payments, push notifications, location collection, camera, microphone or address-book access. The final generated manifest and privacy manifests must still be checked for transitive SDK behaviour.
- Does not place private data-room documents, passwords, authentication tokens or Gullu transcripts in native AsyncStorage. Browser and staff WebView cookies/web storage are separate from that public cache. WebView incognito/cache settings do not establish complete device erasure on close. Browser-only OAuth connections and exports require an explicit handoff and may require separate authentication.

Evidence: mobile/src/App.tsx, mobile/src/domain.ts, mobile/src/storage.ts, mobile/app.config.ts, mobile/package.json, app/api/mobile/catalogue/route.js and lib/mobile-catalogue.mjs.

## Service-data inventory for the store questionnaires

Owned website flows are part of the actual app experience. Do not answer “no data collected” merely because they open in a browser. Apple explicitly includes owned web traffic; Google's form also includes controlled embedded web behaviour. Purely on-device data that is never transmitted is assessed separately. [Apple privacy details](https://developer.apple.com/app-store/app-privacy-details/) · [Google Data safety](https://support.google.com/googleplay/android-developer/answer/10787469)

| Flow/data | Current handling | Proposed declaration treatment; confirm console taxonomy |
| --- | --- | --- |
| Native shortlist and local search/filter state | Public item snapshots and local preferences; not uploaded by the native app | On-device only; do not label as server collection unless release behaviour changes |
| Public catalogue/image requests | Hosting receives network requests, including ordinary request metadata | Verify actual IP/log retention, diagnostics and any host analytics before a “no collection” answer |
| Account registration/sign-in | Email, account identifiers, profile details, authentication/security records and policy acceptance are processed by the website/authentication service | Account management and app functionality; linked to account; optional for public browsing |
| Contact and procurement enquiries | Name, email, phone/organisation where supplied, enquiry text, interests and service/quotation information | Contact info, user content/customer support and applicable purchase/service records; linked when identifiable; optional enquiry flow |
| Gullu | Requires name, email, mobile and explicit chat notice before conversation; records questions, answers, sources and follow-up status; generates internal reports | Contact info, identifiers, user content and interaction records; app functionality/customer support and service improvement; linked to guest contact |
| Gullu AI processing | Question/history supplied to the configured AI processor; email/phone redaction is attempted but is not a guarantee that arbitrary free text contains no personal information | Disclose the processor relationship and submitted user content; never claim perfect redaction or no external processing |
| Client data rooms | Verified identity, grants, access activity and any permitted uploads/downloads use protected website services | Account identifiers, user content/documents and activity as applicable; confidential service functionality |
| Staff workspace | Staff identity, MFA/security checks and role-controlled business records | Account/workspace functionality; access is restricted; staff role does not waive disclosure requirements |
| Service messages | Requested confirmations, invitations and enquiry follow-up use the configured email provider | Functionality/customer support; verify service-provider contracts and provider retention |
| Optional website marketing/advertising | Consent-controlled advertising-event code exists in the website | Inspect live configuration and any third-party linkage before answering tracking, advertising or sharing questions; native consent and store requirements cannot be assumed satisfied by a website cookie choice |
| Security/operations | Website has abuse-prevention hashes, security records and timing/outcome logs | Confirm retention and identifier linkage; classify under security/functionality or diagnostics as the console requires |

Google distinguishes processing by an instructed service provider from some forms of third-party “sharing”; this is not a blanket exemption from collection disclosure. Confirm each provider's actual role and any advertising use. The repository alone cannot establish all contractual or retention facts. [Google definitions](https://support.google.com/googleplay/android-developer/answer/10787469)

All first-party destinations in the mobile code use HTTPS. Do not claim that a user's chosen external sharing app has been audited by India Gully. No sale of user data is declared in the current public privacy notice; verify operating practice remains consistent.

## Account-deletion changes and remaining verification

Build 2 adds More → Delete account & data, preserves the deletion destination through sign-in, selects the full account-and-data deletion option, and pre-fills the request. The public /delete-account page explains the authenticated request, tracking and fallback contact path. These changes make initiation discoverable; they do not implement automatic deletion.

The ig_privacy_request function records requests and review responses. A separate automated account-deletion execution workflow was not identified in the inspected code. The existing operational team must fulfil and verify the request, including associated data and any specific retained records. A “resolved” status by itself is not proof that deletion occurred. Test that fulfilment before store certification.

Release acceptance should verify:

1. A plainly labelled Delete account action, reachable from More, opens the dedicated deletion path and returns there after sign-in.
2. The user can initiate deletion of the whole account and associated data, with a clear confirmation and receipt. Do not require an unrelated free-form support conversation.
3. Any retained information and the reason for retention are disclosed. A lawful hold on a specific business record is not a blanket reason to retain all unrelated account data.
4. The process supplies a realistic completion window/status and actually deletes or irreversibly anonymises data that is not required to be retained. Account suspension alone is insufficient.
5. The public deletion URL names India Gully and explains how to request deletion even when the app is uninstalled. Do not use an unrelated home page or a dead sign-in redirect as the Play deletion URL.
6. Test request receipt, duplicate handling, verification, completion and retained-record reporting with a synthetic account; do not erase real clients while testing.

Apple allows a direct website completion link and requires a straightforward initiation route for apps supporting account creation. Google requires an in-app route and an external web resource, with deletion of associated data subject to disclosed legitimate retention. Store review should inspect the completed flow, not the intent in this document. [Apple account-deletion guidance](https://developer.apple.com/support/offering-account-deletion-in-your-app/) · [Google account-deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)

## Published-policy changes to prepare

The live /privacy and /data-usage pages rechecked on 26 November still reported version 2026-11-11.2. The current privacy page includes a separate “Chatting with Gullu” section covering guest contacts, transcripts, OpenAI processing, staff review and leadership reports. Explicit native-app and on-device cache coverage remains to be added. The /data-usage page also says every project requires an approved NDA, which no longer describes the admin-authorised access option. Address these inconsistencies in a newly versioned policy release; do not rewrite an immutable prior acceptance or report this draft as already published.

Android 1.0.0 used Chrome Custom Tabs for all private services. Source version 1.0.1 keeps client/Gullu services there and adds an embedded WebView for staff. The final disclosure review must include controlled WebView processing as well as the actual native and owned-service flows. Browser navigation is not proof of no collection. Provider retention, advertising configuration and end-to-end account-deletion fulfilment still need verification. The public statutory address also differs from the Rohini address in the verified D-U-N-S record; obtain owner reconciliation before changing published corporate details.

Suggested mobile coverage, to merge with the applicable current notice:

> This notice covers the India Gully website, Android and iOS applications, and the account and service pages they open. Public mobile browsing does not require an account. The app stores public catalogue and shortlist information on your device for convenience and offline reading. It requests published content over HTTPS. Hosting and security systems process the technical request information needed to serve and protect those services. Client services open in the secure browser; staff access uses the website inside the app with separate session storage. Both follow their stated authentication and access rules.

Suggested Gullu coverage, based on the implemented guest flow:

> Before chatting with Gullu, you provide your name, email and mobile number and accept the chat notice. India Gully records your conversation and contact details to answer your questions, maintain the conversation, prepare internal service reports and handle requested follow-up. A configured AI provider processes the question and relevant conversation context to prepare replies. Do not include unrelated confidential or sensitive information. The app's native shortlist does not store your conversation. You can end the browser chat session and request access to or deletion of the associated records through the privacy-request process.

The SQL purge is configured for Gullu turns/guest records/report records older than 90 days, with enquiry follow-up records governed separately. Verify the scheduled purge actually runs and document retention of already delivered internal report emails/attachments before promising a complete 90-day deletion limit.

Suggested access-basis correction:

> Registration, a marketing choice or possession of a room link does not grant confidential access. Access is authorised for a specific room and verified recipient through the applicable NDA, engagement, mandate permissions or a recorded administrator decision. The administrator controls expiry, revocation and download permissions. An administrator grant does not fabricate an NDA signature or change any agreement already accepted.

Do not declare “no tracking” until the actual website advertising configuration, identifiers, purposes and platform consent requirements have been checked. Do not declare an automatic account-deletion service until it has been implemented and exercised.

## Console completion record

Record the final binary build IDs, provider configuration review, approved policy version and URL, deletion URL, reviewer-test result, screenshots, privacy-manifest validation, disclosure answers and submission IDs here or in the release ticket. At preparation none of those store certification fields has been submitted.
