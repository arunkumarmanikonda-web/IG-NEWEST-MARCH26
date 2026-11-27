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

test('mobile clients can read invoice status without contacting checkout or advertising services', async () => {
  const ios = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
  const ipad = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15';
  const android = 'Mozilla/5.0 (Linux; Android 15; Pixel; wv) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36';
  for (const headers of [{'user-agent': ios}, {'user-agent': ipad}, {'user-agent': android}, {cookie: 'ig_mobile_workspace=1'}]) {
    const send = path => proxy(new NextRequest('https://indiagully.com' + path, {headers}));
    const response = await send('/account/payments?invoice=private');
    assert.equal(response.headers.get('location'), 'https://indiagully.com/account/payment-status');
    for (const path of ['/api/payments', '/api/admin/payments', '/api/admin/collections']) {
      assert.ok(matches(path));
      assert.equal((await send(path)).status, 403);
    }
    assert.ok(matches('/api/advertising/event'));
    assert.equal((await send('/api/advertising/event')).status, 204);
    assert.doesNotMatch((await send('/careers')).headers.get('content-security-policy'), /razorpay/i);
  }
  const safari = ios + ' Version/26.0 Safari/605.1.15';
  for (const path of ['/api/payments', '/api/admin/collections', '/api/webhooks/razorpay']) {
    const res = await proxy(new NextRequest('https://indiagully.com'+path, {headers:{'user-agent': safari}}));
    assert.equal(res.headers.get('x-middleware-next'), '1');
  }
});
