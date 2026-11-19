import { contentPath } from './content-routes.mjs';
import { horecaCategory, categoryHref } from './horeca-categories.mjs';
import { collectionDirectory } from './horeca-collections.mjs';
import { publicResidences } from './residences.mjs';

const origin = 'https://indiagully.com';
const kinds = new Set(['opportunity', 'retail_space', 'retail_requirement', 'product', 'article']);
const string = (value, limit = 2000) => typeof value === 'string' ? value.slice(0, limit) : typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
// Native screens use only our public website. Never allow a CMS URL to open a
// custom scheme, credentials, another origin, or a protocol-relative redirect.
export function mobilePublicUrl(value) {
  if (typeof value !== 'string' || !value || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return '';
  try {
    const url = new URL(value, origin);
    return url.origin === origin && !url.username && !url.password ? url.pathname + url.search + url.hash : '';
  } catch { return ''; }
}
export function mobilePublicMedia(value) {
  if (typeof value !== 'string' || !value) return '';
  if (value.length <= 28000 && /^data:image\/webp;base64,UklGR[A-Za-z0-9+/]+=*$/.test(value)) return value;
  const local = mobilePublicUrl(value);
  if (local) return local;
  if (value.length > 2000 || /[\\\u0000-\u0020]/.test(value)) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && url.hostname.includes('.') ? url.href : '';
  } catch { return ''; }
}
function base(record) {
  const data = record.public_data || {};
  const body = string(record.body, 12000);
  return {
    id: string(record.id, 100), slug: record.slug, title: string(record.title, 400),
    summary: string(record.summary, 3000), body,
    body_truncated: typeof record.body === 'string' && record.body.length > body.length,
    href: contentPath(record), image: mobilePublicMedia(data.image),
    image_alt: string(data.image_alt || record.title, 500),
  };
}
// Input is exclusively ig_public_content and public website configuration.
// Keep an explicit projection: future CMS fields must not silently enter apps.
export function mobileCatalogue({ records = [], practices = [], collections, residences, now = Date.now() } = {}) {
  const publicRecords = records.filter(r => r && kinds.has(r.kind) && (!r.status || r.status === 'published') && /^[a-z0-9][a-z0-9-]{0,199}$/.test(r.slug || '') && r.id && r.title);
  const products = publicRecords.filter(r => r.kind === 'product');
  const launch = publicResidences(residences, now);
  return {
    schema_version: 1, generated_at: new Date(now).toISOString(),
    residences: launch ? {
      title: launch.name, headline: launch.headline, description: launch.description,
      location: launch.location, image: mobilePublicMedia(launch.image), image_alt: launch.imageAlt,
      logo: mobilePublicMedia(launch.logo), video: mobilePublicMedia(launch.video),
      cta_label: launch.ctaLabel, cta_href: mobilePublicUrl(launch.ctaHref) || '/residences', href: '/residences',
    } : null,
    listings: publicRecords.filter(r => ['opportunity', 'retail_space', 'retail_requirement'].includes(r.kind)).map(r => {
      const d = r.public_data || {};
      return { ...base(r), kind: r.kind, city: string(d.city || d.markets), region: string(d.region),
        asset_class: string(d.asset_class || d.formats), transaction_type: string(d.transaction_type || (r.kind === 'opportunity' ? '' : 'Lease')),
        price_label: string(d.price_label), area: string(d.area), area_unit: string(d.area_unit), keys: string(d.keys),
        tags: (Array.isArray(r.tags) ? r.tags : []).filter(t => t && t.active !== false).map(t => string(t.label, 150)).filter(Boolean),
      };
    }),
    products: products.map(r => {
      const d = r.public_data || {};
      return { ...base(r), category: horecaCategory(r).id, sku: string(d.sku), brand: string(d.brand), moq: string(d.moq), pack_size: string(d.pack_size) };
    }),
    categories: collectionDirectory(products, collections).map(c => ({ id: c.id, title: c.title, description: c.description, image: mobilePublicMedia(c.image), href: categoryHref(c.id), count: c.count })),
    perspectives: publicRecords.filter(r => r.kind === 'article').map(r => ({ ...base(r), published_at: string(r.published_at, 100) })),
    practices: practices.filter(p => /^[a-z0-9-]+$/.test(p.slug || '')).map(p => ({ slug: p.slug, title: string(p.title, 400), intro: string(p.intro, 5000), href: mobilePublicUrl(p.href || '/practices/' + p.slug) })),
    links: { portal: '/account', gullu: '/gullu', privacy: '/privacy', contact: '/contact', delete_account: '/account/privacy' },
  };
}
