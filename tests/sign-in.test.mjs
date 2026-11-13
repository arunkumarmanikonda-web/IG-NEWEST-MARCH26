import test from 'node:test';
import assert from 'node:assert/strict';
import { accountDestination, finishSignIn, isStaff } from '../lib/sign-in.mjs';
const profile = { status: 'active', roles: ['owner'], policy_version: 'previously-accepted', must_change_password: false };
const verified = { accepted: true, verified: true, pending_invitation: false };
test('returning staff retain recorded acceptance and need either verified sign-in method', () => {
 assert.equal(accountDestination(profile, verified), '/admin');
 assert.equal(accountDestination(profile, { ...verified, verified: false }), '/login/verify');
 assert.equal(accountDestination(profile, { ...verified, accepted: false }), '/account');
 assert.equal(accountDestination({ ...profile, status: 'suspended' }, verified), '/account');
 assert.equal(accountDestination({ ...profile, must_change_password: true }, verified), '/account/security');
 assert.equal(accountDestination({ ...profile, roles: ['client'] }, verified), '/account');
 assert.equal(accountDestination({ ...profile, roles: ['client'] }, { ...verified, verified: false, pending_invitation: true }), '/login/verify');
 assert.equal(isStaff({ user_metadata: { roles: ['owner'] } }), false);
});
function clientFor(record = profile, status = verified, errors = {}, user = { id: 'verified-user', email_confirmed_at: 'now' }) {
 const calls = [];
 return { calls, auth: { getUser: async () => ({ data: { user } }) },
 from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: record }) }) }) }),
 rpc: async name => { calls.push(name); return { data: name === 'ig_signin_status' ? status : name === 'ig_accept_invitation' ? { accepted: true } : {}, error: errors[name] }; } };
}
test('existing staff skip invitation activation and route through protected permissions', async () => {
 const client = clientFor();
 assert.equal((await finishSignIn(client)).next, '/admin');
 assert.deepEqual(client.calls, ['ig_signin_status', 'ig_admin_overview']);
 const passwordOnly = clientFor(profile, { ...verified, verified: false });
 assert.equal((await finishSignIn(passwordOnly)).next, '/login/verify');
 assert.deepEqual(passwordOnly.calls, ['ig_signin_status']);
});
test('first registration, suspended users and recovery requirements stay enforced', async () => {
 for (const [record, status, next] of [
  [{ ...profile, roles: ['client'], policy_version: null }, { ...verified, accepted: false }, '/account'],
  [{ ...profile, status: 'suspended' }, verified, '/account'],
  [{ ...profile, must_change_password: true }, verified, '/account/security'],
 ]) assert.equal((await finishSignIn(clientFor(record, status))).next, next);
 await assert.rejects(() => finishSignIn(clientFor(profile, verified, {}, { id: 'unverified' })), error => error.status === 401);
});
test('invitation activation requires both recorded acceptance and verification', async () => {
 const invited = { ...profile, roles: ['client'] };
 const client = clientFor(invited, { ...verified, pending_invitation: true });
 assert.equal((await finishSignIn(client)).next, '/admin');
 assert.deepEqual(client.calls, ['ig_signin_status', 'ig_accept_invitation', 'ig_admin_overview']);
 for (const status of [{ ...verified, verified: false }, { ...verified, accepted: false }]) {
  const blocked = clientFor(invited, { ...status, pending_invitation: true });
  await finishSignIn(blocked);
  assert.ok(!blocked.calls.includes('ig_accept_invitation'));
 }
});
test('verification and permission failures never silently grant access', async () => {
 for (const name of ['ig_signin_status', 'ig_admin_overview']) {
  await assert.rejects(() => finishSignIn(clientFor(profile, verified, { [name]: { code: '42501' } })), error => error.status === 503);
 }
});
