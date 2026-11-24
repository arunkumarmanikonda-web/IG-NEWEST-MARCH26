import test from 'node:test';
import assert from 'node:assert/strict';
import { STAFF_SIGN_IN_URL, canonicalUrl, deepLinkUrl, enquiryUrl, filterEntries, parseCatalogue, parseSaved, plainText, reconcileSaved } from '../src/domain.ts';

const raw = {
  schema_version: 1, generated_at: '2026-11-19T10:00:00.000Z',
  listings: [{ id: 'sale1', kind: 'opportunity', title: 'Sohna property', city: 'Sohna', href: '/opportunities/sohna', tags: ['Residential'], private_data: { email: 'do-not-store@example.com' } }, { id: 'lease1', kind: 'retail_space', title: 'Office for lease', city: 'Gurugram', href: '/retail-leasing/promoter/office' }, { id: 'brand1', kind: 'retail_requirement', title: 'Cafe requirement', city: 'Delhi', href: '/retail-leasing/brand/cafe' }],
  products: [{ id: 'product1', title: 'Table lamp', sku: 'LAMP-12', category: 'lighting', href: '/horeca/products/lamp', brand: 'Our supplier' }],
  perspectives: [{ id: 'article1', title: 'Hospitality insights', href: '/insights/hospitality', body: '<p>A thoughtful perspective.</p>' }],
  practices: [{ slug: 'real-estate', title: 'Real estate', intro: 'Our advisory practice.', href: '/practices/real-estate' }],
  categories: [{ id: 'lighting', title: 'Lighting', image: '/images/lighting.webp', href: '/horeca?category=lighting', count: 1 }],
  residences: { title: 'India Gully Residences', headline: 'Signature residential floors', location: 'Sector 35, Sohna', href: '/residences', image: '/images/residences.webp' },
};

test('public feed normalizes all native entry types without persisting private fields', () => {
  const feed = parseCatalogue(raw);
  assert.deepEqual(feed.listings.map(x => x.kind), ['opportunity', 'promoter', 'brand']);
  assert.equal(feed.products[0].sku, 'LAMP-12');
  assert.equal(feed.practices[0].id, 'real-estate');
  assert.equal(feed.residences?.href, 'https://indiagully.com/residences');
  assert.ok(!JSON.stringify(feed).includes('do-not-store'));
  assert.ok(!JSON.stringify(feed).includes('private_data'));
});
test('malformed or unknown schema fails rather than displaying incorrect data', () => {
  assert.throws(() => parseCatalogue({ ...raw, schema_version: 2 }));
  assert.throws(() => parseCatalogue({ ...raw, generated_at: 'not-a-date' }));
  assert.throws(() => parseCatalogue({ ...raw, listings: null }));
  assert.throws(() => parseCatalogue({ ...raw, listings: Array.from({ length: 5001 }, () => raw.listings[0]) }));
});
test('only exact HTTPS first-party public and account destinations are accepted', () => {
  assert.equal(canonicalUrl('/opportunities/sohna'), 'https://indiagully.com/opportunities/sohna');
  assert.equal(canonicalUrl('/account'), 'https://indiagully.com/account');
  for (const input of ['https://evil.example/one', '//evil.example/a', 'http://indiagully.com/opportunities/a', 'https://indiagully.com.evil.example/a', 'https://user:pass@indiagully.com/opportunities/a', 'javascript:alert(1)', '/admin', '/api/admin/records', '/account?next=https://evil.example', '/opportunities/%2e%2e/admin', '/opportunities\\..\\admin']) assert.equal(canonicalUrl(input), null, input);
});
test('images use a separate narrow first-party media allowlist', () => {
  assert.equal(canonicalUrl('/images/library/source.jpg', true), 'https://indiagully.com/images/library/source.jpg');
  assert.equal(canonicalUrl('/api/admin/source-media/1', true), null);
  assert.equal(canonicalUrl('data:image/svg+xml,<svg/>', true), null);
  assert.equal(canonicalUrl('https://untrusted.example/image.jpg', true), null);
});
test('custom deep links cannot escape the first-party route allowlist', () => {
  assert.equal(deepLinkUrl('indiagully://opportunities/sohna'), 'https://indiagully.com/opportunities/sohna');
  assert.equal(deepLinkUrl('indiagully://retail-leasing/brand/cafe'), 'https://indiagully.com/retail-leasing/brand/cafe');
  assert.equal(deepLinkUrl('indiagully://evil.example/path'), null);
  assert.equal(deepLinkUrl('indiagully://admin'), null);
  assert.equal(deepLinkUrl('indiagully://user@opportunities/a'), null);
});
test('staff sign-in uses the fixed verified website flow without admitting admin catalogue or deep links', () => {
  assert.equal(canonicalUrl(STAFF_SIGN_IN_URL), 'https://indiagully.com/login');
  assert.equal(canonicalUrl('/admin'), null);
  assert.equal(canonicalUrl('/admin/login'), null);
  assert.equal(deepLinkUrl('indiagully://admin/login'), null);
  assert.throws(() => parseCatalogue({ ...raw, listings: [{ id: 'admin', title: 'Injected admin entry', href: '/admin' }] }));
  const feed = parseCatalogue({ ...raw, links: { staff: 'https://evil.example/login' } });
  assert.ok(!JSON.stringify(feed).includes('evil.example'));
});
test('search combines text, location, mandate type and SKU collection correctly', () => {
  const feed = parseCatalogue(raw);
  assert.equal(filterEntries(feed.listings, 'office', 'promoter', 'Gurugram').length, 1);
  assert.equal(filterEntries(feed.listings, 'office', 'brand').length, 0);
  assert.equal(filterEntries(feed.products, 'lamp-12', 'all', 'all', 'lighting').length, 1);
  assert.equal(filterEntries(feed.products, 'lamp-12', 'all', 'all', 'crockery').length, 0);
});
test('saved briefs survive cache round trips with honest timestamps', () => {
  const feed = parseCatalogue(raw), now = '2026-11-19T11:00:00.000Z';
  const saved = parseSaved([{ entry: feed.listings[0], saved_at: now, cached_at: feed.generated_at, withdrawn: false }]);
  assert.equal(saved.length, 1); assert.equal(saved[0].saved_at, now); assert.equal(saved[0].entry.kind, 'opportunity');
  assert.equal(parseCatalogue(JSON.parse(JSON.stringify(feed))).products[0].sku, 'LAMP-12');
  assert.deepEqual(parseSaved([{ entry: {}, saved_at: now }]), []);
});
test('online refresh removes unpublished body and imagery from offline shortlist', () => {
  const feed = parseCatalogue(raw), now = '2026-11-19T11:00:00.000Z';
  const entry = { ...feed.listings[0], body: 'Old commercial terms', image: 'https://indiagully.com/images/old.webp', price_label: 'Old price' };
  const saved = [{ entry, saved_at: now, cached_at: now, withdrawn: false }];
  const next = reconcileSaved(saved, { ...feed, listings: [], generated_at: '2026-11-20T10:00:00.000Z' });
  assert.equal(next[0].withdrawn, true); assert.equal(next[0].entry.body, ''); assert.equal(next[0].entry.image, null); assert.equal(next[0].entry.price_label, ''); assert.equal(next[0].saved_at, now);
  assert.ok(!JSON.stringify(next).includes('Old commercial terms'));
});
test('refresh updates a saved item from the public feed and can restore a republished item', () => {
  const feed = parseCatalogue(raw), now = feed.generated_at;
  const result = reconcileSaved([{ entry: { ...feed.listings[0], title: 'Old title' }, saved_at: now, cached_at: now, withdrawn: true }], feed);
  assert.equal(result[0].entry.title, 'Sohna property'); assert.equal(result[0].withdrawn, false);
});
test('HTML is plain text, never executable content', () => {
  assert.equal(plainText('<script>alert(1)</script><p>Hello &amp; welcome</p><p>Our practice</p>'), 'Hello & welcome\n\nOur practice');
});
test('enquiries carry the selected public item without an external destination', () => {
  const entry = parseCatalogue(raw).listings[0]; const url = new URL(enquiryUrl(entry));
  assert.equal(url.origin, 'https://indiagully.com'); assert.equal(url.pathname, '/contact');
  assert.equal(url.searchParams.get('interest'), 'Real Estate Advisory'); assert.equal(url.searchParams.get('message'), `I would like to enquire about ${entry.title}\n${entry.href}`);
  assert.equal(canonicalUrl(url.href), url.href);
});

