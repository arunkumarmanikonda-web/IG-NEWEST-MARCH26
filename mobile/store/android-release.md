# Google Play release build

The manual **Android Play release bundle** workflow creates and verifies a production AAB for `com.indiagully.app` on `main`. It does not upload to Google Play or publish a release. The regular **Mobile app builds** workflow continues to provide a development-key-signed APK for review.

## Protected signing environment

Create `android-production` in the repository's **Settings → Environments**. Allow exactly the `main` branch, require `arunkumarmanikonda-web` as the reviewer, and disable administrator bypass. Naming an environment in YAML does not configure protection. Both setup and release use the `android-play-release` concurrency group so they cannot run together.

| Type | Name | Value |
| --- | --- | --- |
| Environment secret | `ANDROID_UPLOAD_SIGNING_BUNDLE` | One JSON object containing the keystore, passwords, alias and certificate fingerprint; encrypted by GitHub |
| Environment variable | `ANDROID_UPLOAD_CERTIFICATE_SHA256` | The separate public upload-certificate SHA-256 pin |

The atomic secret has `schemaVersion: 1` and the string fields `ANDROID_UPLOAD_KEYSTORE_BASE64`, `ANDROID_UPLOAD_STORE_PASSWORD`, `ANDROID_UPLOAD_KEY_ALIAS`, `ANDROID_UPLOAD_KEY_PASSWORD`, and `ANDROID_UPLOAD_CERTIFICATE_SHA256`. Base64 is encoding, not encryption; the entire object belongs in encrypted secret storage. Do not place credentials in Git, chat, logs or artifacts. The release process parses this object in memory and masks individual credential values before invoking Gradle.

## First upload-key setup

1. Confirm that Play Console has the intended app record and package. Enable Play App Signing there: Google manages the app-signing key, and the company keeps a separate upload key. If an approved upload key already exists, reuse it; do not initialize another one.
2. After explicit owner authorization to create and store the first key, open **Actions → Android upload key setup → Run workflow**, select `main` and mode `create`, then approve the protected environment deployment.
3. The workflow installs official GitHub CLI `v2.106.0` from its pinned release URL and verifies its SHA-256 before execution. It begins GitHub's device authorization flow and prints only the short-lived pairing code and fixed `https://github.com/login/device` URL. Authorize with the repository owner's account. The CLI's repository access is needed to set environment secrets; the workflow's normal `GITHUB_TOKEN` is not used for this operation. The device pairing wait expires after eight minutes.
4. The helper checks the exact owner and repository, admin access, main-only deployment, required owner review, administrator bypass disabled, and empty bundle/legacy-secret/pin slots. Incomplete protection responses fail closed.
5. It generates a 4,096-bit RSA PKCS12 key, 10,000-day certificate, cryptographically random password and alias `indiagully-upload`. A single `gh secret set` writes the complete encrypted bundle through stdin; the public certificate pin is then written separately. No password is a command argument.
6. The CLI prefers expiring credentials, but expiry is not guaranteed by that preference. This session is confined to a private RAM-backed directory, not a shared OS credential store. The cleanup step uses the pinned CLI's default revoking logout, removing this job's OAuth authorization and its isolated private configuration. If revocation cannot be confirmed, the job fails and reports that the owner must revoke the authorization in GitHub account settings. Forced runner termination can prevent cleanup; treat any run without a confirmed revocation result as requiring an account-side authorization review. Credentials are never uploaded as artifacts.

The job uses a private `0700` CLI directory in `/dev/shm` and `0600` private files. Temporary key material is destroyed at job cleanup. This workflow does not create a separate company password-manager backup. GitHub cannot reveal stored secret values; the first verified signed build proves that the stored keystore, passwords, alias and public pin agree. Verify the public upload-certificate fingerprint against Play Console after enrollment; do not substitute Google's app-signing certificate fingerprint.

## Interrupted setup and repair

One atomic secret avoids a key being saved without its password. If the bundle write succeeded but the public pin write failed, rerun **Android upload key setup** in mode `repair`. This uses the existing encrypted bundle, verifies its keystore certificate and recorded fingerprint, and adds the missing matching public pin. It never generates a key, replaces the bundle, or overwrites a conflicting pin.

Mode `create` refuses even partially initialized signing slots. If the first atomic write failed and no bundle exists, no released app uses the discarded temporary key and a fresh authorized setup run may create the first retained key. Do not run key initialization concurrently outside the workflows. GitHub's secret API has no conditional create-only operation; the workflows' shared concurrency is the guard against competing runs.

For an already authenticated owner CLI on a trusted machine, the helper is also available locally:

```sh
python3 mobile/scripts/provision-android-upload-key.py --dry-run
python3 mobile/scripts/provision-android-upload-key.py --create
```

The default and `--dry-run` are read-only. Local failures retain private recovery material outside the repository at the reported path. Reconcile that same key before deleting it. Local `--repair` requires the existing bundle supplied securely as `ANDROID_UPLOAD_SIGNING_BUNDLE`; do not paste it into command arguments or shell history.

## Build and review

1. Finish source acceptance and store/privacy disclosures. Confirm version and increase `android.versionCode` for each new Play upload. The initial configuration is `1.0.0` / code `2`; never reuse a previously uploaded version code.
2. Run **Android Play release bundle** on `main` and approve the `android-production` deployment.
3. The job installs locked dependencies, runs checks, generates a clean Expo Android project, then exposes the atomic signing bundle only to the build-and-verification step. Credentials are not written into Gradle source. Temporary signing material is removed even on failure.
4. Download `india-gully-play-release-<commit>`. It contains the signed `india-gully-play.aab`, public `upload-certificate.pem`, `release-manifest.json` with package/version/source commit, certificate fingerprint and AAB hash, and the decoded `android-manifest.xml` and `android-manifest-audit.json` inspection results.
5. Upload to the intended Play testing track first. Verify package, version and upload certificate, complete physical-device testing and required declarations, then prepare production. Workflow success is not Google review approval or publication.

The build checks `jarsigner -verify -strict` against the expected alias, verifies the certificate pin and validity, and checks for the native manifest, bundle configuration and embedded JavaScript. A separate step uses checksum-pinned official bundletool to inspect the final AAB and compares its package, version and hash with the release record. It checks SDK levels against the installed React Native baseline and rejects debug/test mode, backup, cleartext, unexpected permissions and unapproved component exposure. Missing, unsigned, tampered, wrong-key or failed-audit output is not offered as a release artifact. Data-room and website/client authentication remain governed by their existing application rules.

Safety checks use mocked provisioning/authentication operations and generate no production key:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 mobile/tests/provision-android-upload-key.test.py
PYTHONDONTWRITEBYTECODE=1 python3 mobile/tests/github-key-setup-auth.test.py
node --test mobile/tests/android-play-release.test.mjs
```

References: [Android app signing](https://developer.android.com/studio/publish/app-signing), [GitHub Actions secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets), [GitHub CLI logout](https://cli.github.com/manual/gh_auth_logout), [jarsigner verification](https://docs.oracle.com/en/java/javase/17/docs/specs/man/jarsigner.html).
