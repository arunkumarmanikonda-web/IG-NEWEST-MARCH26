import test from 'node:test';
import assert from 'node:assert/strict';
import { mobileCatalogue, mobilePublicUrl } from '../lib/mobile-catalogue.mjs';
import { residencesDefaults } from '../lib/residences.mjs';

const record = { id: 'public-1', kind: 'opportunity', slug: 'public-hotel', title: 'A public hotel', summary: 'Approved brief', body: 'Details', public_data: { image: '/images/hotel.webp', city: 'Noida', private_notes: 'DO NOT EXPOSE', client_id: 'secret' }, tags: [{ label: 'Hotel' }, { label: 'Retired', active: false }], private_data: 'DO NOT EXPOSE' };
test('mobile catalogue projects public fields and excludes drafts and settings', () => {
  const result = mobileCatalogue({ records: [record, { ...record, status: 'draft' }, { ...record, kind: 'page' }, { ...record, slug: '../admin' }], residences: residencesDefaults });
  assert.equal(result.listings.length, 1);
  assert.equal(result.listings[0].href, '/opportunities/public-hotel');
  assert.deepEqual(result.listings[0].tags, ['Hotel']);
  assert.equal(result.residences, null);
  assert.equal(JSON.stringify(result).includes('DO NOT EXPOSE'), false);
  assert.equal(JSON.stringify(result).includes('client_id'), false);
});
test('all records are retained while oversized briefs are explicitly marked', () => {
  const records = Array.from({ length: 310 }, (_, i) => ({ ...record, id: String(i), slug: 'hotel-' + i, body: 'a'.repeat(13000) }));
  const result = mobileCatalogue({ records, residences: residencesDefaults });
  assert.equal(result.listings.length, 310);
  assert.equal(result.listings[0].body.length, 12000);
  assert.equal(result.listings[0].body_truncated, true);
});
test('native destinations reject hostile URLs and retain canonical query strings', () => {
  for (const value of ['javascript:alert(1)', '//evil.test', 'https://indiagully.com.evil.test/x', 'https://user:pass@indiagully.com/x', '/\\evil.test', 'intent://x', '/bad\npath']) assert.equal(mobilePublicUrl(value), '');
  assert.equal(mobilePublicUrl('https://indiagully.com/horeca?category=lighting#catalogue'), '/horeca?category=lighting#catalogue');
});
test('product category grouping uses approved CMS categories with complete counts', () => {
  const product = { ...record, kind: 'product', public_data: { category: 'glassware', sku: 'G-1', image: '/images/glass.webp' } };
  const result = mobileCatalogue({ records: [product], residences: residencesDefaults });
  assert.equal(result.products[0].category, 'glassware');
  assert.equal(result.products[0].sku, 'G-1');
  assert.equal(result.categories.find(c => c.id === 'glassware').count, 1);
});
test('native launch uses the same publication window and excludes admin settings', () => {
  const residences = { ...residencesDefaults, enabled: true, startsAt: '2032-01-01T00:00:00Z', endsAt: '2032-02-01T00:00:00Z', image: '/images/library/approved.jpg', imageAlt: 'Approved project view' };
  assert.equal(mobileCatalogue({ residences, now: Date.parse('2031-12-31T23:59:59Z') }).residences, null);
  const launch = mobileCatalogue({ residences, now: Date.parse(residences.startsAt) }).residences;
  assert.equal(launch.title, 'India Gully Residences');
  assert.equal(launch.image_alt, residences.imageAlt);
  assert.equal(launch.cta_href, residences.ctaHref);
  assert.equal(Object.hasOwn(launch, 'startsAt'), false);
  assert.equal(mobileCatalogue({ residences, now: Date.parse(residences.endsAt) }).residences, null);
});

test('native catalogue carries status, retains bounded archives and removes them exactly at expiry',()=>{
 const now=Date.parse('2032-01-01T00:00:00Z');
 const sold={...record,id:'sold',slug:'sold',public_data:{...record.public_data,listing_status:'sold',listing_status_label:'Successfully transacted'}};
 const archived={...record,id:'archive',slug:'archive',public_data:{...record.public_data,listing_status:'reserved',listing_archived:true,listing_archive_until:'2032-01-02T00:00:00Z'}};
 const result=mobileCatalogue({records:[sold,archived,record],now});
 assert.equal(result.listings[0].id,record.id);
 assert.equal(result.listings[1].listing_status_text,'Successfully transacted · Sold');
 assert.equal(result.listings[1].listing_is_available,false);
 assert.match(result.listings[1].summary,/Sold.*not a current available offer/);
 assert.equal(result.listings[2].listing_archived,true);
 const after=mobileCatalogue({records:[sold,archived,record],now:Date.parse(archived.public_data.listing_archive_until)});
 assert.deepEqual(after.listings.map(r=>r.id),[record.id,'sold']);
});
