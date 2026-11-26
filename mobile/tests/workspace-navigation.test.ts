import test from 'node:test';
import assert from 'node:assert/strict';
import { STAFF_APP_ENTRY_URL, CLIENT_APP_ENTRY_URL, CAREERS_APP_URL, websiteEntry, workspaceBrowserPage, workspaceTarget } from '../src/workspace-navigation.ts';

test('staff entry is a fixed first-party session reset, independent of feed links', () => {
  assert.equal(STAFF_APP_ENTRY_URL, 'https://indiagully.com/login/mobile');
  for (const path of ['/login', '/login/verify', '/account/security', '/admin', '/admin/data-rooms', '/api/data-room/file?id=123&mode=preview']) {
    assert.deepEqual(workspaceTarget(`https://indiagully.com${path}`), { kind: 'internal', url: `https://indiagully.com${path}` });
  }
});

test('external navigation and popup targets never become internal via host confusion', () => {
  for (const value of ['https://indiagully.com.evil.example/admin', 'https://evil.example/?next=https://indiagully.com/admin', 'https://www.indiagully.com/admin']) {
    assert.equal(workspaceTarget(value).kind, 'external');
  }
  for (const value of ['http://indiagully.com/admin', 'https://user:pass@indiagully.com/admin', 'https://indiagully.com:444/admin', 'intent://admin', 'file:///data/user/session', 'javascript:alert(1)', 'data:text/html,test', 'about:blank', '//indiagully.com/admin', '/admin', 'https://indiagully.com\n.evil.example', 'https://indiagully.com/ admin']) {
    assert.deepEqual(workspaceTarget(value), { kind: 'blocked' }, value);
  }
});

test('mailbox consent restarts at the first-party page without leaking bound OAuth state', () => {
  const target = workspaceTarget('https://accounts.google.com/o/oauth2/v2/auth?state=private-state&code_challenge=private-challenge');
  assert.deepEqual(target, { kind: 'mailbox', url: 'https://indiagully.com/admin/mailbox' });
  assert.equal(JSON.stringify(target).includes('private-'), false);
  assert.equal(workspaceTarget('https://accounts.google.com.evil.example/').kind, 'external');
});

test('blob exports can only fall back to a known workspace page, never API or callback state', () => {
  assert.deepEqual(workspaceTarget('blob:https://indiagully.com/abc-123'), { kind: 'export' });
  assert.deepEqual(workspaceTarget('blob:https://evil.example/abc-123'), { kind: 'blocked' });
  assert.equal(workspaceBrowserPage('https://indiagully.com/admin/leasing?view=brands'), 'https://indiagully.com/admin/leasing?view=brands');
  for (const input of ['https://indiagully.com/api/mailbox/callback?state=secret', 'https://indiagully.com/api/data-room/file?id=private', 'https://evil.example/admin', 'javascript:alert(1)']) {
    assert.equal(workspaceBrowserPage(input), 'https://indiagully.com/admin');
  }
});

test('signed storage redirects require external confirmation and cannot become a trusted app page', () => {
  const url = 'https://storage.example/storage/v1/object/sign/test.pdf?token=example';
  assert.deepEqual(workspaceTarget(url), { kind: 'external', url, host: 'storage.example' });
  assert.equal(workspaceBrowserPage(url), 'https://indiagully.com/admin');
});


test('client and careers entries use fixed first-party destinations with distinct surfaces', () => {
  assert.equal(CLIENT_APP_ENTRY_URL, 'https://indiagully.com/login/mobile?audience=client');
  assert.equal(CAREERS_APP_URL, 'https://indiagully.com/careers');
  assert.equal(websiteEntry('client').url, CLIENT_APP_ENTRY_URL);
  assert.equal(websiteEntry('careers').url, CAREERS_APP_URL);
  assert.equal(websiteEntry('staff').url, STAFF_APP_ENTRY_URL);
  assert.notEqual(websiteEntry('client').label, websiteEntry('staff').label);
});

test('browser fallbacks preserve the selected surface without moving callback or private request state', () => {
  assert.equal(workspaceBrowserPage('https://indiagully.com/account/data-rooms', 'client'), 'https://indiagully.com/account/data-rooms');
  assert.equal(workspaceBrowserPage('https://indiagully.com/admin', 'client'), 'https://indiagully.com/account');
  assert.equal(workspaceBrowserPage('https://indiagully.com/careers/business-development', 'careers'), 'https://indiagully.com/careers/business-development');
  assert.equal(workspaceBrowserPage('https://indiagully.com/account', 'careers'), 'https://indiagully.com/careers');
  for (const mode of ['staff', 'client', 'careers'] as const) {
    const fallback = `https://indiagully.com/${mode === 'staff' ? 'admin' : mode === 'client' ? 'account' : 'careers'}`;
    for (const value of ['https://indiagully.com/api/careers/apply', 'https://indiagully.com/account?token=private', 'https://indiagully.com/careers?next=https://evil.example', 'https://evil.example/account', 'data:text/html,test']) {
      assert.equal(workspaceBrowserPage(value, mode), fallback);
    }
  }
});
