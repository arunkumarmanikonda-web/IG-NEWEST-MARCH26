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

test('public HTML receives fresh nonces without being marked private to search engines', async () => {
  for(const path of ['/', '/about', '/insights', '/valuation', '/horeca', '/?q=%5C']) {
    assert.equal(matches(path),true,path);
    const first=await proxy(new NextRequest('https://indiagully.com'+path));
    const second=await proxy(new NextRequest('https://indiagully.com'+path));
    assert.match(first.headers.get('Content-Security-Policy'),/nonce-/);
    assert.notEqual(first.headers.get('Content-Security-Policy'),second.headers.get('Content-Security-Policy'));
    assert.equal(first.headers.get('X-Robots-Tag'),null);
  }
  for(const path of ['/robots.txt','/sitemap.xml','/favicon.ico','/_next/static/app.js','/images/city.jpg'])assert.equal(matches(path),false,path);
});

test('existing private routes still match the authentication proxy', () => {
  for (const path of ['/admin', '/admin/settings', '/account', '/account/security', '/login', '/register', '/auth/callback', '/api/portal/auth']) {
    assert.equal(matches(path), true, path);
  }
});
