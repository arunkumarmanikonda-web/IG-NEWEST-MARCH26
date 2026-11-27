import test from 'node:test';
import assert from 'node:assert/strict';
import { STAFF_APP_ENTRY_URL, CLIENT_APP_ENTRY_URL, CAREERS_APP_URL, websiteEntry, workspaceTarget } from '../src/workspace-navigation.ts';
import { parseReviewOrigin } from '../src/review-origin.ts';

const DEMO = 'https://workspace-demo.example.com';

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



test('signed storage redirects require external confirmation and cannot become a trusted app page', () => {
  const url = 'https://storage.example/storage/v1/object/sign/test.pdf?token=example';
  assert.deepEqual(workspaceTarget(url), { kind: 'external', url, host: 'storage.example' });
});


test('client and careers entries use fixed first-party destinations with distinct surfaces', () => {
  assert.equal(CLIENT_APP_ENTRY_URL, 'https://indiagully.com/login/mobile?audience=client');
  assert.equal(CAREERS_APP_URL, 'https://indiagully.com/careers');
  assert.equal(websiteEntry('client').url, CLIENT_APP_ENTRY_URL);
  assert.equal(websiteEntry('careers').url, CAREERS_APP_URL);
  assert.equal(websiteEntry('staff').url, STAFF_APP_ENTRY_URL);
  assert.notEqual(websiteEntry('client').label, websiteEntry('staff').label);
});



test('demo origin is absent by default and rejects unsafe or ambiguous build configuration', () => {
  assert.equal(parseReviewOrigin(undefined), null);
  assert.equal(parseReviewOrigin(''), null);
  assert.equal(parseReviewOrigin(DEMO), DEMO);
  assert.equal(parseReviewOrigin(`${DEMO}/`), DEMO);
  for (const value of ['http://demo.example.com', 'https://indiagully.com', 'https://www.indiagully.com',
    'https://user:secret@demo.example.com', 'https://demo.example.com:443', 'https://demo.example.com:8443',
    `${DEMO}/account`, `${DEMO}?token=secret`, `${DEMO}#staff`, `${DEMO}/../`,
    'https://localhost', 'https://test.localhost', 'https://127.0.0.1', 'https://[::1]',
    'https://demo.example.com.', 'https://DEMO.example.com', 'https://%64emo.example.com',
    'https://demo.example.com\\@evil.example', ` ${DEMO}`, `${DEMO}\n`, '//demo.example.com']) {
    assert.throws(() => parseReviewOrigin(value), /EXPO_PUBLIC_REVIEW_ORIGIN/, value);
  }
  assert.throws(() => websiteEntry('demo-client', null), /not configured/);
  assert.throws(() => websiteEntry('demo-staff', 'https://indiagully.com'), /EXPO_PUBLIC_REVIEW_ORIGIN/);
});

test('demo entries use the actual mobile login routes on their configured host', () => {
  for (const mode of ['demo-client', 'demo-staff'] as const) {
    const entry = websiteEntry(mode, DEMO);
    assert.equal(entry.origin, DEMO);
    assert.equal(entry.host, 'workspace-demo.example.com');
    assert.equal(entry.demo, true);
    assert.match(entry.title, /^Demo /);
    assert.match(entry.caption, /^Demo /);
    assert.equal(entry.url, `${DEMO}/login/mobile${mode === 'demo-client' ? '?audience=client' : ''}`);
    for (const path of ['/login', '/login/verify', '/account', '/admin', '/api/data-room/file?id=synthetic&mode=preview']) {
      assert.deepEqual(workspaceTarget(`${DEMO}${path}`, mode, DEMO), { kind: 'internal', url: `${DEMO}${path}` });
    }
  }
  assert.equal(websiteEntry('client', DEMO).url, CLIENT_APP_ENTRY_URL);
  assert.equal(websiteEntry('staff', DEMO).demo, false);
});

test('production and demo cannot navigate or export into each other', () => {
  for (const mode of ['staff', 'client', 'careers'] as const) {
    for (const suffix of ['/login', '/admin', '/account', '/api/data-room/file?id=1', '/?next=/account']) {
      assert.deepEqual(workspaceTarget(`${DEMO}${suffix}`, mode, DEMO), { kind: 'blocked' });
    }
    assert.deepEqual(workspaceTarget(`blob:${DEMO}/export`, mode, DEMO), { kind: 'blocked' });
  }
  for (const mode of ['demo-staff', 'demo-client'] as const) {
    for (const suffix of ['/login', '/admin', '/account', '/api/data-room/file?id=1', '/?next=/admin']) {
      assert.deepEqual(workspaceTarget(`https://indiagully.com${suffix}`, mode, DEMO), { kind: 'blocked' });
    }
    assert.deepEqual(workspaceTarget('blob:https://indiagully.com/export', mode, DEMO), { kind: 'blocked' });
    assert.deepEqual(workspaceTarget(`blob:${DEMO}/export`, mode, DEMO), { kind: 'export' });
    for (const value of [`${DEMO}.evil.example/admin`, `https://evil.example/?next=${DEMO}/admin`]) {
      assert.equal(workspaceTarget(value, mode, DEMO).kind, 'external');
    }
    for (const value of ['https://user:secret@workspace-demo.example.com/admin', `${DEMO}:444/admin`, `${DEMO}\\@evil.example/admin`, 'javascript:alert(1)', 'intent://admin', '/admin']) {
      assert.deepEqual(workspaceTarget(value, mode, DEMO), { kind: 'blocked' });
    }
  }
});



test('Gullu and public pages open inside the first-party shell on a fixed origin', () => {
  assert.equal(websiteEntry('gullu').url, 'https://indiagully.com/gullu/app');
  assert.equal(websiteEntry('public', null, '/contact?message=Hi').url, 'https://indiagully.com/contact?message=Hi');
  assert.equal(websiteEntry('public', null, 'https://outside.example/').url, 'https://indiagully.com');
  assert.equal(workspaceTarget(websiteEntry('gullu').url, 'gullu').kind, 'internal');
});