test('incomplete collections and duplicate records never withdraw saved content', () => {
  for (const key of ['listings','products','perspectives','practices','categories'] as const) {
    assert.throws(() => parseCatalogue({...raw,[key]:null}));
    assert.throws(() => parseCatalogue({...raw,[key]:[{}]}));
    assert.throws(() => parseCatalogue({...raw,[key]:[raw[key][0],raw[key][0]]}));
  }
});
test('withdrawn cache retains no stale commercial or location facts', () => {
 const feed=parseCatalogue(raw), item={entry:feed.listings[0],saved_at:feed.generated_at,cached_at:feed.generated_at,withdrawn:false};
 const withdrawn=reconcileSaved([item],{...feed,listings:[]})[0];
 for(const key of ['city','region','asset_class','transaction_type','category','brand','published_at','image_alt'] as const)assert.equal(withdrawn.entry[key], '');
 assert.equal(withdrawn.entry.title,item.entry.title);
});
test('native excerpts show truncation and decode common typographic entities', () => {
 assert.equal(plainText('&#8377; 1 &ndash; 2 &#x2022; &copy;'), '₹ 1 – 2 • ©');
 assert.equal(parseCatalogue({...raw,perspectives:[{...raw.perspectives[0],body:'x'.repeat(13000)}]}).perspectives[0].body_truncated,true);
});

test('closed listing statuses persist in app caches and enquiries ask for alternatives',()=>{
 const feed=parseCatalogue({...raw,listings:[{...raw.listings[0],listing_status:'sold',listing_status_text:'Successfully transacted · Sold',listing_is_available:false}]});
 assert.equal(feed.listings[0].listing_is_available,false);
 assert.equal(feed.listings[0].listing_status_text,'Successfully transacted · Sold');
 const cached=parseCatalogue(JSON.parse(JSON.stringify(feed)));
 assert.equal(cached.listings[0].listing_status,'sold');
 assert.match(new URL(enquiryUrl(cached.listings[0])).searchParams.get('message')||'',/available alternatives/);
 const expired={...feed.listings[0],listing_archived:true,listing_archive_until:'2020-01-01T00:00:00Z'};
 assert.equal(parseCatalogue({...raw,listings:[expired]}).listings.length,0);
 const saved=parseSaved([{entry:expired,saved_at:raw.generated_at,cached_at:raw.generated_at}]);
 assert.equal(saved[0].withdrawn,true);assert.equal(saved[0].entry.body,'');
});
