# India Gully for Android and iOS

This is a native Expo / React Native application sharing India Gully’s published website catalogue. Android 1.0.0 (2) is available through internal testing. Source version 1.0.1 (3) adds in-app staff access; its build and release must be verified separately. Public store review and physical-device acceptance remain release requirements.

## What is implemented

- Native Home, Explore, HORECA, Saved and More navigation, responsive phone/tablet layouts, accessible controls, loading/empty/error states and pull-to-refresh.
- Property, promoter-space and brand-requirement discovery with keyword, location and mandate-type filters; native briefs with published facts, imagery and tags.
- HORECA collection tiles and SKU/product/brand search. Products appear within a chosen collection or search, rather than an ungrouped initial catalogue.
- Native Perspectives and practices; full website briefs remain one tap away.
- A CMS-driven India Gully Residences launch card, shown only when the public feed supplies the active launch. No invented project facts or placeholder renders.
- On-device public shortlists with saved/updated dates, offline text and native sharing. A successful catalogue refresh updates saved briefs and removes withdrawn content; a title-only withdrawal notice remains removable. Public cached media may require connectivity when it is not in the operating system’s image cache.
- Contextual enquiries use the website’s existing `interest` and `message` query parameters.
- Staff sign-in is separate at the bottom of More. Version 1.0.1 opens the first-party staff website inside a restricted WebView, independent of the normal browser session. The `/login/mobile` entry confirms a session-local sign-out by POST before showing the existing login and staff verification flow; failures stay on a retry screen. Existing role and verification checks remain authoritative.
- Gullu, the client workspace, account/data requests, privacy and enquiry forms open in the system’s secure in-app browser. Each transition is labeled. This version does not provide native account authentication, native private data rooms, native chat storage, push notifications, payments or offline private documents.

## Environment and local verification

Use Node.js 22.13+ (Node 24 LTS recommended), npm, and a clean checkout. The independent `mobile/package-lock.json` does not change the website dependencies.

```sh
cd mobile
npm ci
npm run typecheck
npm test
npx expo install --check
npm run export
```

If the Expo compatibility service is unavailable, the installed SDK compatibility map can be checked with `EXPO_OFFLINE=1 npx expo install --check`. This is a fallback for a network failure, not a replacement for periodically checking current upstream compatibility.

`npm run export` produces Android and iOS Hermes bundles and a web preview in `dist/`. Bundles and a successful TypeScript check are not proof that a signed native application has been installed on a device.

The project uses Expo SDK 58, React Native 0.88.1 and React 19.3.0. Install any additional Expo/native dependency with `npx expo install <package>` to retain SDK compatibility. Do not apply a forced npm audit downgrade to an older Expo SDK.

```sh
npm start
```

Use a compatible Expo Go installation for development, or build a development/native binary. The development machine and device must be able to reach the Metro server and `https://indiagully.com`.

## Native source and local builds

Generated `android/` and `ios/` projects are intentionally ignored; `app.config.ts`, `eas.json`, source and the lockfile are the reproducible inputs. Generate native projects with:

```sh
npm run prebuild
```

Android requires JDK 17, an Android SDK supporting the SDK 58 generated project (compile SDK 37, target SDK 36) and an emulator or physical device. With that environment configured:

```sh
npx expo run:android
```

A standalone release-mode APK can be compiled for CI review without creating store credentials:

```sh
npx expo prebuild --platform android --no-install
cd android
./gradlew assembleRelease
```

The repository CI deliberately uses the generated development key to sign its standalone release-mode APK, labels the artifact **debug-signed test**, and bundles JavaScript so it can run without Metro. This APK is installable for review, but is not signed for Google Play. Never upload the template debug key as a store release. A debug APK from `assembleDebug` ordinarily relies on Metro and is not the standalone review build.

For Google Play, the separate **Android Play release bundle** workflow builds and verifies an upload-key-signed AAB directly with Gradle. It requires the owner's upload-key credentials in the `android-production` GitHub environment, a pinned public certificate fingerprint, and a reviewed `main` commit. It does not need an Expo account and never uploads or publishes the app automatically. See [Android release setup](store/android-release.md) for provisioning, outputs and release checks.

iOS requires macOS with Xcode 26.4+ and the iOS simulator SDK. On that machine:

```sh
npx expo run:ios
```

Linux can export the iOS JavaScript bundle and generate the iOS project, but cannot compile or install an iOS app with Xcode. The macOS CI job produces an unsigned simulator `.app`, which runs in a compatible iOS simulator; it cannot be installed on an iPhone or distributed through TestFlight. SDK 58 supports iOS 16.4+ and Android 7+.

## EAS build profiles

`eas.json` includes these profiles. An Expo account and an explicitly initialized project are required before running cloud builds. A cloud build may consume account build quota or incur charges; no cloud build or credentials were created as part of this implementation.

