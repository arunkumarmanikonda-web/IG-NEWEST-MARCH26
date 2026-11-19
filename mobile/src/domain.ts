export const ORIGIN = 'https://indiagully.com';
export const FEED_URL = `${ORIGIN}/api/mobile/catalogue`;
// Staff authentication is a fixed app action. Catalogue links and deep links
// cannot supply administrative URLs or bypass the website's role/verification checks.
export const STAFF_SIGN_IN_URL = `${ORIGIN}/login`;
const PUBLIC_PATHS = /^\/(?:$|opportunities(?:\/|$)|retail-leasing(?:\/|$)|horeca(?:\/|$)|insights(?:\/|$)|practices(?:\/|$)|residences(?:\/|$)|leadership(?:\/|$)|about(?:\/|$)|contact(?:\/|$)|privacy(?:\/|$)|account(?:\/|$)|login(?:\/|$)|gullu(?:\/|$))/;

/** Every outbound link is HTTPS on our exact first-party origin. */
export function canonicalUrl(value: unknown, image = false): string | null {
  if (typeof value !== 'string' || !value.trim() || value.length > 4096) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value, ORIGIN);
    if (url.origin !== ORIGIN || url.username || url.password) return null;
    if (/%2f|%5c|%2e/i.test(url.pathname)) return null;
    if (image ? !/^\/(?:images|brand|uploads|media|assets|api\/public-media|api\/content\/image)\//.test(url.pathname) : !PUBLIC_PATHS.test(url.pathname)) return null;
    // Do not accept externally supplied redirect targets or authenticated admin URLs.
    if ([...url.searchParams.keys()].some(key => /redirect|return|next|callback|token|code|secret/i.test(key))) return null;
    return url.href;
  } catch { return null; }
}

