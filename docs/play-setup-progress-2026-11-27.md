# Google Play release preparation, 27 November 2026

## Observed state

Play Console shows **9 of 12 initial setup items complete**. India Gully remains a draft app; production is inactive. No production release or review submission was made. Internal Android build 1.0.2 (4) remains separate from production.

Completed during this session:

- Financial features: financial advice, reflecting debt/refinancing and capital advisory. No lending, banking, wallet, exchange or crowdfunding capability was asserted. Google requested no additional documents.
- Trader status: saved using the already approved developer trader status.
- Default store listing: saved and ready to send for review. Six verified screenshots remain. Product-detail and HORECA-collection images were removed from the store assets because their AI provenance would require asset labelling. The remaining brand vectors and genuine application screenshots were checked.
- Content rating: the owner expressly approved IARC terms during this session; questionnaire and ratings saved. Controlled user content exchange and online content declared. No unsupported blocking, reporting or moderation features were claimed. The IARC generic rating is 3+, ESRB Everyone, PEGI 3, and Germany USK 16 with increased communication risks. Content rating is separate from the planned adult target audience.

## Remaining Console dependencies

1. **Sign-in details:** dedicated, reusable reviewer access covering both client and staff areas must be created and verified with synthetic data. A client-only identity does not cover the staff workspace.
2. **Target audience:** planned 18+ only, consistent with the adult business service; Console currently blocks the form until sign-in details are complete.
3. **Data Safety:** all selected data types and handling answers are saved as a draft. Final saving is blocked until target audience is complete. Draft answers still require final operational verification before certification.

## Data Safety draft

Account creation supports both username/password/other authentication and username/other authentication. Public registration uses password and verified email. Approved contacts/invitees can create an account via email OTP. Gmail OAuth is a mailbox connection, not India Gully account registration.

Eighteen data types are declared collected: approximate location; name; email; user IDs; address; phone; other personal information; payment information; purchase history; other financial information; emails; other in-app messages; photos; files/documents; contacts; app interactions; other user-generated content; device/other IDs. This includes the first-party WebViews, not just native public browsing.

Collection is marked non-ephemeral. Device/other IDs are required; the other types arise from optional account, recruitment, advisory, client or staff features. No native precise GPS, camera, microphone, device-address-book collection, independent-security badge or UPI verification was claimed. Processing by service providers and user-directed disclosure were treated under Google's sharing exceptions; actual contracts and downstream handling remain a final verification item. Account deletion URL: https://indiagully.com/delete-account. The request flow exists; actual erasure fulfilment has not yet been verified.

## Policy and review environment

The proposed policy bundle `mobile-policy-2026-11-27.1-draft.json` remains unpublished and explicitly `legal_reviewed: false`. Only privacy and data-usage bodies change from the retained production baseline. The publishing form requires the owner's confirmation of legal review, operational accuracy and approval; that confirmation was not supplied or manufactured.

A separate synthetic review deployment/database is proposed because production staff scopes expose genuine business data and require OTP/TOTP. Supabase quoted a new project at US$10 per month. Creation is awaiting the owner's explicit cost decision. No demo project, review account or authentication exception has yet been created.

The client-directory permission defect discovered during preparation was separately corrected and verified in production. See `play-reviewer-access-2026-11-27.md` and the migration/tests. Other existing Supabase advisory categories were not represented as resolved by this narrow fix.

## References

- https://support.google.com/googleplay/android-developer/answer/15748846
- https://support.google.com/googleplay/android-developer/answer/10787469
- https://support.google.com/googleplay/android-developer/answer/17262077
- https://web.iarcservices.com/terms
