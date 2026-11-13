import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticatorFactors } from '../lib/auth-factors.mjs';
test('pending authenticator survives the SDK verified-only TOTP collection', () => {
  const pending = { id: 'pending', factor_type: 'totp', status: 'unverified', friendly_name: 'Phone app' };
  assert.deepEqual(authenticatorFactors({ all: [pending], totp: [] }), [{ id: 'pending', status: 'unverified', friendly_name: 'Phone app' }]);
});
test('authenticator controls exclude other methods and do not copy extra provider fields', () => {
  const data = { all: [{ id: 'valid', factor_type: 'totp', status: 'verified', friendly_name: 'App', extra: 'not needed' }, { id: 'phone', factor_type: 'phone', status: 'verified' }, { id: 'invalid', factor_type: 'totp', status: 'unknown' }] };
  assert.deepEqual(authenticatorFactors(data), [{ id: 'valid', friendly_name: 'App', status: 'verified' }]);
  assert.deepEqual(authenticatorFactors(null), []);
});
