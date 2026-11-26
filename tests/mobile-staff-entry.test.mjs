import test from 'node:test';
import assert from 'node:assert/strict';
import { createMobileStaffEntry } from '../lib/mobile-staff-entry.mjs';
import { finishSignOut } from '../lib/sign-in.mjs';

const ok = () => ({ ok: true, redirected: false, json: async () => ({ ok: true }) });

test('mobile entry resets only its own session and cannot choose a role or redirect', async () => {
  const calls = [];
  const entry = createMobileStaffEntry(async (url, options) => { calls.push({ url, options }); return { ...ok(), json: async () => ({ ok: true, next: 'https://evil.example/admin' }) }; });
  assert.equal(await entry.start(), '/login');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/portal/auth');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.credentials, 'same-origin');
  assert.equal(calls[0].options.redirect, 'error');
  assert.deepEqual(JSON.parse(calls[0].options.body), { action: 'signout_local' });
});

test('effect replay shares one reset and a completed reset is never replayed', async () => {
  let complete, calls = 0;
  const entry = createMobileStaffEntry(() => { calls++; return new Promise(resolve => { complete = resolve; }); });
  const first = entry.start();
  assert.equal(first, entry.start());
  assert.equal(first, entry.retry());
  complete(ok());
  assert.equal(await first, '/login');
  assert.equal(await entry.retry(), '/login');
  assert.equal(calls, 1);
});

test('network, server, redirect and malformed responses never enter the workspace', async () => {
  for (const fetcher of [
    async () => { throw new Error('offline'); },
    async () => ({ ...ok(), ok: false }),
    async () => ({ ...ok(), redirected: true }),
    async () => ({ ...ok(), json: async () => { throw new Error('invalid JSON'); } }),
    async () => ({ ...ok(), json: async () => ({ ok: false, next: '/admin' }) }),
    async () => ({ ...ok(), json: async () => ({ next: '/admin' }) }),
  ]) await assert.rejects(createMobileStaffEntry(fetcher).start(), /couldn't start a fresh staff sign-in/);
});

test('retry is explicit after failure and replays no completed session reset', async () => {
  let calls = 0;
  const entry = createMobileStaffEntry(async () => { if (++calls === 1) throw new Error('offline'); return ok(); });
  await assert.rejects(entry.start());
  await assert.rejects(entry.start());
  assert.equal(calls, 1);
  assert.equal(await entry.retry(), '/login');
  assert.equal(calls, 2);
});

test('unresponsive entry aborts after its bounded timeout', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const entry = createMobileStaffEntry((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted')))));
  const result = entry.start();
  context.mock.timers.tick(15_000);
  await assert.rejects(result, /couldn't start/);
});

test('session-local sign-out preserves separately signed-in devices', async () => {
  const sessions = new Set(['mobile', 'browser', 'other-device']);
  const client = { auth: { signOut: async ({ scope }) => { if (scope === 'local') sessions.delete('mobile'); else sessions.clear(); return { error: null }; } } };
  assert.deepEqual(await finishSignOut(client, 'signout_local'), { ok: true });
  assert.deepEqual([...sessions], ['browser', 'other-device']);
  assert.deepEqual(await finishSignOut(client, 'signout'), { ok: true });
  assert.equal(sessions.size, 0);
});

test('sign-out errors fail closed and invalid actions cannot select an auth scope', async () => {
  await assert.rejects(finishSignOut({ auth: { signOut: async () => ({ error: { message: 'network failure' } }) } }, 'signout_local'), error => error.status === 503);
  let called = false;
  await assert.rejects(finishSignOut({ auth: { signOut: async () => { called = true; } } }, 'other'), /Unsupported/);
  assert.equal(called, false);
});
