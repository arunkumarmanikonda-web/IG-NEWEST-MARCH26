import { createHash, X509Certificate } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const signingMarker = '// India Gully Play upload signing (generated; contains no credentials)';
const requiredSecrets = ['ANDROID_UPLOAD_KEYSTORE_BASE64', 'ANDROID_UPLOAD_STORE_PASSWORD', 'ANDROID_UPLOAD_KEY_ALIAS', 'ANDROID_UPLOAD_KEY_PASSWORD'];

export function fingerprint(value) {
  const normalized = String(value ?? '').replaceAll(':', '').trim().toUpperCase();
  if (!/^[A-F0-9]{64}$/.test(normalized)) throw new Error('Set ANDROID_UPLOAD_CERTIFICATE_SHA256 to the approved upload certificate SHA-256 fingerprint.');
  return normalized;
}

export function validateEnvironment(env) {
  const missing = requiredSecrets.filter((name) => !env[name]?.trim());
  if (missing.length) throw new Error(`Missing production signing secrets: ${missing.join(', ')}. No development signing fallback is allowed.`);
  if (env.ANDROID_UPLOAD_KEY_ALIAS.trim().toLowerCase() === 'androiddebugkey') throw new Error('The Android development key cannot sign a Play release.');
  if (!env.RUNNER_TEMP?.trim()) throw new Error('RUNNER_TEMP must point to a private temporary directory.');
  return fingerprint(env.ANDROID_UPLOAD_CERTIFICATE_SHA256);
}

export function decodeKeystore(value) {
  const encoded = String(value).replace(/\s/g, '');
  if (!encoded || encoded.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error('The upload keystore must be valid Base64.');
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.length < 100 || bytes.toString('base64') !== encoded) throw new Error('The upload keystore is empty or invalid Base64.');
  return bytes;
}

export function validateCertificate(certificate, expectedFingerprint, now = Date.now()) {
  if (/\bCN\s*=\s*Android Debug\b/i.test(certificate.subject)) throw new Error('The Android development certificate cannot sign a Play release.');
  if (fingerprint(certificate.fingerprint256) !== expectedFingerprint) throw new Error('Upload certificate does not match the approved SHA-256 fingerprint.');
  if (now < Date.parse(certificate.validFrom) || now >= Date.parse(certificate.validTo)) throw new Error('Upload certificate is not currently valid.');
}

export function configureSigning(source) {
  if (source.includes(signingMarker)) throw new Error('Signing configuration already exists. Start with a clean Expo prebuild.');
  if (!/apply plugin:\s*["']com\.android\.application["']/.test(source) || !/applicationId\s+["']com\.indiagully\.app["']/.test(source)) {
    throw new Error('Unexpected Android application template or package. Review before configuring signing.');
  }
  // This final block overrides Expo's test release signing without embedding any secret.
  return `${source}\n${signingMarker}\nandroid {\n    signingConfigs {\n        indiaGullyUpload {\n            storeFile file(System.getenv("ANDROID_UPLOAD_KEYSTORE_PATH"))\n            storePassword System.getenv("ANDROID_UPLOAD_STORE_PASSWORD")\n            keyAlias System.getenv("ANDROID_UPLOAD_KEY_ALIAS")\n            keyPassword System.getenv("ANDROID_UPLOAD_KEY_PASSWORD")\n        }\n    }\n    buildTypes {\n        release {\n            signingConfig signingConfigs.indiaGullyUpload\n            debuggable false\n        }\n    }\n}\n`;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, ...options });
  if (result.error || result.status !== 0) {
    // Do not echo subprocess stderr: signing errors can contain sensitive paths/values.
    throw new Error(`${command} failed (${result.status ?? 'not available'}). Check the configured signing key and build logs.`);
  }
  return result.stdout;
}

