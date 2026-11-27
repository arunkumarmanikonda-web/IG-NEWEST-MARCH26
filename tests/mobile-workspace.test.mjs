import test from 'node:test';
import assert from 'node:assert/strict';
import { isMobileShell, mobileStaffDestination } from '../lib/mobile-workspace.mjs';

test('the mobile entry, its session, and Android WebViews use the same staff workspace', () => {
  assert.equal(isMobileShell('/login/mobile', undefined, 'Chrome'), true);
  assert.equal(isMobileShell('/admin', '1', 'Chrome'), true);
  assert.equal(isMobileShell('/careers', undefined, 'Mozilla/5.0 (Linux; Android 15; Pixel; wv)'), true);
  assert.equal(isMobileShell('/admin', undefined, 'Mozilla/5.0 (Linux; Android 15; Pixel) Chrome'), false);
});
test('operational screens route into the app and owner functions direct staff to the website', () => {
  for (const view of ['listings', 'catalogue', 'horeca', 'procurement', 'collections']) {
    assert.equal(mobileStaffDestination('/admin/' + view), '/staff-workspace?view=' + view);
  }
  const id = '329b5d27-1d5b-4f2e-98a3-895aa3abd6ba';
  assert.equal(mobileStaffDestination('/admin/content/' + id), '/staff-workspace?record=' + id);
  for (const view of ['users', 'privacy', 'settings', 'payments', 'data-rooms', 'content/new', 'unlisted/future']) {
    assert.equal(mobileStaffDestination('/admin/' + view), '/staff-workspace?view=website');
  }
  for (const path of ['/account', '/login', '/administer', '/staff-workspace']) assert.equal(mobileStaffDestination(path), null);
});
