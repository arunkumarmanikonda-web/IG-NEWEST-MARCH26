# Careers and app sign-in release · 27 November 2026

## Current outcome

The Careers feature and guest/client app sign-in changes are merged in PR #67. The website deployment is ready and the public Careers page and footer link have been verified live. Google Play published **1.0.2 (4) - Sign in and Careers** as internal-test release **3** at **03:56 IST on 27 November 2026**. The console confirms **Available to internal testers** and **Not reviewed**. This is internal-test availability, not public-store approval. The iOS simulator build passed, but no TestFlight or App Store release has been made.

## Website and administration

- Public entry: https://indiagully.com/careers, linked from the website footer.
- Admin entry: **Careers & applications** at `/admin/careers`.
- Administrators can configure the Careers introduction, pause recruitment, and create, publish, close or archive vacancies with optional closing dates.
- Applicants can apply against an open role without creating an account, provide a PDF CV or HTTPS professional-profile/CV link, and receive a saved-application reference.
- Applications, internal recruitment notes and CVs are private to authorised Careers administrators. Status changes do not send emails.
- Unauthenticated requests for the admin workspace redirect to sign-in.
- The production migration has been applied. Careers records use private tables with row-level security. No jobs or applicant records were seeded into production.

## Source and deployment evidence

| Item | Verified value |
| --- | --- |
| Pull request | [#67](https://github.com/arunkumarmanikonda-web/IG-NEWEST-MARCH26/pull/67) |
| App source revision, merged in PR #67 | `69a6c09601c39e032d8d703c93264fac5d921683` |
| Production Vercel deployment | `dpl_Hfg6NW4hdbzDEGK6oNaW64DsJMqA` |
| Production deployment state | `READY` |
| Main quality workflow | `45900119946`, passed |
| Main mobile workflow | `45900120007`, passed |

## Validation

- 391 unit tests passed.
- 37 SQL checks passed.
- Seven mobile journeys passed, with one intentional skip.
- Public Careers page and footer link verified on the production website.
- Unauthenticated admin access verified to redirect to login.
- Native Android QA rerun passed nine checks and captured fourteen genuine app frames.
- Automated checks did not submit credentials, OTPs or candidate applications. Full authenticated sign-in and physical-device acceptance remain separate checks.

## Android 1.0.2 (build 4)

| Item | Verified value |
| --- | --- |
| App display name | India Gully |
| Version / version code | `1.0.2` / `4` |
| Standalone test APK artifact | `15156335732` |
| Standalone test APK source workflow | `45900120007` |
| Signed release workflow | `45900158772`, passed |
| Signed release artifact | `15156555550` |
| Signed AAB SHA-256 | `6e65c83c4fe84ec83ea9108f022500001e4914114d313c1b1b3e5dd04b52777a` |
| Upload certificate | Same previously approved certificate |
| Google Play release | Release `3`; **1.0.2 (4) - Sign in and Careers**; **Available to internal testers**, **Not reviewed** |
| Internal-test publication | 27 November 2026, 03:56 IST |
| Initial native Android QA workflow | `45902453624`; Careers WebView heading expectation required a QA correction |
| QA-only correction | [PR #68](https://github.com/arunkumarmanikonda-web/IG-NEWEST-MARCH26/pull/68); Careers WebView heading expectation corrected |
| Native Android QA rerun | `45903883890`, passed; original APK from workflow `45900120007` |
| QA-tooling revision | `bf181f10a92426a41e7279153f228e2b1c9ea9bb` |
| Native QA evidence artifact | `15157177383`; fourteen genuine frames and nine checks |
| Native QA completion | 26 November 2026, 22:24:25 UTC / 27 November 2026, 03:54:25 IST |

The update adds a visible guest/client sign-in entry and access to Careers. Staff workspace remains separate. The existing tester invitation is https://play.google.com/apps/internaltest/4700795783250438794. The owner had previously been verified as a tester; this release record does not claim the update has been installed on the owner's device.

PR #68 corrects the native review's Careers WebView heading expectation. It does not change the signed app or runtime, which remain at app source revision `69a6c09601c39e032d8d703c93264fac5d921683`. The successful rerun reviewed original test APK artifact `15156335732` from workflow `45900120007`. This was the test-signed APK from the same application source; the signed Play AAB was separately audited and did not change for the QA correction.

### Store listing draft

The updated Play description and eight new native screenshots were saved as a draft. Their order is Home, client sign-in, Careers, Explore, property detail, product detail, HORECA and staff sign-in. Saving these assets does not constitute public listing or store-review approval.

## iOS

| Item | Verified value |
| --- | --- |
| App version / build number | `1.0.2` / `4` |
| Unsigned simulator app artifact | `15155278877`, successful |
| Native iOS Home capture artifact | `15155219137`, successful |
| Apple organisation enrolment | `AKA28L843M` |
| Apple account status | Organisation enrolment remains **Pending** |

The iOS build includes the shared app changes. Its successful simulator build and Home capture do not establish physical-device acceptance, distribution signing or TestFlight availability. Apple membership activation, signing/provisioning, a signed device build and TestFlight upload remain pending.

## Remaining acceptance and distribution work

- Verify installation and complete authenticated client/staff sign-in on the owner's physical Android device.
- Complete the outstanding public-store submission requirements and obtain approval before claiming a public Android launch.
- Continue to report iOS as an unsigned simulator build with a successful native Home capture only. Apple membership activation and distribution requirements must be completed before a TestFlight or App Store release can be claimed.