export function buildPlayBundle(env = process.env) {
  const expectedFingerprint = validateEnvironment(env);
  const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const nativeRoot = join(mobileRoot, 'android');
  const config = JSON.parse(readFileSync(join(nativeRoot, 'play-release-config.json'), 'utf8'));
  if (config.android?.package !== 'com.indiagully.app' || !Number.isSafeInteger(config.android.versionCode) || config.android.versionCode <= 0 || !config.version) {
    throw new Error('Invalid release package/version in the generated Expo configuration.');
  }
  const keyDirectory = join(resolve(env.RUNNER_TEMP), 'india-gully-play-signing');
  const keyPath = join(keyDirectory, 'upload.jks');
  const outputDirectory = join(mobileRoot, 'release-output');
  const childEnv = { ...env, ANDROID_UPLOAD_KEYSTORE_PATH: keyPath };
  // Never let a failed run leave a previous AAB looking like its result.
  rmSync(outputDirectory, { recursive: true, force: true });
  mkdirSync(keyDirectory, { recursive: true, mode: 0o700 });
  try {
    writeFileSync(keyPath, decodeKeystore(env.ANDROID_UPLOAD_KEYSTORE_BASE64), { mode: 0o600, flag: 'wx' });
    const certificatePem = run('keytool', ['-exportcert', '-rfc', '-keystore', keyPath, '-alias', env.ANDROID_UPLOAD_KEY_ALIAS, '-storepass:env', 'ANDROID_UPLOAD_STORE_PASSWORD'], { env: childEnv });
    const certificate = new X509Certificate(certificatePem);
    validateCertificate(certificate, expectedFingerprint);
    const gradlePath = join(nativeRoot, 'app', 'build.gradle');
    writeFileSync(gradlePath, configureSigning(readFileSync(gradlePath, 'utf8')));
    run('./gradlew', ['bundleRelease', '--no-daemon', '--no-build-cache', '--max-workers=2', '-PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64'], { cwd: nativeRoot, env: childEnv, stdio: 'inherit' });
    const bundle = join(nativeRoot, 'app/build/outputs/bundle/release/app-release.aab');
    if (!existsSync(bundle)) throw new Error('Gradle did not produce the release app bundle.');
    // The supplied alias is trusted explicitly, so normal self-signed Android keys
    // are accepted while wrong signers and unsigned/tampered entries fail strict verification.
    const verification = run('jarsigner', ['-J-Duser.language=en', '-verify', '-strict', '-keystore', keyPath, '-storepass:env', 'ANDROID_UPLOAD_STORE_PASSWORD', bundle, env.ANDROID_UPLOAD_KEY_ALIAS], { env: childEnv });
    if (!/jar verified\./.test(verification)) throw new Error('The app bundle did not pass signature verification.');
    const bundleCertificate = run('keytool', ['-printcert', '-rfc', '-jarfile', bundle], { env: childEnv });
    validateCertificate(new X509Certificate(bundleCertificate), expectedFingerprint);
    run('python3', ['-c', 'import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert z.getinfo("base/assets/index.android.bundle").file_size > 0; assert z.getinfo("base/manifest/AndroidManifest.xml").file_size > 0; assert z.getinfo("BundleConfig.pb").file_size > 0', bundle]);
    mkdirSync(outputDirectory, { recursive: true });
    const bundleBytes = readFileSync(bundle);
    writeFileSync(join(outputDirectory, 'india-gully-play.aab'), bundleBytes);
    writeFileSync(join(outputDirectory, 'upload-certificate.pem'), certificate.toString());
    writeFileSync(join(outputDirectory, 'release-manifest.json'), `${JSON.stringify({ package: config.android.package, version: config.version, versionCode: config.android.versionCode, sourceCommit: env.GITHUB_SHA ?? null, uploadCertificateSha256: expectedFingerprint, bundleSha256: createHash('sha256').update(bundleBytes).digest('hex') }, null, 2)}\n`);
    console.log('Verified Play app bundle and public certificate written to release-output/. No app has been uploaded or published.');
  } finally {
    rmSync(keyDirectory, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { buildPlayBundle(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
