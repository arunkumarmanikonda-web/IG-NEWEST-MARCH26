# India Gully store submission copy

Prepared 19 November 2026. This is submission preparation, not evidence of an upload or store approval. Reconcile the final build and release checklist before copying these fields into either console.

## Listing fields

| Field | Prepared value |
| --- | --- |
| App name | India Gully |
| Apple subtitle | Properties, HORECA & insights |
| Google short description | Explore properties, retail spaces, HORECA products and business insights. |
| Primary category | Business |
| Primary listing language | English (India), where available |
| Version | 1.0.0; use the final build's actual version |
| Website | https://indiagully.com |
| Support URL | https://indiagully.com/contact |
| Support email | hello@indiagully.com |
| Privacy URL | https://indiagully.com/privacy; publish the mobile/Gullu updates described in privacy-disclosures.md before submission |
| Copyright | 2026 Vivacious Entertainment and Hospitality Private Limited |
| Package / bundle ID | com.indiagully.app, provisional until ownership and availability are verified in the developer accounts |
| Store seller / developer account | Verify the account's legal entity; do not substitute the brand for the registered seller |
| Distribution | Free download; no native in-app purchases or subscriptions in this release |

## Full description

India Gully brings property opportunities, retail leasing, hospitality procurement and commercial perspectives together in one place.

Explore property briefs by keyword and location. Browse promoter spaces and brand requirements, review published facts and tags, and open the complete brief when you want to learn more.

Find HORECA products by collection, SKU, product name or brand. Explore the details and send a contextual enquiry to the India Gully team through our secure website.

Build your own shortlist. Save public briefs on your device, revisit saved text when you are offline, and share a listing using your phone's sharing options. Refresh the catalogue to see the latest published information and updates to your saved entries. Images and full website pages need an internet connection.

Read Perspectives and discover India Gully's practices across real estate, transactions, debt and special situations, hospitality, retail leasing, entertainment and HORECA procurement. Published India Gully Residences launch information appears when it is available.

Meet Gullu, your India Gully buddy, through the secure website. Client accounts and authorised data rooms also open in the secure browser, with the website's sign-in and access controls.

India Gully is a brand of Vivacious Entertainment and Hospitality Private Limited. Property and product availability may change. An enquiry does not reserve a property or confirm an order.

Authorised team members can open the separate Staff sign-in at the bottom of More and use their existing staff verification.

## Apple keywords

property,real estate,retail,leasing,hospitality,HORECA,procurement,advisory,insights

Do not add financial-return claims, hotel booking claims, native chat/data-room claims, unimplemented push notifications, or unsupported “best” rankings.

## Review notes

This is a native catalogue and discovery app. Home, property/retail filters, HORECA collection and SKU search, native detail sheets, on-device shortlists, offline saved text and native sharing work without registration. Data is read from the published public catalogue at https://indiagully.com/api/mobile/catalogue.

Gullu, contextual enquiries, client accounts and staff workspace intentionally open India Gully's HTTPS website in the system browser. The user is told when this transition occurs. Private records are not copied into the native shortlist/cache. Staff permissions are granted by India Gully and do not arise from installing the app.

Suggested public review path: Home → Explore → open a listing → Save → Saved → Share; HORECA → choose a collection → search a SKU or brand; More → Perspectives. Pull to refresh retrieves the latest catalogue. Test offline Saved only after saving a published brief online.

Provide a dedicated reviewer account and a synthetic demonstration room if the store requests access to restricted features. Do not give reviewers owner credentials, live client documents, production OTPs, signing credentials or MFA recovery codes. Credentials belong in the console's protected review fields, never this repository. No reviewer account has been created by this preparation.

## Screenshots and artwork

Capture the actual final app on simulators/emulators. Do not fabricate UI or expose client/staff data. Use published content whose image rights are cleared. Recommended sequence: native Home, Explore filters, property detail, HORECA collection, SKU detail, Saved, Perspectives, and More and the separate staff sign-in footer.

| Asset | Production specification |
| --- | --- |
| Apple iPhone | Use a currently accepted large-display size, for example 1320 × 2868 portrait; no alpha/transparency |
| Apple iPad | Required because supportsTablet is true; 2064 × 2752 or 2048 × 2732 portrait |
| Google Play phone | 2–8 real screenshots; prepare at least four at 1080 × 1920 portrait; PNG/JPEG, no alpha |
| Google Play feature graphic | 1024 × 500; JPEG or 24-bit PNG without alpha |
| Google Play store icon | 512 × 512 PNG; at most 1024 KB; distinct from adaptive foreground asset |
| App icon | Verify the final native 1024 × 1024 icon and platform-generated variants; no transparent iOS icon |

The supported capture-size list can change. Check the active console against [Apple screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/) and [Google preview-asset specifications](https://support.google.com/googleplay/android-developer/answer/9866151) when uploading. Website screenshots or the browser-exported app are not substitutes for final native-build screenshots.

## Upload prerequisites and remaining evidence

| Item | Status at preparation |
| --- | --- |
| Android signed production AAB | Not supplied by the existing CI; its APK uses a development signing key |
| iOS signed production IPA | Not supplied by the existing CI; its .app is an unsigned simulator build |
| Play Console developer account, app record, verification and release access | Not verified |
| Apple Developer membership, team, agreements, App Store Connect app record | Not verified |
| Expo account/project and ownership | Not verified; no project ID is configured |
| Android upload signing credentials and Play submission service account | Not verified |
| Apple distribution provisioning/signing and upload credentials | Not verified |
| Actual device acceptance | Record the tested build, device/OS, result and date after testing |
| Account deletion and privacy declarations | See privacy-disclosures.md; resolve before production submission |
| Content rating, audience and financial-features questionnaires | Complete from actual app/web flows; do not infer answers from the Business category |
| Screenshot pack and reviewer access | Not yet produced or supplied |

Expo can submit a signed Android AAB to an existing Play app with configured service-account credentials. The first release can use the internal-testing track; completing the listing and production requirements is separate. iOS submission requires a signed IPA and Apple account credentials; processing into TestFlight is separate from submitting the app for App Review. See [Android submission](https://docs.expo.dev/submit/android.md) and [iOS submission](https://docs.expo.dev/submit/ios.md).

For a newly created personal Google developer account, inspect the applicable testing gate: the current rule requires 12 opted-in closed testers for 14 continuous days before applying for production access. Do not assume this applies to an established organisation account. See [Google personal-account testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465).

Apple review is discretionary. The native search, detail, saved/offline and sharing features support utility beyond a website link collection; do not describe external-browser features as native. See [App Review Guidelines, section 4.2](https://developer.apple.com/app-store/review/guidelines/).