| Profile | Platform | Output / purpose |
| --- | --- | --- |
| `preview` | Android | APK for internal installation; requires Android signing configuration |
| `simulator` | iOS | Simulator build, not a device IPA |
| `production` | Android | AAB for Google Play, signed with the configured upload key |
| `production` | iOS | Signed store/TestFlight build; Apple Developer credentials and provisioning required |

After the owner chooses the Expo organization and confirms identifier ownership:

```sh
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform ios --profile simulator
```

For approved store builds:

```sh
npx eas-cli@latest build --platform android --profile production
npx eas-cli@latest build --platform ios --profile production
```

The provisional app identifiers are `com.indiagully.app` on both platforms, set in `app.config.ts`. Confirm they are available in the owner’s store accounts before the first store build. Version/build numbers are local: increase `version`, `android.versionCode` and `ios.buildNumber` before subsequent submissions. No Expo project ID, Apple team ID, store account, keystore or App Store Connect API key is fabricated in this project. Run submission only after store metadata, owner approvals and review requirements are complete.

## Public feed and link safety

The app reads `GET https://indiagully.com/api/mobile/catalogue` with `schema_version: 1`. It accepts only explicit public fields and fails closed for unknown versions, malformed required arrays, more than 5,000 entries per collection, responses over 8 MB or requests over 15 seconds. Failed refreshes retain previously saved public content and display its date. A successful refresh treats the returned collections as complete, so the server must never silently paginate this endpoint.

All navigation destinations use canonical HTTPS `indiagully.com` routes; admin/API routes, external hosts, credentials, redirect parameters and encoded path traversal are rejected. Image URLs use a separate first-party media allowlist. HTML is converted to text and rendered by native `Text`, not a web view.

The `indiagully://` custom scheme supports routes such as `indiagully://opportunities/<slug>`. Custom schemes are not a verified authentication mechanism. No tokens or private data are accepted in them. Verified HTTPS Universal Links / Android App Links require the owner’s signing identity and domain association files and are intentionally not claimed or enabled yet.

Only public catalogue and shortlist snapshots are stored in AsyncStorage. The native JavaScript layer does not copy passwords, account tokens, client records or conversation history into that cache. Staff authentication cookies and web storage belong to the embedded WebView; client/Gullu sessions remain in the system browser. The two browser stores are separate. WebView incognito/cache settings are not a promise that all device data is erased on close. Closing the workspace is not a server logout; every fresh entry first resets that app session using `scope: local`, preserving separately authenticated devices. The ordinary website Sign out action retains its existing global behavior.

Staff navigation and popups are restricted to the exact HTTPS India Gully origin. External destinations require an explicit browser choice. Google mailbox connection restarts from `/admin/mailbox` in that browser rather than forwarding an OAuth URL whose state is tied to WebView cookies. Browser-only exports and some document downloads have an explicit browser fallback and may require sign-in again. Standard file selection and rendered previews need device acceptance; mobile folder upload is not claimed. No authentication token bridge or native credential injection is used.

## Acceptance checks before release

1. Deploy the website feed and Residences configuration. Verify publish, schedule, expiry and unpublish changes appear on pull-to-refresh and that a disabled Residences launch is absent.
2. On Android and iOS, test all tabs, category filters, SKU search, every detail type, native sharing and contextual enquiry prefill. Check a small phone, tablet, screen reader and enlarged system text.
3. Save multiple entries rapidly, restart the app in airplane mode and verify saved dates/offline notices. Republish/edit and withdraw records in the CMS, refresh, and confirm updated/withdrawn behavior, including an already open detail sheet.
4. Test no connection, invalid feed, empty catalogue, failed image and storage failure. Confirm retries recover without wiping an existing shortlist.
5. Verify `/account`, `/account/privacy`, `/privacy`, `/contact` and `/gullu` in both platforms’ in-app browsers. Confirm sign-in, logout, consent, accessible account deletion and authorized data-room access in the website itself.
6. Confirm public data only appears in the feed and no client/staff data is cached. Keep current dependency and generated native permission audits in CI.
7. Supply accurate Apple App Privacy and Google Data Safety disclosures including website flows and applicable service providers; add privacy/support links, descriptions, screenshots and reviewer access. Owner store enrollment, signing, review and approval remain necessary before distribution.

The brand artwork in `assets/` is rasterized from India Gully’s existing `public/brand/mark.svg` and `logo-dark.svg`. It is not a new logo or generated property depiction.

Initial dependency audit on 19 November 2026 reported three moderate findings through Expo’s build-time `@expo/fingerprint` → `minimatch` dependency and no high/critical findings. The current SDK uses `minimatch` 10.2.6; the advisory’s fixed release is in a different major version. No unverified major override or SDK downgrade was applied. Recheck this before store release and adopt the compatible upstream fix when available.

Official references: [Expo SDK 58](https://docs.expo.dev/versions/latest/), [Expo build setup](https://docs.expo.dev/build/setup/), [EAS configuration](https://docs.expo.dev/eas/json/), [WebBrowser](https://docs.expo.dev/versions/latest/sdk/webbrowser/), [Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/), [Google account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111).
