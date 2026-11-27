import { createPrivateKey, createPublicKey, createHash, sign, X509Certificate } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const { SIGNING_SECRET, ASC_KEY_ID, ASC_ISSUER_ID, SIGNING_DIRECTORY } = process.env;
if (!SIGNING_SECRET || !/^[A-Z0-9]{10}$/.test(ASC_KEY_ID || '') ||
    !/^[a-f0-9-]{36}$/i.test(ASC_ISSUER_ID || '')) {
  throw new Error('The iOS production environment and App Store Connect identifiers are required.');
}
const secret = JSON.parse(SIGNING_SECRET);
const fromDer = value => createPrivateKey({ key: Buffer.from(value, 'base64'), type: 'pkcs8', format: 'der' });
const apiKey = fromDer(secret.p8);
const distributionKey = fromDer(secret.distribution);
const encode = object => Buffer.from(JSON.stringify(object)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const message = encode({ alg: 'ES256', kid: ASC_KEY_ID, typ: 'JWT' }) + '.' +
  encode({ iss: ASC_ISSUER_ID, iat: now - 10, exp: now + 600, aud: 'appstoreconnect-v1' });
const jwt = message + '.' + sign('sha256', Buffer.from(message), { key: apiKey, dsaEncoding: 'ieee-p1363' }).toString('base64url');
const url = new URL('https://api.appstoreconnect.apple.com/v1/profiles');
url.searchParams.set('filter[name]', 'India Gully App Store');
url.searchParams.set('include', 'bundleId,certificates');
url.searchParams.set('fields[profiles]', 'name,profileType,profileState,profileContent,uuid,bundleId,certificates');
url.searchParams.set('fields[bundleIds]', 'identifier');
url.searchParams.set('fields[certificates]', 'certificateContent');
const reply = await fetch(url, { headers: { Authorization: 'Bearer ' + jwt }, redirect: 'error', signal: AbortSignal.timeout(30000) });
const result = await reply.json();
if (!reply.ok) throw new Error('Apple profile lookup returned ' + reply.status + ': ' + (result.errors || []).map(e => e.code + ' ' + e.detail).join(', ').slice(0,500));
const matches = (result.data || []).filter(p => p.attributes.name === 'India Gully App Store' &&
  p.attributes.profileType === 'IOS_APP_STORE' && p.attributes.profileState === 'ACTIVE' &&
  result.included?.some(ref => ref.type === 'bundleIds' && ref.id === p.relationships.bundleId.data.id && ref.attributes.identifier === 'com.indiagully.app'));
if (matches.length !== 1) throw new Error('Expected one active App Store profile for com.indiagully.app, found ' + matches.length);
const profile = matches[0];
const fingerprint = key => createHash('sha256').update(key.export({ type: 'spki', format: 'der' })).digest('hex');
const matchingCert = result.included.find(ref => ref.type === 'certificates' &&
  profile.relationships.certificates.data.some(cert => cert.id === ref.id) && ref.attributes.certificateContent &&
  fingerprint(new X509Certificate(Buffer.from(ref.attributes.certificateContent, 'base64')).publicKey) === fingerprint(createPublicKey(distributionKey)));
if (!matchingCert) throw new Error('The distribution key does not match the profile certificate.');
const save = (name, value) => writeFileSync(join(SIGNING_DIRECTORY, name), value, { mode: 0o600, flag: 'wx' });
save('AuthKey_' + ASC_KEY_ID + '.p8', apiKey.export({type:'pkcs8',format:'pem'}));
save('distribution.key', distributionKey.export({type:'pkcs8',format:'pem'}));
save('distribution.cer', Buffer.from(matchingCert.attributes.certificateContent, 'base64'));
save('IndiaGully.mobileprovision', Buffer.from(profile.attributes.profileContent, 'base64'));
console.log('Verified Apple distribution profile for com.indiagully.app.');