const namedEntities: Record<string, string> = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  ndash: '–', mdash: '—', bull: '•', middot: '·', hellip: '…',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', copy: '©', reg: '®', trade: '™',
  euro: '€', pound: '£', yen: '¥', rupee: '₹', times: '×', divide: '÷',
  ensp: ' ', emsp: ' ', thinsp: ' ',
};
function decodeEntities(value: string): string {
  return value.replace(/&(#(?:x[0-9a-f]+|[0-9]+)|[a-z][a-z0-9]+);/gi, (entity, code: string) => {
    if (!code.startsWith('#')) return namedEntities[code.toLowerCase()] ?? entity;
    const hex = code[1].toLowerCase() === 'x';
    const point = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
    if (!Number.isInteger(point) || point <= 0 || point > 0x10ffff || (point >= 0xd800 && point <= 0xdfff) ||
      (point < 0x20 && ![9, 10, 13].includes(point)) || (point >= 0x7f && point <= 0x9f)) return '\ufffd';
    return String.fromCodePoint(point);
  });
}
export function plainText(value: unknown, max = 12000): string {
  if (typeof value !== 'string') return '';
  const stripped = value.slice(0, max).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/(?:p|div|h[1-6]|li)>/gi, '\n\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
  // Decode after removing markup. The result is rendered only as native Text.
  return decodeEntities(stripped)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/^#{1,6}\s+/gm, '').replace(/\*\*/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

export type ListingKind = 'opportunity' | 'promoter' | 'brand';
export type EntryType = 'listing' | 'product' | 'perspective' | 'practice';
export interface Entry {
  id: string; type: EntryType; kind?: ListingKind; title: string; summary: string; body: string; href: string;
  image: string | null; image_alt: string; tags: string[]; city: string; region: string; asset_class: string;
  transaction_type: string; price_label: string; area: string; area_unit: string; keys: string;
  category: string; sku: string; brand: string; moq: string; pack_size: string; published_at: string; body_truncated: boolean;
}
export interface Category { id: string; title: string; description: string; image: string | null; href: string; count?: number }
export interface Residence { title: string; headline: string; description: string; location: string; image: string | null; image_alt: string; href: string; cta_label: string; cta_href: string }
export interface Catalogue {
  schema_version: 1; generated_at: string; residences: Residence | null; listings: Entry[]; products: Entry[];
  categories: Category[]; perspectives: Entry[]; practices: Entry[];
  links: { portal: string; gullu: string; privacy: string; contact: string; delete_account: string };
}
type RecordValue = Record<string, unknown>;
function obj(value: unknown): RecordValue { return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {}; }
function text(value: unknown, max = 400): string { return plainText(typeof value === 'number' ? String(value) : value, max); }
function items(value: unknown): unknown[] { return Array.isArray(value) ? value.slice(0, 5000) : []; }
function date(value: unknown): string { return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : ''; }
export function parseEntry(value: unknown, type: EntryType): Entry | null {
  const v = obj(value); const href = canonicalUrl(v.href); const id = text(v.id || v.slug, 180); const title = text(v.title, 400);
  if (!href || !id || !title) return null;
  const kind = /brand|requirement/i.test(text(v.kind)) ? 'brand' : /promoter|lease|leasing|space/i.test(text(v.kind)) ? 'promoter' : 'opportunity';
  const sourceBody = v.body || v.intro;
  return {
    id, type, kind: type === 'listing' ? kind : undefined, title, summary: text(v.summary || v.intro, 1500), body: text(v.body || v.intro, 12000), href,
    image: canonicalUrl(v.image, true), image_alt: text(v.image_alt, 250), tags: items(v.tags).map(t => text(t, 100)).filter(Boolean).slice(0, 30),
    city: text(v.city), region: text(v.region), asset_class: text(v.asset_class), transaction_type: text(v.transaction_type), price_label: text(v.price_label),
    area: text(v.area), area_unit: text(v.area_unit), keys: text(v.keys), category: text(v.category), sku: text(v.sku), brand: text(v.brand),
    moq: text(v.moq), pack_size: text(v.pack_size), published_at: date(v.published_at),
    body_truncated: v.body_truncated === true || (typeof sourceBody === 'string' && sourceBody.length > 12000),
  };
}
function entries(values: unknown, type: EntryType): Entry[] {
  const seen = new Set<string>();
  return (values as unknown[]).map(value => {
    const entry = parseEntry(value, type);
    if (!entry || seen.has(entry.id) || (type === 'listing' &&
      !['opportunity', 'retail_space', 'retail_requirement', 'promoter', 'brand'].includes(String(obj(value).kind)))) {
      throw new Error('The catalogue contains incomplete or duplicate entries. Please refresh or browse our website.');
    }
    seen.add(entry.id);
    return entry;
  });
}
export function parseCatalogue(value: unknown): Catalogue {
  const v = obj(value); const generated_at = date(v.generated_at);
  if (v.schema_version !== 1 || !generated_at) throw new Error('The catalogue format has changed. Please update the app or browse our website.');
  for (const key of ['listings', 'products', 'perspectives', 'practices', 'categories']) {
    if (!Array.isArray(v[key])) throw new Error('The catalogue is incomplete. Please refresh or browse our website.');
    if (v[key].length > 5000) throw new Error('This catalogue is too large for this app version. Please browse our website.');
  }
  const r = obj(v.residences); const rhref = canonicalUrl(r.href); const links = obj(v.links);
  const link = (key: string, fallback: string) => canonicalUrl(links[key]) || `${ORIGIN}${fallback}`;
  const categoryIds = new Set<string>();
  const categories = (v.categories as unknown[]).map(item => {
    const c = obj(item), id = text(c.id), title = text(c.title), href = canonicalUrl(c.href);
    if (!id || !title || !href || categoryIds.has(id) || (c.count !== undefined &&
      (typeof c.count !== 'number' || !Number.isInteger(c.count) || c.count < 0))) {
      throw new Error('The catalogue contains incomplete or duplicate collections. Please refresh or browse our website.');
    }
    categoryIds.add(id);
    return { id, title, description: text(c.description, 1000), image: canonicalUrl(c.image, true), href, count: c.count as number | undefined };
  });
  return {
    schema_version: 1, generated_at,
    residences: rhref && text(r.title) ? { title: text(r.title), headline: text(r.headline), description: text(r.description, 2000), location: text(r.location), image: canonicalUrl(r.image, true), image_alt: text(r.image_alt), href: rhref, cta_label: text(r.cta_label) || 'Explore Residences', cta_href: canonicalUrl(r.cta_href) || rhref } : null,
    listings: entries(v.listings, 'listing'), products: entries(v.products, 'product'), perspectives: entries(v.perspectives, 'perspective'), practices: entries(v.practices, 'practice'),
    categories,
    links: { portal: link('portal', '/account'), gullu: link('gullu', '/gullu'), privacy: link('privacy', '/privacy'), contact: link('contact', '/contact'), delete_account: link('delete_account', '/account/privacy') },
  };
}

export function filterEntries(entries: Entry[], query: string, kind = 'all', city = 'all', category = 'all'): Entry[] {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return entries.filter(e => (kind === 'all' || e.kind === kind) && (city === 'all' || e.city === city) && (category === 'all' || e.category === category)
    && words.every(word => [e.title, e.summary, e.city, e.region, e.sku, e.brand, e.asset_class, e.category, ...e.tags].join(' ').toLowerCase().includes(word)));
}

export interface SavedEntry { entry: Entry; saved_at: string; cached_at: string; withdrawn: boolean }
export function entryKey(entry: Pick<Entry, 'type' | 'id'>): string { return `${entry.type}:${entry.id}`; }
function withdrawnEntry(entry: Entry): Entry {
  // Keep identity, title and the public route for matching/removal, never old facts.
  return { id: entry.id, type: entry.type, kind: entry.kind, title: entry.title, href: entry.href,
    summary: '', body: '', image: null, image_alt: '', tags: [], city: '', region: '', asset_class: '',
    transaction_type: '', price_label: '', area: '', area_unit: '', keys: '', category: '', sku: '', brand: '',
    moq: '', pack_size: '', published_at: '', body_truncated: false };
}
export function parseSaved(value: unknown): SavedEntry[] {
  return items(value).map(item => {
    const s = obj(item), e = obj(s.entry);
    if (!['listing', 'product', 'perspective', 'practice'].includes(String(e.type))) return null;
    const entry = parseEntry(e, e.type as EntryType), saved_at = date(s.saved_at), cached_at = date(s.cached_at);
    return entry && saved_at && cached_at ? { entry: s.withdrawn === true ? withdrawnEntry(entry) : entry, saved_at, cached_at, withdrawn: s.withdrawn === true } : null;
  }).filter((v): v is SavedEntry => !!v).slice(0, 250);
}
export function reconcileSaved(saved: SavedEntry[], feed: Catalogue): SavedEntry[] {
  const current = new Map([...feed.listings, ...feed.products, ...feed.perspectives, ...feed.practices].map(e => [entryKey(e), e]));
  return saved.map(s => {
    const entry = current.get(entryKey(s.entry));
    if (entry) return { ...s, entry, cached_at: feed.generated_at, withdrawn: false };
    return { ...s, entry: withdrawnEntry(s.entry), cached_at: feed.generated_at, withdrawn: true };
  });
}
export function deepLinkUrl(input: string): string | null {
  if (!input.startsWith('indiagully://')) return canonicalUrl(input);
  const rest = input.slice('indiagully://'.length);
  if (!rest || /[\\@]/.test(rest)) return null;
  return canonicalUrl(`${ORIGIN}/${rest.replace(/^\/+/, '')}`);
}
export function enquiryUrl(entry: Pick<Entry, 'title' | 'href' | 'type' | 'kind'>, base = `${ORIGIN}/contact`): string {
  const url = new URL(canonicalUrl(base) || `${ORIGIN}/contact`);
  url.searchParams.set('interest', entry.type === 'product' ? 'HORECA procurement' : entry.type === 'listing' ? entry.kind === 'opportunity' ? 'Real Estate Advisory' : 'Retail & Leasing' : entry.title.slice(0, 120));
  url.searchParams.set('message', `I would like to enquire about ${entry.title}\n${entry.href}`.slice(0, 1400));
  return url.href;
}
export function formatDate(value: string): string {
  try { return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)); } catch { return 'an earlier visit'; }
}
