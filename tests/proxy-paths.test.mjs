import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server.js';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server.js';
import { config, proxy } from '../proxy.js';

const matches = path => unstable_doesMiddlewareMatch({
  config, nextConfig: {}, url: `https://indiagully.com${path}`,
});

test('encoded-backslash requests are intercepted and return a non-cacheable 404', async () => {
  for (const path of ['/%5C', '/about%5c', '/insights%5C', '/valuation%5C', '/admin%5C', '/auth/callback%5C', '/a%5Cb']) {
    assert.equal(matches(path), true, path);
    const response = await proxy(new NextRequest(`https://indiagully.com${path}`));
    assert.equal(response.status, 404, path);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
    assert.equal(await response.text(), 'Not found');
  }
});

test('normal public routes, assets and query strings still skip the auth proxy', () => {
  for (const path of ['/', '/about', '/insights', '/valuation', '/horeca', '/robots.txt', '/sitemap.xml', '/favicon.ico', '/_next/static/app.js', '/?q=%5C']) {
    assert.equal(matches(path), false, path);
  }
});

test('existing private routes still match the authentication proxy', () => {
  for (const path of ['/admin', '/admin/settings', '/account', '/account/security', '/login', '/register', '/auth/callback', '/api/portal/auth']) {
    assert.equal(matches(path), true, path);
  }
});
