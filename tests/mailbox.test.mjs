import test from 'node:test';import assert from 'node:assert/strict';import {mailboxConfig,normaliseMessage,messageHash,mimeMessage,threadView} from '../lib/mailbox.mjs';
test('Mailbox remains disabled without explicit enablement and needs fixed HTTPS callback',()=>{assert.equal(mailboxConfig({}).enabled,false);assert.throws(()=>mailboxConfig({GOOGLE_MAIL_ENABLED:'true',GOOGLE_OAUTH_REDIRECT_URI:'http://example.com/api/mailbox/callback',GOOGLE_CLIENT_ID:'x',GOOGLE_CLIENT_SECRET:'y'}));});
test('Outbound headers reject injection and message identity binds exact content',()=>{const m={to:' CLIENT@EXAMPLE.COM ',subject:'Quotation ₹',text:'Dear client,\nHere is the requested update.'};assert.equal(normaliseMessage(m).to,'client@example.com');assert.throws(()=>normaliseMessage({...m,to:'x@example.com\r\nBcc: other@example.com'}));assert.throws(()=>normaliseMessage({...m,subject:'Hi\nBcc: x'}));assert.notEqual(messageHash(m),messageHash({...m,text:'Changed'}));const raw=Buffer.from(mimeMessage('akm@indiagully.com',m,'11111111-1111-4111-8111-111111111111'),'base64url').toString();assert.match(raw,/Content-Type: text\/plain/);assert.match(raw,/To: client@example.com/);});
test('Mailbox thread preview extracts plain text without rendering active HTML',()=>{const t=threadView({id:'a',messages:[{id:'b',snippet:'Fallback',payload:{mimeType:'multipart/alternative',parts:[{mimeType:'text/html',body:{data:Buffer.from('<img src=x onerror=alert(1)>').toString('base64url')}},{mimeType:'text/plain',body:{data:Buffer.from('Safe text').toString('base64url')}}]}}]});assert.equal(t.messages[0].text,'Safe text');});

test('Owner-managed Google mail keeps credentials paired and honours disabling', async () => {
  const {validateIntegration} = await import('../lib/integration-spec.mjs');
  const env = {VERCEL_ENV:'production', GOOGLE_MAIL_ENABLED:'true', GOOGLE_CLIENT_ID:'env-id', GOOGLE_CLIENT_SECRET:'env-secret', GOOGLE_OAUTH_REDIRECT_URI:'https://indiagully.com/api/mailbox/callback'};
  const settings = {client_id:'1234-test.apps.googleusercontent.com'};
  const storedSecrets = {client_secret:'unit-test-secret'};
  const saved = {version:2, mode:'enabled', settings, storedSecrets};
  assert.equal(mailboxConfig(env, {...saved, version:1}).clientId, 'env-id');
  assert.equal(mailboxConfig(env, saved).clientSecret, storedSecrets.client_secret);
  assert.equal(mailboxConfig(env, {...saved, mode:'disabled'}).enabled, false);
  assert.equal(mailboxConfig({...env, VERCEL_ENV:'preview'}, saved).enabled, false);
  assert.throws(() => mailboxConfig(env, {...saved, storedSecrets:{}}));
  assert.deepEqual(validateIntegration('google_mail', 'enabled', settings, storedSecrets), settings);
  assert.throws(() => validateIntegration('google_mail', 'enabled', {client_id:'copied-wrong-value'}, storedSecrets));
  assert.throws(() => validateIntegration('google_mail', 'enabled', settings, {}));
});
