# Mobile policy draft for review

Status: prepared in source only. No production migration or policy publication was performed by this review.

`supabase/migrations/20261126183000_mobile_policy_draft.sql` stages the hidden, non-current, unreviewed version `2026-11-26.mobile-draft.1`. It derives the complete bundle from approved release `2026-11-11.2`, whose production PostgreSQL JSONB SHA-256 was verified as `62acfad3240828407e1829165202b82ff4fe910f4e10ae2aef7e3dc5e13e99c1` on 26 November 2026.

Only `privacy.body` and `dataUse.body` change. Other documents, document titles, corporate addresses, the active release, accepted policy versions/hashes and executed agreements remain untouched. No fresh legal-review confirmation is implied. Existing identity and Gullu sections appended by `app/legal-document.js` remain visible and are not duplicated in the stored bundle.

## Exact copy for review

The privacy scope sentence becomes:

> This notice covers the India Gully website and mobile applications, accounts, enquiries, procurement and controlled project information.

The new privacy section is **Mobile app and local storage**:

> Public catalogue browsing in the India Gully mobile app does not require an account. The app retrieves public catalogue content and images over HTTPS. Hosting and security providers receive the technical request information needed to deliver and protect those services.
>
> The app stores public catalogue content and your shortlist on your device for convenience and offline reading. Your native shortlist is not uploaded to India Gully. You can remove saved items in the app; clearing the app's storage or uninstalling it removes its local data. When you choose Share, the operating system passes the selected public link to the app you select.
>
> Client accounts, staff sign-in, Gullu, enquiries and private project services open India Gully's website in the system browser. Their authentication, consent, access and retention rules apply. Website sessions and storage are separate from the native app's public cache. The native cache does not store passwords, account tokens, chat transcripts or private data-room documents.
>
> The app does not include an advertising or analytics SDK and does not request permission to access your contacts, microphone, camera or precise location. These statements do not mean that website service records or technical requests are anonymous or unrecorded.
>
> Use More > Delete account & data in the app or https://indiagully.com/delete-account to request account and associated personal-data deletion. The request is reviewed under the retention and privacy-request provisions below; clearing local app data alone does not delete an account or server records.

The privacy **Changes** paragraph becomes:

> The policy version and publication date are displayed here. Material changes are published as a new retained version. Original registration acceptances retain the version and hash recorded when they were given. Publishing a new release does not rewrite an earlier acceptance or change an executed NDA or accepted commercial agreement. Where a new consent or acknowledgement is required, it must be obtained separately.

The data-usage **Restricted information** paragraph becomes:

> Registration, policy acceptance, an enquiry, a marketing choice or possession of a room link does not itself grant access to confidential project information. Access is granted for a particular room and verified recipient through the applicable project NDA, client engagement or mandate permissions, or a recorded administrator authorisation. An authorised administrator may grant access before NDA signing and records the recipient, reason, expiry and download permissions. This decision does not create an NDA signature or alter an agreement already accepted. Recipients must sign in using their authorised email address; access may expire or be revoked. File and upload permissions remain subject to the room's configured rules. You must not circumvent restrictions, share credentials, redistribute files or upload information without authority.

## Review and publication

1. Review these paragraphs against the exact signed binary and production services. The migration only stages a draft; applying it does not change the public notice.
2. Inspect the resulting complete draft, including the six unchanged documents. If its fixed base has changed, stop and prepare a new draft; do not bypass the hash guard.
3. Publish through the existing owner `ig_policy_publish` workflow using the current `previous_version`, the reviewed complete `documents`, and a fresh final version such as `2026-11-26.1`. Use `legal_reviewed: true` only when its required confirmation is actually satisfied. The publisher inserts a fresh version, so do not reuse the staged draft version.
4. Confirm `/privacy` and `/data-usage` display the new release; confirm the old release's documents/hash and existing registration consents remain unchanged. The existing publisher retains old releases and audits the new publication.

The latest registration rules intentionally preserve original consent instead of forcing reacceptance after every publication (`20261113175602_staff_verification_choice.sql`). This draft corrects the old policy promise of automatic reacknowledgement; it does not change authentication. The old help sentence in `app/admin/settings-manager.js` that says publication requires every user to acknowledge the new release is also stale and should be corrected separately.

## Remaining release questions

This draft does not establish completed account deletion. The deployed `ig_privacy_request` function creates requests and records review/status responses; there is no inspected erasure executor. A working, documented fulfillment path must address Auth identity, email-linked enquiries/contacts/Gullu data, permitted retention and private storage, then be checked using a synthetic account before claiming deletion completion.

No address change is proposed. The Rohini D-U-N-S registered address and the presently published business address require company reconciliation independently.
