import test from 'node:test';
import assert from 'node:assert/strict';
import { emailVerification, verifyEmailCode } from '../lib/email-auth.mjs';

test('email verification rejects alternate auth purposes and malformed codes before calling the provider', async () => {
  let calls = 0;
  const auth = { verifyOtp: async () => { calls++; return {}; } };
  for (const change of [{ purpose: 'invite' }, { purpose: 'email_change' }, { purpose: 'sms' }, { token: '' }, { token: 123456 }, { token: '12345x' }, { email: 'bad' }]) {
    await assert.rejects(() => verifyEmailCode(auth, { email: 'user@example.com', token: '123456', purpose: 'email', ...change }));
  }
  assert.equal(calls, 0);
});
test('invalid or incomplete provider responses never grant a destination or expose provider details', async () => {
  for (const result of [{ error: { message: 'private internal error' } }, { data: { session: {}, user: {} } }, { data: { user: { email_confirmed_at: 'now' } } }]) {
    await assert.rejects(() => verifyEmailCode({ verifyOtp: async () => result }, { email: 'user@example.com', token: '123456', purpose: 'email' }), error => error.status === 401 && !error.message.includes('private'));
  }
});
test('recovery has a fixed security destination and uses the recovery token type', async () => {
  let received;
  const auth = { verifyOtp: async value => { received = value; return { data: { session: { access_token: 'not-returned' }, user: { email_confirmed_at: 'now' } } }; } };
  const result = await verifyEmailCode(auth, { email: ' USER@example.com ', token: ' 123456 ', purpose: 'recovery', next: 'https://evil.example' });
  assert.deepEqual(received, { email: 'user@example.com', token: '123456', type: 'recovery' });
  assert.deepEqual(result, { ok: true, next: '/account/security' });
  assert.equal(emailVerification({ email: 'user@example.com', token: '123456', purpose: 'email' }).type, 'email');
});
