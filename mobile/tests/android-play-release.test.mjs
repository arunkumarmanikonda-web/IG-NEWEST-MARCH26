import assert from 'node:assert/strict';
import test from 'node:test';
import { configureSigning, decodeKeystore, fingerprint, signingEnvironment, validateCertificate, validateEnvironment } from '../scripts/android-play-release.mjs';

const sha = 'AB'.repeat(32);
const env = { ANDROID_UPLOAD_KEYSTORE_BASE64: 'fixture', ANDROID_UPLOAD_STORE_PASSWORD: 'store-placeholder', ANDROID_UPLOAD_KEY_ALIAS: 'upload', ANDROID_UPLOAD_KEY_PASSWORD: 'key-placeholder', ANDROID_UPLOAD_CERTIFICATE_SHA256: sha, RUNNER_TEMP: '/tmp/play-release-test' };

test('missing credentials fail closed instead of using the Expo debug key', () => {
  for (const key of ['ANDROID_UPLOAD_KEYSTORE_BASE64', 'ANDROID_UPLOAD_STORE_PASSWORD', 'ANDROID_UPLOAD_KEY_ALIAS', 'ANDROID_UPLOAD_KEY_PASSWORD', 'ANDROID_UPLOAD_CERTIFICATE_SHA256', 'RUNNER_TEMP']) {
    assert.throws(() => validateEnvironment({ ...env, [key]: '' }));
  }
  assert.throws(() => validateEnvironment({ ...env, ANDROID_UPLOAD_KEY_ALIAS: 'androiddebugkey' }), /development key/);
  assert.throws(() => validateEnvironment({ ...env, ANDROID_UPLOAD_KEY_ALIAS: '  AndroidDebugKey  ' }), /development key/);
  assert.throws(() => validateEnvironment({ ...env, ANDROID_UPLOAD_STORE_PASSWORD: '   ' }), /Missing production/);
  assert.equal(validateEnvironment(env), sha);
});

test('certificate identity must be explicitly pinned', () => {
  assert.equal(fingerprint(sha.match(/../g).join(':').toLowerCase()), sha);
  assert.throws(() => fingerprint('not-a-sha256'));
  const certificate = { subject: 'CN=India Gully Upload', fingerprint256: sha, validFrom: 'Jan 1 2026 GMT', validTo: 'Jan 1 2056 GMT' };
  const now = Date.parse('2026-11-26');
  assert.doesNotThrow(() => validateCertificate(certificate, sha, now));
  assert.throws(() => validateCertificate({ ...certificate, subject: 'CN=Android Debug\nO=Android\nC=US' }, sha, now), /development certificate/);
  assert.throws(() => validateCertificate(certificate, 'CD'.repeat(32), now), /does not match/);
  assert.throws(() => validateCertificate({ ...certificate, validTo: 'Jan 1 2025 GMT' }, sha, now), /not currently valid/);
});

test('malformed or empty keystore encoding is rejected', () => {
  for (const value of ['', '!!', 'Zg==', 'A'.repeat(401)]) assert.throws(() => decodeKeystore(value));
  const bytes = Buffer.alloc(256, 3);
  assert.deepEqual(decodeKeystore(`${bytes.toString('base64')}\n`), bytes);
});

test('production signing overrides the template without placing credentials in Gradle', () => {
  const template = 'apply plugin: "com.android.application"\nandroid { defaultConfig { applicationId "com.indiagully.app" } buildTypes { release { signingConfig signingConfigs.debug } } }';
  const result = configureSigning(template);
  assert.match(result, /signingConfig signingConfigs\.indiaGullyUpload/);
  assert.match(result, /debuggable false/);
  assert.match(result, /storePassword System\.getenv\("ANDROID_UPLOAD_STORE_PASSWORD"\)/);
  assert.ok(result.lastIndexOf('signingConfig signingConfigs.indiaGullyUpload') > result.indexOf('signingConfig signingConfigs.debug'));
  assert.throws(() => configureSigning(result), /clean Expo prebuild/);
  assert.throws(() => configureSigning(template.replace('com.indiagully.app', 'com.other.app')), /Unexpected Android/);
  assert.throws(() => configureSigning('unrecognized template'), /Unexpected Android/);
});


test('atomic bundle is validated without exposing malformed JSON or accepting mismatched pins', () => {
  const bundle = JSON.stringify({ schemaVersion: 1, ...env });
  const resolved = signingEnvironment({ ANDROID_UPLOAD_SIGNING_BUNDLE: bundle, ANDROID_UPLOAD_CERTIFICATE_SHA256: sha });
  assert.equal(resolved.ANDROID_UPLOAD_STORE_PASSWORD, env.ANDROID_UPLOAD_STORE_PASSWORD);
  assert.equal(resolved.ANDROID_UPLOAD_SIGNING_BUNDLE, undefined);
  assert.throws(() => signingEnvironment({}), /Missing atomic/);
  assert.throws(() => signingEnvironment({ ANDROID_UPLOAD_SIGNING_BUNDLE: 'PRIVATE_SECRET_BAD_JSON' }), (error) => !error.message.includes('PRIVATE_SECRET'));
  assert.throws(() => signingEnvironment({ ANDROID_UPLOAD_SIGNING_BUNDLE: bundle, ANDROID_UPLOAD_CERTIFICATE_SHA256: 'CD'.repeat(32) }), /does not match/);
  assert.throws(() => signingEnvironment({ ANDROID_UPLOAD_SIGNING_BUNDLE: '{"schemaVersion":1}', ANDROID_UPLOAD_CERTIFICATE_SHA256: sha }), /invalid schema/);
});

test('all extracted credential fragments are masked before build output', () => {
  const captured = [];
  const original = console.log;
  try {
    console.log = (message) => captured.push(message);
    signingEnvironment({ GITHUB_ACTIONS: 'true', ANDROID_UPLOAD_SIGNING_BUNDLE: JSON.stringify({ schemaVersion: 1, ...env }), ANDROID_UPLOAD_CERTIFICATE_SHA256: sha });
  } finally { console.log = original; }
  for (const name of ['ANDROID_UPLOAD_KEYSTORE_BASE64', 'ANDROID_UPLOAD_STORE_PASSWORD', 'ANDROID_UPLOAD_KEY_ALIAS', 'ANDROID_UPLOAD_KEY_PASSWORD']) {
    assert.ok(captured.includes(`::add-mask::${env[name]}`));
  }
});
